import { UserRole } from '../users/users.enums';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}
