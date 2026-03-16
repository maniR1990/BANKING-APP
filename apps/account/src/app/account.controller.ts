import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { AccountService } from './account.service';
import { Public, CurrentUser } from 'common';

@Controller()
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Public()
  @Get()
  getApiRoot() {
    return {
      message: 'Account API Root',
      status: 'ok',
    };
  }

  @Public()
  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'account-service',
      db_connection: 'connected', // Ideally, check this via TypeORM/Prisma
    };
  }

  @Get(':id')
  getAccount(@Param('id') id: string, @CurrentUser() user: any) {
    // We optionally use user context here
    return this.accountService.getAccount(id);
  }

  @Post(':id/add')
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
  withdraw(
    @Param('id') id: string,
    @Body() body: { amount: number; customer: any },
    @CurrentUser() user: any,
  ) {
    return this.accountService.withdrawMoney(id, body.amount, body.customer);
  }

  @Delete(':id')
  deleteAccount(@Param('id') id: string, @CurrentUser() user: any) {
    return this.accountService.deleteAccount(id);
  }
}
