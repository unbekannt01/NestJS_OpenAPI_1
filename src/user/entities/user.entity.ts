import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'user_1' })
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    first_name: string;

    @Column()
    last_name: string;

    @Column()
    email: string;

    @Column()
    password: string;

    @Column({ default: 'INACTIVE' })
    status: string;

    @Column({ type: 'varchar', nullable: true })
    otp: string | null;

    @Column({ type: 'timestamp', nullable: true })
    otpExpiration: Date | null;

    @Column({nullable : true, default: false})
    is_logged_in : boolean;

    @Column({nullable: true, default: true})
    is_logged_out : boolean;
}