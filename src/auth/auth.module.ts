// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { jwtConfig } from '../config/jwt.config';
import type { TJwtConfig } from '../config/jwt.config';
import { City } from '../cities/entities/city.entity';
import { User } from '../users/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccessTokenStrategy } from './strategies/accessToken.strategy';
import { RefreshTokenStrategy } from './strategies/refreshToken.strategy';
import { AccessTokenGuard } from './guards/accessToken.guard';
import { RefreshTokenGuard } from './guards/refreshToken.guard';
import { WsJwtGuard } from './guards/wsJwt.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, City]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [jwtConfig.KEY],
      useFactory: (config: TJwtConfig) => ({
        secret: config.accessSecret,
        signOptions: { expiresIn: config.accessExpiresIn },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    AccessTokenGuard,
    RefreshTokenGuard,
    WsJwtGuard,
  ],
  exports: [AuthService, WsJwtGuard],
})
export class AuthModule {}