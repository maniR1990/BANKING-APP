import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  // Create a new customer
  async create(
    name: string,
    email: string,
    address: string,
  ): Promise<Customer> {
    const newCustomer = this.customerRepository.create({
      name,
      email,
      address,
    });
    return await this.customerRepository.save(newCustomer);
  }

  // Get all customers (In a real app, you'd add pagination here)
  async findAll(): Promise<Customer[]> {
    return await this.customerRepository.find();
  }

  // Find a single customer by ID
  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
    return customer;
  }
}
