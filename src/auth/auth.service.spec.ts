import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { QueryFailedError } from 'typeorm';
import { appConfig } from '../config/app.config';
import { jwtConfig } from '../config/jwt.config';
import { User } from '../users/entities/user.entity';
import { Gender, UserRole } from '../users/users.enums';
import { AuthService } from './auth.service';
import type { JwtPayload } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

describe('AuthService', () => {
  let service: AuthService;
  let signAsync: jest.Mock;
  let usersRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };

  const registerDto: RegisterDto = {
    name: 'Иван',
    email: 'User@Example.com',
    password: 'password123',
    about: 'Немного о себе',
    birthdate: '1995-05-20',
    city: 'Москва',
    gender: Gender.MALE,
  };

  const loginDto: LoginDto = {
    email: 'User@Example.com',
    password: 'password123',
  };

  beforeEach(async () => {
    signAsync = jest.fn().mockResolvedValue('token');
    usersRepository = {
      findOne: jest.fn(),
      create: jest.fn((entity: Partial<User>) => entity),
      save: jest.fn((entity: Partial<User>) => ({ id: 'user-id', ...entity })),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: usersRepository },
        { provide: JwtService, useValue: { signAsync } },
        {
          provide: jwtConfig.KEY,
          useValue: {
            accessSecret: 'access-secret',
            refreshSecret: 'refresh-secret',
            accessExpiresIn: '1h',
            refreshExpiresIn: '7d',
          },
        },
        {
          provide: appConfig.KEY,
          useValue: { port: 3000, hashSalt: 4 },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('registers a user with a hashed password and returns tokens', async () => {
    usersRepository.findOne.mockResolvedValue(null);

    const result = await service.register(registerDto);

    expect(usersRepository.findOne).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
    });
    expect(usersRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
        role: UserRole.USER,
      }),
    );

    const createCalls = usersRepository.create.mock.calls as Array<[User]>;
    const created = createCalls[0][0];
    expect(created.password).not.toBe(registerDto.password);
    await expect(
      bcrypt.compare(registerDto.password, created.password),
    ).resolves.toBe(true);

    expect(usersRepository.update).toHaveBeenCalledTimes(1);
    expect(result.accessToken).toBe('token');
    expect(result.refreshToken).toBe('token');
    expect(result.user).not.toHaveProperty('password');
    expect(result.user).not.toHaveProperty('refreshToken');
  });

  it('issues tokens with the UserRole.USER role in the payload', async () => {
    usersRepository.findOne.mockResolvedValue(null);

    await service.register(registerDto);

    const calls = signAsync.mock.calls as Array<[JwtPayload]>;
    expect(calls[0][0]).toEqual({
      sub: 'user-id',
      email: 'user@example.com',
      role: UserRole.USER,
    });
  });

  it('throws ConflictException when email is already taken', async () => {
    usersRepository.findOne.mockResolvedValue({ id: 'existing-id' });

    await expect(service.register(registerDto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(usersRepository.save).not.toHaveBeenCalled();
  });

  it('throws ConflictException on a race-condition unique violation', async () => {
    usersRepository.findOne.mockResolvedValue(null);
    usersRepository.save.mockRejectedValue(
      new QueryFailedError('INSERT INTO users', [], {
        code: '23505',
      } as unknown as Error),
    );

    await expect(service.register(registerDto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('logs in a user and returns tokens', async () => {
    const passwordHash = await bcrypt.hash('password123', 4);
    usersRepository.findOne.mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
      password: passwordHash,
      name: 'Иван',
      about: 'Немного о себе',
      birthdate: '1995-05-20',
      city: 'Москва',
      gender: Gender.MALE,
      avatar: '',
      role: UserRole.USER,
    });

    const result = await service.login(loginDto);

    expect(usersRepository.findOne).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
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
    expect(usersRepository.update).toHaveBeenCalledTimes(1);
    expect(result.accessToken).toBe('token');
    expect(result.refreshToken).toBe('token');
    expect(result.user).toEqual(
      expect.objectContaining({ id: 'user-id', email: 'user@example.com' }),
    );
    expect(result.user).not.toHaveProperty('password');
    expect(result.user).not.toHaveProperty('refreshToken');
  });

  it('throws UnauthorizedException on wrong password', async () => {
    const passwordHash = await bcrypt.hash('other-password', 4);
    usersRepository.findOne.mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
      password: passwordHash,
      name: 'Иван',
      role: UserRole.USER,
    });

    await expect(service.login(loginDto)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(usersRepository.update).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException for unknown email', async () => {
    usersRepository.findOne.mockResolvedValue(null);

    await expect(service.login(loginDto)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
