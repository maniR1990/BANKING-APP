import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { ClientProxy } from '@nestjs/microservices';
import { MESSAGE_PATTERNS } from 'shared-messaging';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @Inject('RABBITMQ_SERVICE') private client: ClientProxy,
  ) { }

  // Create a new customer
  async create(
    name: string,
    email: string,
    address: string,
    userId?: string,
  ): Promise<Customer> {
    const newCustomer = this.customerRepository.create({
      name,
      email,
      address,
      userId,
    });
    return await this.customerRepository.save(newCustomer);
  }

  // Get all customers (In a real app, you'd add pagination here)
  async findAll(): Promise<Customer[]> {
    return await this.customerRepository.find();
  }

  // Find a single customer by ID
  async findOne(id: string): Promise<Customer> {
    // Attempt lookup by primary ID
    let customer = await this.customerRepository.findOne({ where: { id } });

    // Fallback: Attempt lookup by userId (supporting Postman captures)
    if (!customer) {
      customer = await this.customerRepository.findOne({ where: { userId: id } });
    }

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
    return customer;
  }

  // Update a customer
  async update(id: string, updateData: Partial<Customer>): Promise<Customer> {
    const customer = await this.findOne(id);
    Object.assign(customer, updateData);
    return await this.customerRepository.save(customer);
  }

  // Delete a customer (cascades async via RabbitMQ)
  async remove(id: string): Promise<{ success: boolean }> {
    const customer = await this.findOne(id);
    await this.customerRepository.remove(customer);

    // Asynchronous Cascading Delete via Event Pattern to Account Service
    this.client.emit(MESSAGE_PATTERNS.CUSTOMER_DELETED, { customerId: id });
    console.log(`📡 Emitted CUSTOMER_DELETED event for ${id}`);

    return { success: true };
  }
}
