import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, JoinColumn, Index } from "typeorm"
import { User } from "src/user/entities/user.entity"

@Entity("user_sessions")
export class UserSession {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  @Index()
  jti: string

  @Column({ nullable: true })
  deviceInfo: string

  @Column({ nullable: true })
  ipAddress: string

  @Column({ nullable: true })
  userAgent: string

  @Column({ nullable: true })
  lastActiveAt: Date

  @Column({ default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @Column()
  expiresAt: Date

//   @ManyToOne(
//     () => User,
//     (user) => user.sessions,
//     { onDelete: "CASCADE" },
//   )
  // @JoinColumn({ name: "user_id" })
  // @Index()
  // user: User
}
