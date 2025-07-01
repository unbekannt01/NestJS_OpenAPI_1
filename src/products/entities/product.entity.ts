import { User } from 'src/user/entities/user.entity';
import { Category } from 'src/categories/entities/categories.entity';
import { Brand } from 'src/brands/entities/brand.entity';
// import { Review } from "src/reviews/entities/review.entity"
// import { CartItem } from "src/cart/entities/cart.entity"
import { ToolSpecification } from './tool-specification.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Review } from 'src/review/entities/review.entity';
import { CartItem } from 'src/cart/entities/cart.entity';
import { SubCategory } from 'src/categories/entities/sub-categories.entity';

export enum ToolCondition {
  NEW = 'NEW',
  REFURBISHED = 'REFURBISHED',
  USED = 'USED',
}

export enum PowerType {
  MANUAL = 'MANUAL',
  ELECTRIC_CORDED = 'ELECTRIC_CORDED',
  ELECTRIC_CORDLESS = 'ELECTRIC_CORDLESS',
  PNEUMATIC = 'PNEUMATIC',
  HYDRAULIC = 'HYDRAULIC',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  model: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  originalPrice: number;

  @Column({ unique: true })
  sku: string;

  @Column('simple-array', { nullable: true })
  images: string[];

  @Column({ type: 'enum', enum: ToolCondition, default: ToolCondition.NEW })
  condition: ToolCondition;

  @Column({ type: 'enum', enum: PowerType, nullable: true })
  powerType: PowerType;

  @Column({ nullable: true })
  voltage: string; // "18V", "20V", "120V", etc.

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  weight: number; // in kg

  @Column('json', { nullable: true })
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: false })
  isOnSale: boolean;

  @Column({ nullable: true })
  warrantyPeriod: string; // "1 year", "2 years", "lifetime"

  @Column('simple-array', { nullable: true })
  includedAccessories: string[];

  @Column('simple-array', { nullable: true })
  compatibleWith: string[]; // Compatible tool models/brands

  @Column({ nullable: true })
  videoUrl: string;

  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @Column({ default: 0 })
  salesCount: number;

  @Column({ default: 0 })
  stockQuantity: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => SubCategory, (sub) => sub.products, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sub_category_id' })
  subCategory: SubCategory;

  @ManyToOne(() => Brand, (brand) => brand.products, { nullable: true })
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @OneToMany(() => Review, (review) => review.product)
  reviews: Review[];

  @OneToMany(() => CartItem, (cartItem) => cartItem.product)
  cartItems: CartItem[];

  @OneToMany(() => ToolSpecification, (spec) => spec.product, { cascade: true })
  specifications: ToolSpecification[];

  @Column({ name: 'user_id' })
  userId: string;
}
