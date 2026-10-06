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
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import type { AuthRequest } from '../auth/auth.types';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(AccessTokenGuard)
  @Get('me')
  getMe(@Req() req: AuthRequest) {
    return this.usersService.findMe(req.user.sub);
  }

  @UseGuards(AccessTokenGuard)
  @Patch('me')
  updateMe(
    @Req() req: AuthRequest,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateMe(req.user.sub, dto);
  }

  @UseGuards(AccessTokenGuard)
  @Patch('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  updatePassword(
    @Req() req: AuthRequest,
    @Body() dto: UpdatePasswordDto,
  ) {
    return this.usersService.updatePassword(req.user.sub, dto);
  }
}
