import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Skill } from '../skills/entities/skill.entity';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { CreateRequestDto } from './dto/create-request.dto';
import { Request } from './entities/request.entity';
import { RequestStatus } from './requests.enums';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { UserRole } from '../users/users.enums';


const ACTIVE_STATUSES = [RequestStatus.PENDING, RequestStatus.IN_PROGRESS];

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(Request)
    private readonly requestsRepository: Repository<Request>,
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,
    private readonly notificationsGateway: NotificationsGateway,
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
    const saved = await this.requestsRepository.save(request);

    this.notificationsGateway.notifyUser(requestedSkill.owner.id, {
      type: 'new',
      skillTitle: requestedSkill.title,
      fromUser: {
        id: senderId,
        name: offeredSkill.owner?.name ?? '',
      },
    });

    return saved;
  }

  findIncoming(userId: string): Promise<Request[]> {
    return this.requestsRepository.find({
      where: { receiver: { id: userId }, status: In(ACTIVE_STATUSES) },
      relations: { sender: true, offeredSkill: true, requestedSkill: true },
      order: { createdAt: 'DESC' },
    });
  }

  findOutgoing(userId: string): Promise<Request[]> {
    return this.requestsRepository.find({
      where: { sender: { id: userId }, status: In(ACTIVE_STATUSES) },
      relations: { receiver: true, offeredSkill: true, requestedSkill: true },
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(
  id: string,
  dto: UpdateRequestStatusDto,
  userId: string,
): Promise<Request> {
  const request = await this.requestsRepository.findOne({
    where: { id },
    relations: { sender: true, receiver: true, requestedSkill: true },
  });
  if (!request) {
    throw new NotFoundException('Заявка не найдена');
  }

  if (request.receiver.id !== userId) {
    throw new ForbiddenException(
      'Только получатель может изменить статус заявки',
    );
  }

  if (request.status !== RequestStatus.PENDING) {
    throw new BadRequestException(
      `Нельзя изменить статус из "${request.status}"`,
    );
  }

  request.status = dto.status;
  request.isRead = true;
  const saved = await this.requestsRepository.save(request);

  this.notificationsGateway.notifyUser(request.sender.id, {
    type: dto.status === RequestStatus.ACCEPTED ? 'accepted' : 'rejected',
    skillTitle: request.requestedSkill.title,
    fromUser: {
      id: request.receiver.id,
      name: request.receiver.name,
    },
  });

  return saved;
}

async remove(
  id: string,
  userId: string,
  userRole: UserRole,
): Promise<void> {
  const request = await this.requestsRepository.findOne({
    where: { id },
    relations: { sender: true },
  });
  if (!request) {
    throw new NotFoundException('Заявка не найдена');
  }

  if (userRole !== UserRole.ADMIN && request.sender.id !== userId) {
    throw new ForbiddenException('Только отправитель может удалить заявку');
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
