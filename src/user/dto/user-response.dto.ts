import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  userName: string;

  @Expose()
  first_name: string;

  @Expose()
  last_name: string;

  @Expose()
  email: string;

  @Expose()
  mobile_no: string;

  @Expose()
  status: string;

  @Expose()
  role: string;

  @Expose()
  avatar?: string;

  @Expose()
  isEmailVerified: boolean;

  @Expose()
  isBlocked: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
