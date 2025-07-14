import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Exclude } from '@nestjs/class-transformer';

export enum OtpType {
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
}

@Entity()
export class Otp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  otp: string | null;

  @Column({ type: 'timestamp', nullable: true })
  otpExpiration: Date | null; 

  @Column({ type: 'enum', enum: OtpType, nullable: true })
  otp_type: OtpType | null;

  @ManyToOne(() => User, (user) => user.otps, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
