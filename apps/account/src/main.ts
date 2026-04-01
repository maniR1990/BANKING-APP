import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { GlobalExceptionFilter, AppLoggerModule } from 'common';
import { Logger as PinoLogger } from 'nestjs-pino';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('--- [VERIFICATION] RABBITMQ VERSION 2: FANOUT EXCHANGE ACTIVE ---');
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // 1. TELL NESTJS TO CONNECT TO RABBITMQ
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [
        (process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq-service:5672') +
        '?heartbeat=60&connection_name=account-service-consumer'
      ],
      queue: 'account_queue',
      exchange: 'banking_exchange',
      exchangeType: 'fanout',
      queueOptions: {
        durable: true,
      },
      prefetchCount: 1,
      socketOptions: {
        heartbeatIntervalInSeconds: 60,
        clientProperties: {
          connection_name: 'account-service-consumer',
        },
      },
    },
  });

  // 2. START BOTH LISTENERS
  await app.startAllMicroservices(); // Starts listening to RabbitMQ
  // 1. Determine the allowed origins based on the environment
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.CORS_ORIGIN || 'https://your-production-domain.com']
    : ['http://localhost:8080', 'http://localhost']; // Allows local Swagger and local Frontend

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Use the shared Pino logger
  app.useLogger(app.get(PinoLogger));

  // Register the global exception filter
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new GlobalExceptionFilter(httpAdapter));

  app.setGlobalPrefix('api'); // Standard API prefix
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Banking Account Service')
      .setDescription('Internal API for Accounts')
      .setVersion('1.0')
      .addApiKey({ type: 'apiKey', name: 'X-User-ID', in: 'header' }, 'X-User-ID')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('public/account/api/docs', app, document);
  }

  const port = process.env.PORT || 3001; // Ensure this is different from Customer service
  await app.listen(port);
  logger.log(`🚀 Account service is running on: http://localhost:${port}/api`);
  logger.log(`Account Service running on port ${port} and listening to RabbitMQ`);
}
bootstrap();
