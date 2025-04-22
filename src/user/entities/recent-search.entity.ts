// src/user/entities/recent-search.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class RecentSearch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  query: string;

  @CreateDateColumn()
  createdAt: Date;
}
