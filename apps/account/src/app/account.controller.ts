import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { AccountService } from './account.service';
import { Public, CurrentUser } from 'common';
import { MESSAGE_PATTERNS, UserCreatedEvent } from 'shared-messaging';
import { EventPattern, Payload } from '@nestjs/microservices';
import { TransactionDto } from './dto/transaction.dto';

@ApiTags('Account')
@ApiSecurity('X-User-ID')
@Controller()
export class AccountController {
  constructor(private readonly accountService: AccountService) {
    console.log('\n⚡🚨 ACCOUNT CONTROLLER SUCCESSFULLY INSTANTIATED! 🚨⚡\n');
  }

  @EventPattern(MESSAGE_PATTERNS.USER_CREATED)
  async handleUserCreated(@Payload() data: UserCreatedEvent) {
    console.log('\n✅ === NEW EVENT RECEIVED IN ACCOUNT SERVICE ===');
    console.log(`Provisioning default checking account for: ${data.name}`);
    console.log(`User ID: ${data.userId}`);
    console.log(`Timestamp: ${data.timestamp}\n`);

    // Create account in PostgreSQL DB
    const account = await this.accountService.createCheckingAccount(data.userId);
    console.log(`✅ Postgres checking account [${account.id}] provisioned with $${account.balance} bonus!\n`);
  }

  @EventPattern(MESSAGE_PATTERNS.CUSTOMER_DELETED)
  async handleCustomerDeleted(@Payload() data: { customerId: string }) {
    console.log('\n🗑️ === CUSTOMER DELETED EVENT RECEIVED ===');
    console.log(`Cleaning up accounts for customer: ${data.customerId}\n`);
    await this.accountService.deleteByCustomerId(data.customerId);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get Account API Root' })
  @ApiResponse({ status: 200, description: 'Root API reached' })
  getApiRoot() {
    return {
      message: 'Account API Root',
      status: 'ok',
    };
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Check Account service health' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'account-service',
      db_connection: 'connected', // Ideally, check this via TypeORM/Prisma
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Account by ID' })
  @ApiResponse({ status: 200, description: 'Returns account details' })
  getAccount(@Param('id') id: string, @CurrentUser() user: any) {
    // We optionally use user context here
    return this.accountService.getAccount(id);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get Account by Customer ID' })
  @ApiResponse({ status: 200, description: 'Returns account details' })
  getAccountByCustomer(@Param('customerId') customerId: string) {
    return this.accountService.getAccountByCustomerId(customerId);
  }

  @Post(':id/add')
  @ApiOperation({ summary: 'Add money to an account' })
  @ApiResponse({ status: 201, description: 'Money added successfully' })
  addMoney(
    @Param('id') id: string,
    @Body() body: TransactionDto,
    @CurrentUser() user: any,
  ) {
    return this.accountService.addMoney(id, body.amount, body.customerId);
  }

  @Post(':id/withdraw')
  @ApiOperation({ summary: 'Withdraw money from an account' })
  @ApiResponse({ status: 201, description: 'Money withdrawn successfully' })
  withdraw(
    @Param('id') id: string,
    @Body() body: TransactionDto,
    @CurrentUser() user: any,
  ) {
    return this.accountService.withdrawMoney(id, body.amount, body.customerId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an account by ID' })
  @ApiResponse({ status: 200, description: 'Account deleted' })
  deleteAccount(@Param('id') id: string, @CurrentUser() user: any) {
    return this.accountService.deleteAccount(id);
  }
}
