import { Account } from './../entities/account.entity';
import { ClientProxy } from '@nestjs/microservices';
import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MESSAGE_PATTERNS } from 'shared-messaging';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @Inject('RABBITMQ_SERVICE') private client: ClientProxy,
  ) { }

  // c. Get Account details
  async getAccount(id: string): Promise<any> {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) throw new NotFoundException('Account not found');

    // Real data flow: Fetch customer details from Customer Service
    let customer = null;
    try {
      customer = await firstValueFrom(
        this.client.send(MESSAGE_PATTERNS.GET_CUSTOMER_DETAILS, { id: account.customerId })
      );
    } catch (e) {
      console.error('Failed to fetch customer details:', e.message);
    }

    return {
      ...account,
      customer,
    };
  }

  async getAccountByCustomerId(customerId: string): Promise<any> {
    const account = await this.accountRepository.findOne({ where: { customerId } });
    if (!account) throw new NotFoundException('Account not found for this customer');
    return this.getAccount(account.id);
  }

  // Provision new checking account for user
  async createCheckingAccount(customerId: string): Promise<Account> {
    const newAccount = this.accountRepository.create({
      customerId,
      balance: 100, // $100 Sign-up bonus for learning demo!
      currency: 'USD',
      status: 'ACTIVE',
    });
    return await this.accountRepository.save(newAccount);
  }

  // a. Add Money
  async addMoney(id: string, amount: number, customerId: string): Promise<Account> {
    await this.validateCustomer(customerId);
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) throw new NotFoundException('Account not found');

    account.balance = Number(account.balance) + Number(amount);
    return await this.accountRepository.save(account);
  }

  // b. Withdraw money
  async withdrawMoney(id: string, amount: number, customerId: string): Promise<Account> {
    await this.validateCustomer(customerId);
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) throw new NotFoundException('Account not found');

    if (Number(account.balance) < Number(amount))
      throw new BadRequestException('Insufficient balance');
    account.balance = Number(account.balance) - Number(amount);
    return await this.accountRepository.save(account);
  }

  // d. Delete Account
  async deleteAccount(id: string) {
    const result = await this.accountRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Account not found');
    return { success: true };
  }

  private async validateCustomer(customerId: string) {
    if (!customerId) {
      throw new BadRequestException('Customer ID is required');
    }

    // Real data flow: Synchronous RPC call to Customer Service
    const isValid = await firstValueFrom(
      this.client.send(MESSAGE_PATTERNS.VALIDATE_CUSTOMER, { id: customerId })
    );

    if (!isValid) {
      throw new BadRequestException('Invalid Customer: Record does not exist in Customer Service');
    }
    return true;
  }

  // Deletion helper for cascading
  async deleteByCustomerId(customerId: string) {
    console.log(`🗑️ Deleting all accounts for customer: ${customerId}`);
    await this.accountRepository.delete({ customerId });
  }
}
