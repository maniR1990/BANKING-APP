import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [
            (process.env['RABBITMQ_URL'] || 'amqp://guest:guest@rabbitmq-service:5672') +
            '?heartbeat=60&connection_name=banking-app-publisher'
          ],
          queue: 'account_queue', // Default queue for publisher (Nest needs one, but we use exchange)
          exchange: 'banking_exchange',
          exchangeType: 'fanout',
          queueOptions: {
            durable: true,
          },
          socketOptions: {
            heartbeatIntervalInSeconds: 60,
            clientProperties: {
              connection_name: 'banking-app-publisher',
            },
          },
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class SharedMessagingModule { }
