import { Exclude } from "class-transformer";
import { User } from "src/user/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

export enum OtpType {
    FORGOT_PASSWORD = 'FORGOT_PASSWORD',
    EMAIL_VERIFICATION = 'EMAIL_VERIFICATION'
}

@Entity()
export class Otp {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Exclude()
    @Column({ type: 'varchar', nullable: true })
    otp: string | null;

    @Exclude()
    @Column({ type: 'timestamp', nullable: true })
    otpExpiration: Date | null;

    @Exclude()
    @Column({ type: 'enum', enum: OtpType, nullable: true })
    otp_type: OtpType | null;

    @ManyToOne(()=> User,(user)=>user.otps, { onDelete : 'CASCADE'})
    @JoinColumn({ name :'user_id'})
    user: User;
}