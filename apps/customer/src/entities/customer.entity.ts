import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql'; // 1. Import GraphQL decorators

@ObjectType() // 2. This tells GraphQL this class is a "Type" in the schema
@Entity()
export class Customer {
  @Field(() => ID) // 3. Explicitly mark as GraphQL ID type
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field() // 4. Expose this field to the GraphQL API
  @Column({ length: 50 })
  name: string;

  @Field()
  @Column({ unique: true })
  email: string;

  // Principal Tip: You can choose NOT to add @Field() to certain columns
  // if you want them to be private/internal-only.
  @Field()
  @Column('text')
  address: string;

  @Field()
  @Column({ name: 'user_id', unique: true, nullable: true })
  userId: string;
}
