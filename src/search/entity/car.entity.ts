import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: 'cars'})
export class Car{

    @PrimaryColumn()
    id: number;

    @Column()
    brand: string;

    @Column()
    number: string;

    @Column()
    type: string;

    @Column() 
    transmission: string; 

    @Column()
    fuel: string;

    @Column()
    mileage: number;

    @Column()
    price: number;
}