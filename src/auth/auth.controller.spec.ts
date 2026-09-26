import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { appConfig } from '../config/app.config';
import { Gender, UserRole } from '../users/users.enums';
import { REFRESH_TOKEN_COOKIE } from './auth.constants';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    login: jest.Mock;
    register: jest.Mock;
    refresh: jest.Mock;
    logout: jest.Mock;
  };

  const registerDto: RegisterDto = {
    name: 'Иван',
    email: 'user@example.com',
    password: 'password123',
    about: 'Немного о себе',
    birthdate: '1995-05-20',
    city: 'Москва',
    gender: Gender.MALE,
  };

  const loginDto: LoginDto = {
    email: 'user@example.com',
    password: 'password123',
  };

  async function createController(isProduction: boolean) {
    const service = {
      login: jest.fn(),
      register: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: service },
        {
          provide: JwtService,
          useValue: {
            decode: jest.fn().mockReturnValue({ exp: 1700000000 }),
          },
        },
        {
          provide: appConfig.KEY,
          useValue: { port: 3000, hashSalt: 10, isProduction },
        },
      ],
    }).compile();

    return {
      controller: module.get<AuthController>(AuthController),
      service,
    };
  }

  beforeEach(async () => {
    ({ controller, service: authService } = await createController(false));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('sets the refresh token as an httpOnly cookie and omits it from the body', async () => {
    authService.register.mockResolvedValue({
      user: { id: 'user-id', email: 'user@example.com' },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    const cookie = jest.fn();
    const res = { cookie } as unknown as Response;

    const result = await controller.register(registerDto, res);

    expect(result).toEqual({
      user: { id: 'user-id', email: 'user@example.com' },
      accessToken: 'access-token',
    });
    expect(result).not.toHaveProperty('refreshToken');
    expect(cookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE,
      'refresh-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        expires: new Date(1700000000 * 1000),
      }),
    );
  });

  it('marks the refresh cookie as secure in production', async () => {
    const prod = await createController(true);
    prod.service.register.mockResolvedValue({
      user: { id: 'user-id', email: 'user@example.com' },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    const cookie = jest.fn();
    const res = { cookie } as unknown as Response;

    await prod.controller.register(registerDto, res);

    expect(cookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE,
      'refresh-token',
      expect.objectContaining({ secure: true }),
    );
  });

  it('logs in and sets the refresh cookie without returning it in the body', async () => {
    authService.login.mockResolvedValue({
      user: { id: 'user-id', email: 'user@example.com' },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    const cookie = jest.fn();
    const res = { cookie } as unknown as Response;

    const result = await controller.login(loginDto, res);

    expect(result).toEqual({
      user: { id: 'user-id', email: 'user@example.com' },
      accessToken: 'access-token',
    });
    expect(result).not.toHaveProperty('refreshToken');
    expect(cookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE,
      'refresh-token',
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('logs out, clears the refresh token and the cookie', async () => {
    authService.logout.mockResolvedValue({ message: 'Вы вышли из аккаунта' });
    const clearCookie = jest.fn();
    const res = { clearCookie } as unknown as Response;
    const req = {
      user: { sub: 'user-id', email: 'user@example.com', role: UserRole.USER },
    };

    const result = await controller.logout(req, res);

    expect(authService.logout).toHaveBeenCalledWith('user-id');
    expect(clearCookie).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE, {
      path: '/',
    });
    expect(result).toEqual({ message: 'Вы вышли из аккаунта' });
  });
});
