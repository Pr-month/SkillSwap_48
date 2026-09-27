import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: {
        id: true,
        name: true,
        email: true,
        about: true,
        birthdate: true,
        city: true,
        gender: true,
        avatar: true,
        role: true,
      },
    });
  }

  async findMe(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    return user;
  }

  async updateMe(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    Object.assign(user, dto);
    return this.usersRepository.save(user);
  }

  async updatePassword(id: string, dto: UpdatePasswordDto): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    const matches = await bcrypt.compare(dto.oldPassword, user.password);
    if (!matches) {
      throw new UnauthorizedException('Неверный старый пароль');
    }
    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.usersRepository.save(user);
  }
}
