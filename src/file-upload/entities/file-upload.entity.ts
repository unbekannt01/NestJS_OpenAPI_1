/* eslint-disable prettier/prettier */
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'upload_file' })
export class UploadFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  file: string;

  @Column({ nullable: true })
  originalName: string;

  @Column({ nullable: true })
  mimeType: string;

  @CreateDateColumn({ type: 'timestamp', nullable: true })
  created: Date | null;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updated: Date | null;

  @Column({ nullable: true })
  fileHash: string;

  @Column({ nullable: true })
  publicId: string;

  @ManyToOne(() => User, (user) => user.fileupload, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
