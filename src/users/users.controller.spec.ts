import { Test, TestingModule } from '@nestjs/testing';

import type { AuthRequest } from '../auth/auth.types';
import { UserRole } from './users.enums';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

type UsersServiceMock = jest.Mocked<
  Pick<UsersService, 'findAll' | 'findMe' | 'updateMe' | 'updatePassword'>
>;

describe('UsersController', () => {
  let controller: UsersController;

  const usersService: UsersServiceMock = {
    findAll: jest.fn(),
    findMe: jest.fn(),
    updateMe: jest.fn(),
    updatePassword: jest.fn(),
  };

  const userId = 'user-1';

  const request = {
    user: {
      sub: userId,
      email: 'user1@example.com',
      role: UserRole.USER,
    },
  } as AuthRequest;

  const user = {
    id: userId,
    name: 'Анна Васильева',
  } as User;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll returns users from the service', async () => {
    const users = [user];
    usersService.findAll.mockResolvedValue(users);

    await expect(controller.findAll()).resolves.toBe(users);

    expect(usersService.findAll).toHaveBeenCalledTimes(1);
  });

  it('getMe passes the current user id to the service', async () => {
    usersService.findMe.mockResolvedValue(user);

    await expect(controller.getMe(request)).resolves.toBe(user);

    expect(usersService.findMe).toHaveBeenCalledWith(userId);
  });

  it('updateMe passes the current user id and dto to the service', async () => {
    const dto: UpdateUserDto = {
      name: 'Новое имя',
      city: 'Калининград',
    };
    const updatedUser = {
      ...user,
      ...dto,
    } as User;

    usersService.updateMe.mockResolvedValue(updatedUser);

    await expect(controller.updateMe(request, dto)).resolves.toBe(updatedUser);

    expect(usersService.updateMe).toHaveBeenCalledWith(userId, dto);
  });

  it('updatePassword passes the current user id and dto to the service', async () => {
    const dto: UpdatePasswordDto = {
      oldPassword: 'user1234',
      newPassword: 'newPassword123',
    };

    usersService.updatePassword.mockResolvedValue(undefined);

    await expect(
      controller.updatePassword(request, dto),
    ).resolves.toBeUndefined();

    expect(usersService.updatePassword).toHaveBeenCalledWith(userId, dto);
  });
});
