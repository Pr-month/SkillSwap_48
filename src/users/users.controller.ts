// src/users/users.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import type { AuthRequest } from '../auth/auth.types';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Получить список всех пользователей' })
  @ApiResponse({
    status: 200,
    description: 'Список пользователей',
    type: [UserResponseDto],
  })
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(AccessTokenGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить данные текущего пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Данные текущего пользователя',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  getMe(@Req() req: AuthRequest) {
    return this.usersService.findMe(req.user.sub);
  }

  @UseGuards(AccessTokenGuard)
  @Patch('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить данные текущего пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Обновлённые данные пользователя',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  updateMe(
    @Req() req: AuthRequest,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateMe(req.user.sub, dto);
  }

  @UseGuards(AccessTokenGuard)
  @Patch('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить пароль текущего пользователя' })
  @ApiResponse({ status: 204, description: 'Пароль успешно обновлён' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 400, description: 'Неверный старый пароль' })
  updatePassword(
    @Req() req: AuthRequest,
    @Body() dto: UpdatePasswordDto,
  ) {
    return this.usersService.updatePassword(req.user.sub, dto);
  }
}