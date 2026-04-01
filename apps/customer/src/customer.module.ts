import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql'; // 1. Add this
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'; // 2. Add this
import { join } from 'path';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { Customer } from './entities/customer.entity';
import { CustomerResolver } from './customer.resolver';
import { AppLoggerModule } from 'common';

@Module({
  imports: [
    AppLoggerModule,
    // 1. Load the .env file globally
    ConfigModule.forRoot({
      isGlobal: true, // Makes config available everywhere
    }),

    // GraphQL Integration
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // 'Code-first' approach: NestJS generates the schema from your TS decorators
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true, // Enables the browser-based IDE for testing
      path: '/graphql',
      context: ({ req }) => ({ req }), // Explicitly pass the req object
    }),

    // 2. Connect to the Database using the config
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true, // Automatically load table definitions
        synchronize: true, // ⚠️ DEV ONLY: Auto-creates tables. Disable in prod!
      }),
    }),
    TypeOrmModule.forFeature([Customer]),
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq-service:5672'],
          queue: 'banking_queue',
          exchange: 'banking_exchange',
          exchangeType: 'fanout',
          queueOptions: { durable: true },
        },
      },
    ]),
  ],
  controllers: [CustomerController],
  providers: [CustomerService, CustomerResolver],
})
export class CustomerModule { }
