import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { AccountService } from './account.service';

@Controller()
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

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
  getAccount(@Param('id') id: string) {
    return this.accountService.getAccount(id);
  }

  @Post(':id/add')
  addMoney(
    @Param('id') id: string,
    @Body() body: { amount: number; customer: any },
  ) {
    return this.accountService.addMoney(id, body.amount, body.customer);
  }

  @Post(':id/withdraw')
  withdraw(
    @Param('id') id: string,
    @Body() body: { amount: number; customer: any },
  ) {
    return this.accountService.withdrawMoney(id, body.amount, body.customer);
  }

  @Delete(':id')
  deleteAccount(@Param('id') id: string) {
    return this.accountService.deleteAccount(id);
  }
}
