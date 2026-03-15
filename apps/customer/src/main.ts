import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { GlobalExceptionFilter, AppLoggerModule } from 'common';
import { Logger as PinoLogger } from 'nestjs-pino';

async function bootstrap() {
  const logger = new Logger('Bootstrap'); // Principal Tip: Use Nest's Logger for startup
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

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
