import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('toys')
export class ToyEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 64, nullable: false })
  partName: string;

  @Column({ type: 'varchar', length: 64, nullable: false })
  code: string;
}
