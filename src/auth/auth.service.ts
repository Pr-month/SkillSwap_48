import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { QueryFailedError, Repository } from 'typeorm';
import { appConfig } from '../config/app.config';
import type { TAppConfig } from '../config/app.config';
import { jwtConfig } from '../config/jwt.config';
import type { TJwtConfig } from '../config/jwt.config';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/users.enums';
import type { JwtPayload } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwt: TJwtConfig,
    @Inject(appConfig.KEY)
    private readonly app: TAppConfig,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { email: loginDto.email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        about: true,
        birthdate: true,
        city: true,
        gender: true,
        avatar: true,
        role: true,
      },
    });

    const passwordValid =
      !!user && (await bcrypt.compare(loginDto.password, user.password));

    if (!user || !passwordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    await this.persistRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.toPublicUser(user),
      ...tokens,
    };
  }

  async register(registerDto: RegisterDto) {
    const email = registerDto.email.toLowerCase();

    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const password = await bcrypt.hash(registerDto.password, this.app.hashSalt);

    try {
      const user = this.usersRepository.create({
        name: registerDto.name,
        email,
        password,
        about: registerDto.about,
        birthdate: registerDto.birthdate,
        city: registerDto.city,
        gender: registerDto.gender,
        avatar: registerDto.avatar ?? '',
        role: UserRole.USER,
      });

      const savedUser = await this.usersRepository.save(user);

      const tokens = await this.issueTokens(
        savedUser.id,
        savedUser.email,
        savedUser.role,
      );

      await this.persistRefreshToken(savedUser.id, tokens.refreshToken);

      return {
        user: this.toPublicUser(savedUser),
        ...tokens,
      };
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { driverError?: { code?: string } })
          .driverError?.code === '23505'
      ) {
        throw new ConflictException(
          'Пользователь с таким email уже существует',
        );
      }
      throw error;
    }
  }

  refresh(refreshDto: RefreshDto) {
    return {
      message: 'This action refreshes a token',
      token: refreshDto,
    };
  }

  private async issueTokens(userId: string, email: string, role: UserRole) {
    const payload: JwtPayload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.jwt.accessSecret,
        expiresIn: this.jwt.accessExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.jwt.refreshSecret,
        expiresIn: this.jwt.refreshExpiresIn,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async persistRefreshToken(userId: string, refreshToken: string) {
    const refreshTokenHash = await bcrypt.hash(refreshToken, this.app.hashSalt);
    await this.usersRepository.update(userId, {
      refreshToken: refreshTokenHash,
    });
  }

  private toPublicUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      about: user.about,
      birthdate: user.birthdate,
      city: user.city,
      gender: user.gender,
      avatar: user.avatar,
      role: user.role,
    };
  }
}
