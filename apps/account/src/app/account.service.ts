import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Account } from './../entities/account.entity';

@Injectable()
export class AccountService {
  private accounts: Account[] = []; // In-memory for now

  // c. Get Account details
  getAccount(id: string): Account {
    const account = this.accounts.find((acc) => acc.id === id);
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  // Provision new checking account for user
  createCheckingAccount(customerId: string): Account {
    const newAccount: Account = {
      id: `ACC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`, // Simple ID
      customerId,
      balance: 100, // $100 Sign-up bonus for learning demo!
      currency: 'USD',
      status: 'ACTIVE',
    };
    this.accounts.push(newAccount);
    return newAccount;
  }

  // a. Add Money
  addMoney(id: string, amount: number, customerDetails: any) {
    this.validateCustomer(customerDetails);
    const account = this.getAccount(id);
    account.balance += amount;
    return account;
  }

  // b. Withdraw money
  withdrawMoney(id: string, amount: number, customerDetails: any) {
    this.validateCustomer(customerDetails);
    const account = this.getAccount(id);
    if (account.balance < amount)
      throw new BadRequestException('Insufficient balance');
    account.balance -= amount;
    return account;
  }

  // d. Delete Account
  deleteAccount(id: string) {
    const index = this.accounts.findIndex((acc) => acc.id === id);
    if (index === -1) throw new NotFoundException('Account not found');
    this.accounts.splice(index, 1);
    return { success: true };
  }

  private validateCustomer(details: any) {
    // In a real microservice, you'd call the Customer Service via TCP/gRPC here
    if (!details || !details.id) {
      throw new BadRequestException('Invalid Customer Details');
    }
    return true;
  }
}
