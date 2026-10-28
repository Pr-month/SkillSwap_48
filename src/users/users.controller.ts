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
import { ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import type { AuthRequest } from '../auth/auth.types';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import {
  ApiFindAllUsers,
  ApiGetMe,
  ApiUpdateMe,
  ApiUpdatePassword,
} from './decorators/users-swagger.decorator';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiFindAllUsers()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(AccessTokenGuard)
  @Get('me')
  @ApiGetMe()
  getMe(@Req() req: AuthRequest) {
    return this.usersService.findMe(req.user.sub);
  }

  @UseGuards(AccessTokenGuard)
  @Patch('me')
  @ApiUpdateMe()
  updateMe(
    @Req() req: AuthRequest,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateMe(req.user.sub, dto);
  }

  @UseGuards(AccessTokenGuard)
  @Patch('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiUpdatePassword()
  updatePassword(
    @Req() req: AuthRequest,
    @Body() dto: UpdatePasswordDto,
  ) {
    return this.usersService.updatePassword(req.user.sub, dto);
  }
}