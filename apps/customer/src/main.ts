import { NestFactory } from '@nestjs/core';
import { CustomerModule } from './customer.module';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap'); // Principal Tip: Use Nest's Logger for startup
  const app = await NestFactory.create(CustomerModule);

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

  const port = process.env.PORT ?? 3002;
  await app.listen(port);

  logger.log(
    `🚀 Customer Microservice is running on: http://localhost:${port}/api`,
  );
  logger.log(
    `📊 GraphQL Playground available at: http://localhost:${port}/graphql`,
  );
}
bootstrap();
