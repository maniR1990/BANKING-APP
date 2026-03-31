import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql'; // 1. Add these imports
import { ApiProperty } from '@nestjs/swagger';

@InputType() // 2. Mark the class as a GraphQL Input
export class CreateCustomerDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  @Field() // 3. Expose the field to GraphQL
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @Field()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123 Banking St, Finance City' })
  @Field()
  @IsString()
  address: string;
}
