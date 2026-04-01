import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column('decimal')
  balance: number;

  @Column()
  currency: string;

  @Column({ default: 'ACTIVE' })
  status: 'ACTIVE' | 'INACTIVE';
}
