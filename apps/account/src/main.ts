import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { GlobalExceptionFilter, AppLoggerModule } from 'common';
import { Logger as PinoLogger } from 'nestjs-pino';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Use the shared Pino logger
  app.useLogger(app.get(PinoLogger));

  // Register the global exception filter
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new GlobalExceptionFilter(httpAdapter));

  app.setGlobalPrefix('api'); // Optional: Set a global prefix for REST endpoints
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  const port = process.env.PORT || 3001; // Ensure this is different from Customer service
  await app.listen(port);
  logger.log(`🚀 Account service is running on: http://localhost:${port}/api`);
}
bootstrap();
