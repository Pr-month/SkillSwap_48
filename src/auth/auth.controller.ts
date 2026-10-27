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
import type { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { appConfig } from '../config/app.config';
import type { TAppConfig } from '../config/app.config';
import { REFRESH_TOKEN_COOKIE } from './auth.constants';
import { AuthService } from './auth.service';
import type { AuthRequest, RefreshTokenPayload } from './auth.types';
import {
  ApiLogin,
  ApiLogout,
  ApiRefresh,
  ApiRegister,
} from './decorators/auth-swagger.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AccessTokenGuard } from './guards/accessToken.guard';
import { RefreshTokenGuard } from './guards/refreshToken.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(appConfig.KEY)
    private readonly app: TAppConfig,
  ) {}

  @ApiLogin()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } =
      await this.authService.login(loginDto);

    const expires = this.authService.getRefreshTokenExpiration(refreshToken);

    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.app.isProduction,
      path: '/',
      ...(expires && { expires }),
    });

    return { user, accessToken };
  }

  @ApiRegister()
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } =
      await this.authService.register(registerDto);

    const expires = this.authService.getRefreshTokenExpiration(refreshToken);

    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.app.isProduction,
      path: '/',
      ...(expires && { expires }),
    });

    return { user, accessToken };
  }

  @ApiRefresh()
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: { user: RefreshTokenPayload },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.refresh(
      req.user,
    );

    const expires = this.authService.getRefreshTokenExpiration(refreshToken);

    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.app.isProduction,
      path: '/',
      ...(expires && { expires }),
    });

    return { accessToken };
  }

  @ApiLogout()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard)
  async logout(
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.logout(req.user.sub);
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });

    return result;
  }
}
