import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from './categories.entity';
import { Product } from 'src/products/entities/product.entity';

@Entity('sub_categories')
export class SubCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ nullable: true })
  image?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @ManyToOne(() => Category, (cat) => cat.subcategories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column()
  categoryId: string;

  @OneToMany(() => Product, (product) => product.subCategory)
  products: Product[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
