import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Car
 * This entity represents a car in the system.
 */
@Entity({ name: 'car' })
export class Car {
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
