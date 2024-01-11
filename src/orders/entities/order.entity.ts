import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onDelete: 'CASCADE',
  })
  creator: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onDelete: 'CASCADE',
  })
  takenBy: UserEntity;

  // @Column({ type: 'text', nullable: false })
  // fullText: string;

  @Column({ type: 'varchar', length: 64, nullable: false })
  partName: string;

  @Column({ type: 'varchar', length: 64, nullable: false })
  code: string;

  @Column({ type: 'varchar', length: 64, nullable: false })
  color: string;

  @Column({ type: 'varchar', length: 64, nullable: false })
  colorCode: string;

  @Column({ type: 'smallint', nullable: false, default: 1 })
  amount: number;

  @Column({ type: 'varchar', length: 64, nullable: false })
  desktop: string;

  @Column({ type: 'boolean', nullable: false, default: false })
  isClosed: boolean;

  // @Column({ type: 'boolean', nullable: false, default: true })
  // closedResult: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
