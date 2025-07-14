import { UserRole } from 'src/user/entities/user.entity';

export interface UserRegisteredPayload {
  id: string;
  email: string;
  userName: string;
  role: UserRole;
}
