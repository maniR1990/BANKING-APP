import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { GlobalExceptionFilter, AppLoggerModule } from 'common';
import { Logger as PinoLogger } from 'nestjs-pino';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('Bootstrap'); // Principal Tip: Use Nest's Logger for startup
  logger.log('--- [VERIFICATION] RABBITMQ VERSION 2: FANOUT EXCHANGE ACTIVE ---');
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  // 1. Determine the allowed origins based on the environment

  // 1. CONNECT TO RABBITMQ (Same queue as Account service!)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [
        (process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq-service:5672') +
        '?heartbeat=60&connection_name=customer-service-consumer'
      ],
      queue: 'customer_queue',
      exchange: 'banking_exchange',
      exchangeType: 'fanout',
      prefetchCount: 1,
      queueOptions: {
        durable: true,
      },
      socketOptions: {
        heartbeatIntervalInSeconds: 60,
        clientProperties: {
          connection_name: 'customer-service-consumer',
        },
      },
    },
  });

  // 2. START LISTENERS
  await app.startAllMicroservices();
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

  // 1. Global Prefix for REST (if you still have controllers)
  app.setGlobalPrefix('api', {
    exclude: ['graphql'], // Exclude GraphQL endpoint from the prefix
  });

  // 2. Enhanced Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips away non-decorated properties from the DTO
      forbidNonWhitelisted: true, // Throws an error if extra fields are sent
      transform: true, // Automatically transforms payloads to DTO instances
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Banking Customer Service')
      .setDescription('Internal API for Customers')
      .setVersion('1.0')
      .addApiKey({ type: 'apiKey', name: 'X-User-ID', in: 'header' }, 'X-User-ID')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('public/customer/api/docs', app, document);
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(
    `🚀 Customer Microservice is running on: http://localhost:${port}/api`,
  );
  logger.log(
    `📊 GraphQL Playground available at: http://localhost:${port}/graphql`,
  );
}
bootstrap();
