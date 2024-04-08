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
import { ToyEntity } from '../../toys/entities/toy.entity';
import { ColorCode } from 'src/static/enums/colors-codes.enum';
import { TimestampType } from 'src/static/types/timestamp.type';

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp', nullable: false, unique: false })
  cartTimestamp: TimestampType;

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

  @ManyToOne(() => ToyEntity, (toy) => toy.id, {
    onDelete: 'CASCADE',
  })
  toy: ToyEntity;

  @Column({ type: 'varchar', length: 64, nullable: false })
  colorCode: ColorCode;

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
