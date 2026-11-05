import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { appConfig } from '../config/app.config';
import type { TAppConfig } from '../config/app.config';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Gender, UserRole } from './users.enums';
import { UsersService } from './users.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

type UsersRepositoryMock = jest.Mocked<
  Pick<Repository<User>, 'find' | 'findOne' | 'save'>
>;

const compareMock = bcrypt.compare as unknown as jest.MockedFunction<
  (value: string, encryptedValue: string) => Promise<boolean>
>;

const hashMock = bcrypt.hash as unknown as jest.MockedFunction<
  (value: string, saltRounds: number) => Promise<string>
>;

describe('UsersService', () => {
  let service: UsersService;

  const usersRepository: UsersRepositoryMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const config: TAppConfig = {
    port: 3000,
    hashSalt: 10,
    isProduction: false,
  };

  const createUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-1',
    name: 'Анна Васильева',
    email: 'user1@example.com',
    password: 'old-password-hash',
    about: 'О пользователе',
    birthdate: '1995-05-15',
    city: 'Москва',
    gender: Gender.FEMALE,
    avatar: '',
    skills: [],
    wantToLearn: [],
    favoriteSkills: [],
    role: UserRole.USER,
    refreshToken: null,
    ...overrides,
  });

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
        {
          provide: appConfig.KEY,
          useValue: config,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns users without private fields', async () => {
      const users = [createUser()];
      usersRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(usersRepository.find).toHaveBeenCalledWith({
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
      expect(result).toBe(users);
    });
  });

  describe('findMe', () => {
    it('returns the current user', async () => {
      const user = createUser();
      usersRepository.findOne.mockResolvedValue(user);

      const result = await service.findMe(user.id);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: user.id },
      });
      expect(result).toBe(user);
    });

    it('throws NotFoundException when the user does not exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.findMe('missing-user')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateMe', () => {
    it('updates and saves the current user', async () => {
      const user = createUser();
      const dto: UpdateUserDto = {
        name: 'Новое имя',
        city: 'Калининград',
      };
      const savedUser = {
        ...user,
        ...dto,
      };

      usersRepository.findOne.mockResolvedValue(user);
      usersRepository.save.mockResolvedValue(savedUser);

      const result = await service.updateMe(user.id, dto);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: user.id },
      });
      expect(user).toMatchObject(dto);
      expect(usersRepository.save).toHaveBeenCalledWith(user);
      expect(result).toBe(savedUser);
    });

    it('throws NotFoundException when the user does not exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateMe('missing-user', { name: 'Новое имя' }),
      ).rejects.toThrow(NotFoundException);

      expect(usersRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('updatePassword', () => {
    const dto: UpdatePasswordDto = {
      oldPassword: 'user1234',
      newPassword: 'newPassword123',
    };

    it('throws NotFoundException when the user does not exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.updatePassword('missing-user', dto)).rejects.toThrow(
        NotFoundException,
      );

      expect(compareMock).not.toHaveBeenCalled();
      expect(hashMock).not.toHaveBeenCalled();
      expect(usersRepository.save).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when the old password is incorrect', async () => {
      const user = createUser();
      usersRepository.findOne.mockResolvedValue(user);
      compareMock.mockResolvedValue(false);

      await expect(service.updatePassword(user.id, dto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(compareMock).toHaveBeenCalledWith(dto.oldPassword, user.password);
      expect(hashMock).not.toHaveBeenCalled();
      expect(usersRepository.save).not.toHaveBeenCalled();
    });

    it('hashes and saves the new password', async () => {
      const user = createUser();
      const newPasswordHash = 'new-password-hash';

      usersRepository.findOne.mockResolvedValue(user);
      compareMock.mockResolvedValue(true);
      hashMock.mockResolvedValue(newPasswordHash);
      usersRepository.save.mockResolvedValue(user);

      await expect(
        service.updatePassword(user.id, dto),
      ).resolves.toBeUndefined();

      expect(compareMock).toHaveBeenCalledWith(
        dto.oldPassword,
        'old-password-hash',
      );
      expect(hashMock).toHaveBeenCalledWith(dto.newPassword, config.hashSalt);
      expect(user.password).toBe(newPasswordHash);
      expect(usersRepository.save).toHaveBeenCalledWith(user);
    });
  });
});
