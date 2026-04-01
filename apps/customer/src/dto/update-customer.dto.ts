import { PartialType } from '@nestjs/swagger';
import { CreateCustomerDto } from './create-customer.dto';
import { InputType, PartialType as GqlPartialType } from '@nestjs/graphql';

@InputType()
export class UpdateCustomerDto extends PartialType(CreateCustomerDto) { }
