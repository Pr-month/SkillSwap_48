import type { Request } from 'express';
import { UserRole } from '../users/users.enums';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export type RefreshTokenPayload = JwtPayload & {
  refreshToken: string;
};

export type AuthRequest = Request & { user: JwtPayload };
