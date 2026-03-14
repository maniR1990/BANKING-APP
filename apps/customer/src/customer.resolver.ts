import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { Customer } from './entities/customer.entity';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Resolver(() => Customer)
export class CustomerResolver {
  constructor(private readonly customerService: CustomerService) {}

  // MANDATORY: You must have at least one Query
  @Query(() => [Customer], { name: 'customers' })
  async findAll() {
    return this.customerService.findAll();
  }

  @Mutation(() => Customer)
  async createCustomer(@Args('data') data: CreateCustomerDto) {
    return this.customerService.create(data.name, data.email, data.address);
  }
}
