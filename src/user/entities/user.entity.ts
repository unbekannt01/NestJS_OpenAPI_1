import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { RecentSearch } from 'src/search/entity/recent-search.entity';

export enum UserRole {
    USER = 'USER',
    ADMIN = 'ADMIN',
    SUPER_ADMIN = 'SUPER_ADMIN'
}

export enum OtpType {
    EMAIL_VERIFICATION = "EMAIL_VERIFICATION",
    FORGOT_PASSWORD = "FORGOT_PASSWORD",
}

export enum UserStatus {
    INACTIVE = 'INACTIVE',
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
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

    @Column({ nullable: true })  // Make password nullable
    password: string;

    @Column({ nullable: true })  // Make mobile_no nullable
    mobile_no: string;

    @Column({ type: 'date', nullable: true })
    birth_date: Date;

    @Column({ type: 'enum', enum: UserStatus, default: UserStatus.INACTIVE })
    status: UserStatus;

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
    refresh_token: string | null;

    @Column({ type: 'timestamp', nullable: true })
    expiryDate_token: Date | null;

    @Column({ type: 'integer', nullable: true })
    age: number;

    @Column({ default: 0, nullable: true })
    loginAttempts: number;

    @Column({ default: false })
    isBlocked: boolean;

    @Column({ type: 'text', nullable: true })
    suspensionReason: string | null;

    @OneToMany(() => RecentSearch, (recentSearch) => recentSearch)
    recentSearch: RecentSearch[];

    @Column({ type: 'varchar', nullable: true })
    verificationToken: string | null;

    @Column({ type: 'timestamp', nullable: true })
    tokenExpiration: Date | null;

    @Column({ default: false })
    isEmailVerified: boolean;

    // @Column({ nullable: true })
    // provider: string;

    // @Column({nullable:true})
    // picture: string;
}
