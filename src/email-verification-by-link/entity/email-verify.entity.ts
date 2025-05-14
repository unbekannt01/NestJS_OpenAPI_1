import { Exclude } from "@nestjs/class-transformer";
import { User } from "src/user/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

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

    @ManyToOne(() => User, user => user.emailVerifications, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;
}