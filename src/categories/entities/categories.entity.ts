import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm"
import { Product } from "src/products/entities/product.entity"

@Entity("categories")
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  name: string

  @Column({ unique: true })
  slug: string

  @Column("text", { nullable: true })
  description: string

  @Column({ nullable: true })
  image: string

  @Column({ default: true })
  isActive: boolean

  @Column({ default: 0 })
  sortOrder: number

  // Self-referencing for parent-child relationship
  @ManyToOne(
    () => Category,
    (category) => category.children,
    { nullable: true },
  )
  @JoinColumn({ name: "parent_id" })
  parent: Category

  @OneToMany(
    () => Category,
    (category) => category.parent,
  )
  children: Category[]

  @OneToMany(
    () => Product,
    (product) => product.category,
  )
  products: Product[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
