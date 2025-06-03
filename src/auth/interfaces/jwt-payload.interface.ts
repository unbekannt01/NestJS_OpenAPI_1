import { UserRole } from 'src/user/entities/user.entity';

/**
 * JwtPayload
 * This interface defines the structure of the JWT payload.
 */
export interface JwtPayload {
  id: string;

  role: UserRole;

  jti: string;
}
