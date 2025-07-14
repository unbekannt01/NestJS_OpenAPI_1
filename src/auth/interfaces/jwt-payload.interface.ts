import { UserRole } from 'src/user/entities/user.entity';

export interface JwtPayload {
  id: string;

  role: UserRole;

  jti: string;
}
