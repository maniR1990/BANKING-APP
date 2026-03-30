import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { Public, CurrentUser } from 'common';

@ApiTags('Customer')
@ApiSecurity('X-User-ID')
@Controller()
export class CustomerController {
  constructor(private readonly customerService: CustomerService) { }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Check Customer service health' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'customer-service',
      db_connection: 'connected', // Ideally, check this via TypeORM/Prisma
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new customer profile' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
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
