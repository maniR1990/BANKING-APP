import { Controller, Post, Get, Body } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { Public, CurrentUser } from 'common';

@Controller()
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Public()
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
  create(
    @Body() createCustomerDto: CreateCustomerDto,
    @CurrentUser() user: any,
  ) {
    const { name, email, address } = createCustomerDto;
    console.log('Creating customer for user:', user?.id || 'anonymous'); // Debug log to verify user info
    // user is available via the gateway-auth guard
    return this.customerService.create(name, email, address);
  }
}
