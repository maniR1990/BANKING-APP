import { Controller, Post, Get, Body } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Controller()
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'customer-service',
      db_connection: 'connected', // Ideally, check this via TypeORM/Prisma
    };
  }

  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto) {
    const { name, email, address } = createCustomerDto;
    return this.customerService.create(name, email, address);
  }
}
