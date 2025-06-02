import { UserRole } from 'src/user/entities/user.entity';

/**
 * JwtPayload
 * This interface defines the structure of the JWT payload.
 */
export interface UserRegisteredPayload {
  id: string;
  email: string;
  userName: string;
  role: UserRole;
}
