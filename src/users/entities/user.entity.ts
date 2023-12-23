import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../static/enums/users.enum';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'float', nullable: true, default: null })
  telegramId?: number;

  @Column({ type: 'varchar', length: 32, nullable: false })
  firstname: string;

  @Column({ type: 'varchar', length: 32, nullable: false })
  lastname: string;

  @Column({ nullable: false, select: false })
  password: string;

  @Column({ nullable: false, default: Role.Worker })
  role: Role;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
