import { Column, Entity, PrimaryGeneratedColumn, DeleteDateColumn } from 'typeorm';

export enum UserRole {
    USER = 'User',
    ADMIN = 'Admin',
    SUPER_ADMIN = 'Super_Admin'
}

export enum OtpType {
    EMAIL_VERIFICATION = "EMAIL_VERIFICATION",
    FORGOT_PASSWORD = "FORGOT_PASSWORD",
}

@Entity({ name: 'user_1' })
export class User {
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

    @Column()
    password: string;

    @Column()
    mobile_no: string;

    @Column({ type: 'date', nullable: true })
    birth_date: Date;

    @Column({ default: 'INACTIVE' })
    status: string;

    @Column({ type: 'varchar', nullable: true })
    otp: string | null;

    @Column({ type: 'timestamp', nullable: true })
    otpExpiration: Date | null;

    @Column({ nullable: true, default: false })
    is_logged_in: boolean;

    @Column({ type: 'enum', enum: OtpType, nullable: true })
    otp_type: OtpType | null;

    @Column({ default: false })
    is_Verified: boolean;

    @Column({ default: UserRole.USER })
    role: UserRole;

    @Column({ type: 'text', nullable: true })
    token: string | null;

    @Column({ type: 'timestamp', nullable: true })
    expiryDate_token: Date | null;

    @Column({ type: 'integer', nullable: true })
    age: number;

    @Column({ default: 0, nullable: true })
    loginAttempts: number;

    @Column({ default: false })
    blocked: boolean;

    @Column({ type: 'timestamp', nullable: true })
    createdAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    updatedAt: Date;

    @DeleteDateColumn({ type: 'timestamp', nullable: true })
    deletedAt: Date | null;
}