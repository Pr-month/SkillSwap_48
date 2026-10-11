import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Skill } from '../skills/entities/skill.entity';
import { UserRole } from '../users/users.enums';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { Request } from './entities/request.entity';
import { RequestStatus } from './requests.enums';

const ACTIVE_STATUSES = [RequestStatus.PENDING, RequestStatus.IN_PROGRESS];

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(Request)
    private readonly requestsRepository: Repository<Request>,
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,
  ) {}

  async create(dto: CreateRequestDto, senderId: string): Promise<Request> {
    const offeredSkill = await this.findSkillWithOwner(dto.offeredSkillId);
    if (offeredSkill.owner?.id !== senderId) {
      throw new ForbiddenException('Предлагать можно только свой навык');
    }

    const requestedSkill = await this.findSkillWithOwner(dto.requestedSkillId);
    if (requestedSkill.owner?.id === senderId) {
      throw new BadRequestException('Нельзя отправить заявку самому себе');
    }

    const request = this.requestsRepository.create({
      sender: { id: senderId },
      receiver: { id: requestedSkill.owner.id },
      offeredSkill: { id: offeredSkill.id },
      requestedSkill: { id: requestedSkill.id },
    });
    return this.requestsRepository.save(request);
  }

  findIncoming(userId: string): Promise<Request[]> {
    return this.requestsRepository.find({
      where: { receiver: { id: userId }, status: In(ACTIVE_STATUSES) },
      relations: { sender: true, offeredSkill: true, requestedSkill: true },
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    dto: UpdateRequestDto,
    userId: string,
  ): Promise<Request> {
    const request = await this.requestsRepository.findOne({
      where: { id },
      relations: {
        sender: true,
        receiver: true,
        offeredSkill: true,
        requestedSkill: true,
      },
    });

    if (!request) {
      throw new NotFoundException(`Заявка ${id} не найдена`);
    }

    if (request.receiver?.id !== userId) {
      throw new ForbiddenException('Обновить можно только входящую заявку');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new ConflictException(
        `Принять или отклонить можно только заявку со статусом ${RequestStatus.PENDING}`,
      );
    }

    const { affected } = await this.requestsRepository.update(
      { id, status: RequestStatus.PENDING },
      { status: dto.status, isRead: true },
    );

    // проверку выше могли одновременно пройти два запроса, решение засчитываем первому
    if (!affected) {
      throw new ConflictException('Заявка уже обработана');
    }

    request.status = dto.status;
    request.isRead = true;

    return request;
  }

  async remove(id: string, userId: string, role: UserRole): Promise<void> {
    const request = await this.requestsRepository.findOne({
      where: { id },
      relations: { sender: true },
    });

    if (!request) {
      throw new NotFoundException(`Заявка ${id} не найдена`);
    }

    if (role !== UserRole.ADMIN && request.sender?.id !== userId) {
      throw new ForbiddenException('Удалить можно только свою заявку');
    }

    await this.requestsRepository.remove(request);
  }

  private async findSkillWithOwner(id: string): Promise<Skill> {
    const skill = await this.skillsRepository.findOne({
      where: { id },
      relations: { owner: true },
    });
    if (!skill) {
      throw new NotFoundException(`Навык ${id} не найден`);
    }
    return skill;
  }
}
