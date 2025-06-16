/* eslint-disable prettier/prettier */
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'upload_file' })
export class UploadFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  file: string;

  @Column({ type: 'timestamp', nullable: true })
  Creation: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  Updation: Date | null;

  @ManyToOne(() => User, (user) => user.fileupload, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
