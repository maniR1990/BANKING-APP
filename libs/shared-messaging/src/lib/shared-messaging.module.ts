import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env['RABBITMQ_URL'] || 'amqp://guest:guest@rabbitmq-service:5672?heartbeat=30'],
          queue: 'banking_events_queue',
          queueOptions: {
            durable: true,
            deadLetterExchange: 'banking_dlx',
            deadLetterRoutingKey: 'failed_events',
            messageTtl: 86400000,
          },
          socketOptions: {
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
