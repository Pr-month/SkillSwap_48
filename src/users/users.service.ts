// src/users/users.service.ts
import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { City } from '../cities/entities/city.entity';
import { appConfig } from '../config/app.config';
import type { TAppConfig } from '../config/app.config';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(City)
    private readonly citiesRepository: Repository<City>,
    @Inject(appConfig.KEY)
    private readonly app: TAppConfig,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      relations: { city: true },
    });
  }

  async findMe(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { city: true },
    });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    return user;
  }

  async updateMe(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { city: true },
    });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (dto.cityId !== undefined) {
      if (dto.cityId === null) {
        user.city = null;
      } else {
        const city = await this.citiesRepository.findOne({
          where: { id: dto.cityId },
        });
        if (!city) {
          throw new NotFoundException('Город не найден');
        }
        user.city = city;
      }
      delete dto.cityId;
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
  user.password = await bcrypt.hash(dto.newPassword, this.app.hashSalt);
  user.refreshToken = null; // <-- отзываем refresh-токен
  await this.usersRepository.save(user);
  }
}
