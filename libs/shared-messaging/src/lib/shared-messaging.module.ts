import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'ACCOUNT_RMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [
            (process.env['RABBITMQ_URL'] || 'amqp://guest:guest@rabbitmq-service:5672') +
            '?heartbeat=60&connection_name=auth-to-account'
          ],
          queue: 'account_queue',
          queueOptions: { durable: true },
          socketOptions: {
            heartbeatIntervalInSeconds: 60,
            clientProperties: { connection_name: 'auth-to-account' },
          },
        },
      },
      {
        name: 'CUSTOMER_RMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [
            (process.env['RABBITMQ_URL'] || 'amqp://guest:guest@rabbitmq-service:5672') +
            '?heartbeat=60&connection_name=auth-to-customer'
          ],
          queue: 'banking_queue',
          queueOptions: { durable: true },
          socketOptions: {
            heartbeatIntervalInSeconds: 60,
            clientProperties: { connection_name: 'auth-to-customer' },
          },
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class SharedMessagingModule { }
