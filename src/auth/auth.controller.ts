import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import { appConfig } from '../config/app.config';
import type { TAppConfig } from '../config/app.config';
import { REFRESH_TOKEN_COOKIE } from './auth.constants';
import { AuthService } from './auth.service';
import type { JwtPayload } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { AccessTokenGuard } from './guards/accessToken.guard';
import { RefreshTokenGuard } from './guards/refreshToken.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    @Inject(appConfig.KEY)
    private readonly app: TAppConfig,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } =
      await this.authService.login(loginDto);

    this.setRefreshTokenCookie(res, refreshToken);

    return { user, accessToken };
  }

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } =
      await this.authService.register(registerDto);

    this.setRefreshTokenCookie(res, refreshToken);

    return { user, accessToken };
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  refresh(@Body() refreshDto: RefreshDto) {
    return this.authService.refresh(refreshDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard)
  async logout(
    @Req() req: { user: JwtPayload },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.logout(req.user.sub);
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });

    return result;
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    const payload = this.jwtService.decode<JwtPayload & { exp?: number }>(
      refreshToken,
    );

    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.app.isProduction,
      path: '/',
      ...(payload?.exp ? { expires: new Date(payload.exp * 1000) } : {}),
    });
  }
}
