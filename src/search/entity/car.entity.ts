import { Column, Entity, PrimaryGeneratedColumn , CreateDateColumn } from 'typeorm';

@Entity({ name: 'car' })
export class Car {
    @PrimaryGeneratedColumn()
    id:string
    
    @Column()
    manufacturer: string;

    @Column()
    vehicle: string;

    @Column()
    model: string;

    @Column()
    type: string;

    @Column()
    fuel: string;

    @Column()
    color: string;

    @Column()
    vrm: string;

    @CreateDateColumn({ type: 'timestamp', nullable: true })
    createdAt: Date | null;
}