import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('products')
export class ProductDetails {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  partNumber: string;

  @Column()
  dimension: number;

  @Column('float')
  weight: number;

  @Column()
  manufacturer: string;

  @Column()
  origin: string;
}
