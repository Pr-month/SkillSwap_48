import { Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';

@Injectable()
export class AuthService {
  login(loginDto: LoginDto) {
    return {
      message: 'This action logs in a user',
      user: loginDto,
    };
  }

  register(registerDto: RegisterDto) {
    return {
      message: 'This action registers a new user',
      user: registerDto,
    };
  }

  refresh(refreshDto: RefreshDto) {
    return {
      message: 'This action refreshes a token',
      token: refreshDto,
    };
  }
}
