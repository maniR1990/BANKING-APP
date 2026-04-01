import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Public, CurrentUser } from 'common';
import { MESSAGE_PATTERNS, UserCreatedEvent } from 'shared-messaging';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { Patch, Param, Delete } from '@nestjs/common';

@ApiTags('Customer')
@ApiSecurity('X-User-ID')
@Controller()
export class CustomerController {
  constructor(private readonly customerService: CustomerService) { }

  @EventPattern(MESSAGE_PATTERNS.USER_CREATED)
  async handleUserCreated(@Payload() data: UserCreatedEvent) {
    console.log('\n👤 === NEW EVENT RECEIVED IN CUSTOMER SERVICE ===');
    console.log(`Building Customer KYC Profile for: ${data.email}`);
    console.log(`Attached to Auth ID: ${data.userId}\n`);

    // Create customer profile in PostgreSQL DB
    const customer = await this.customerService.create(
      data.name,
      data.email,
      'Pending Address KYC',
      data.userId
    );
    console.log(`✅ Customer profile saved to Postgres DB with ID: ${customer.id}\n`);
  }

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
    console.log('Creating customer for user:', user?.id || 'anonymous');
    return this.customerService.create(name, email, address);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers' })
  @ApiResponse({ status: 200, description: 'Returns all customers' })
  findAll() {
    return this.customerService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single customer' })
  @ApiResponse({ status: 200, description: 'Returns customer details' })
  findOne(@Param('id') id: string) {
    return this.customerService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer details' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customerService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a customer' })
  @ApiResponse({ status: 200, description: 'Customer deleted successfully' })
  remove(@Param('id') id: string) {
    return this.customerService.remove(id);
  }

  // RabbitMQ RPC Responders
  @MessagePattern(MESSAGE_PATTERNS.VALIDATE_CUSTOMER)
  async validateCustomer(@Payload() data: { id: string }) {
    try {
      await this.customerService.findOne(data.id);
      return true;
    } catch (e) {
      return false;
    }
  }

  @MessagePattern(MESSAGE_PATTERNS.GET_CUSTOMER_DETAILS)
  async getCustomerDetails(@Payload() data: { id: string }) {
    try {
      return await this.customerService.findOne(data.id);
    } catch (e) {
      return null;
    }
  }
}
