import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql'; // 1. Add these imports

@InputType() // 2. Mark the class as a GraphQL Input
export class CreateCustomerDto {
  @Field() // 3. Expose the field to GraphQL
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  address: string;
}
