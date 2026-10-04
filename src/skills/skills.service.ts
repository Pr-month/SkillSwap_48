import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { GetSkillsDto } from './dto/get-skills.dto';
import { Skill } from './entities/skill.entity';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,
  ) {}

  create(createSkillDto: CreateSkillDto) {
    void createSkillDto;
    return 'This action adds a new skill';
  }

  async findAll({ page = 1, limit = 10 }: GetSkillsDto) {
    const [data, total] = await this.skillsRepository.findAndCount({
      order: { id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} skill`;
  }

  async update(
    id: number,
    updateSkillDto: UpdateSkillDto,
    userId: number,
  ): Promise<Skill> {
    const skill = await this.skillsRepository.findOne({ where: { id } });

    if (!skill) {
      throw new NotFoundException(`Skill with id ${id} not found`);
    }

    // TODO: убрать `as any` после мержа skill.entity (задача axeliriya)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if ((skill as any).owner?.id !== userId) {
      throw new ForbiddenException('You can only update your own skills');
    }

    Object.assign(skill, updateSkillDto);
    return this.skillsRepository.save(skill);
  }

  remove(id: number) {
    return `This action removes a #${id} skill`;
  }
}
