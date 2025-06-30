import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('tool_specifications')
export class ToolSpecification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // "Max Speed", "Chuck Size", "Battery Life", etc.

  @Column()
  value: string; // "3000 RPM", "1/2 inch", "4 hours", etc.

  @Column({ nullable: true })
  unit: string; // "RPM", "inch", "hours", etc.

  @Column({ default: 0 })
  sortOrder: number;

  @ManyToOne(() => Product, (product) => product.specifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
