import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { AccountService } from './account.service';
import { Public, CurrentUser } from 'common';

@ApiTags('Account')
@ApiSecurity('X-User-ID')
@Controller()
export class AccountController {
  constructor(private readonly accountService: AccountService) { }

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

  @Post(':id/add')
  @ApiOperation({ summary: 'Add money to an account' })
  @ApiResponse({ status: 201, description: 'Money added successfully' })
  addMoney(
    @Param('id') id: string,
    @Body() body: { amount: number; customer: any },
    @CurrentUser() user: any,
  ) {
    // If you need to map body.customer to user.id, you can do it here.
    // Using user.id directly if applicable ensures security.
    return this.accountService.addMoney(id, body.amount, body.customer);
  }

  @Post(':id/withdraw')
  @ApiOperation({ summary: 'Withdraw money from an account' })
  @ApiResponse({ status: 201, description: 'Money withdrawn successfully' })
  withdraw(
    @Param('id') id: string,
    @Body() body: { amount: number; customer: any },
    @CurrentUser() user: any,
  ) {
    return this.accountService.withdrawMoney(id, body.amount, body.customer);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an account by ID' })
  @ApiResponse({ status: 200, description: 'Account deleted' })
  deleteAccount(@Param('id') id: string, @CurrentUser() user: any) {
    return this.accountService.deleteAccount(id);
  }
}
