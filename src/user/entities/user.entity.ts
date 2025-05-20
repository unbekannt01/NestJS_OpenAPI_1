import { Exclude, Expose } from 'class-transformer';
import { BaseEntity } from '../../common/entities/base.entity';
import { RecentSearch } from 'src/search/entity/recent-search.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Otp } from 'src/otp/entities/otp.entity';
import { EmailVerification } from 'src/email-verification-by-link/entity/email-verify.entity';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

@Entity({ name: 'user_1' })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userName: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column()
  email: string;

  @Exclude()
  @Column()
  password: string;

  @Column({ nullable: true })
  mobile_no: string;

  @Column({ type: 'date', nullable: true })
  birth_date: Date;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.INACTIVE })
  status: UserStatus;

  @Column({ nullable: true })
  sessionId: string;

  @Exclude()
  @Column({ nullable: true, default: false })
  is_logged_in: boolean;

  @Column({ default: false })
  is_Verified: boolean;

  @Column({ default: UserRole.USER })
  role: UserRole;

  @Exclude()
  @Column({ type: 'text', nullable: true })
  refresh_token: string | null;

  @Exclude()
  @Column({ type: 'timestamp', nullable: true })
  expiryDate_token: Date | null;

  @Column({ default: 0, nullable: true })
  loginAttempts: number;

  @Column({ default: false })
  isBlocked: boolean;

  @Column({ type: 'text', nullable: true })
  suspensionReason: string | null;

  @Column({ type: 'varchar', nullable: true })
  avatar?: string | null;

  @Column({ default: false })
  isEmailVerified: boolean;

  // Calculated field: age
  @Expose()
  get age(): number | null {
    if (!this.birth_date) return null;
    const today = new Date();
    const birthDate = new Date(this.birth_date);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  @OneToMany(() => RecentSearch, (recentSearch) => recentSearch.user)
  recentSearch: RecentSearch[];

  @OneToMany(() => Otp, (otp) => otp.user)
  otps: Otp[];

  @OneToMany(() => EmailVerification, (verification) => verification.user)
  emailVerifications: EmailVerification[];
}
