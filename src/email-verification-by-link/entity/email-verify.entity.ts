import { Exclude } from '@nestjs/class-transformer';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * EmailVerification
 * This entity represents the email verification process for users.
 * It includes a verification token and its expiration date.
 */
@Entity()
export class EmailVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  verificationToken: string | null;

  @Exclude()
  @Column({ type: 'timestamp', nullable: true })
  tokenExpiration: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.emailVerifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
