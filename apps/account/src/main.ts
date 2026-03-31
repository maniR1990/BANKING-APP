import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { GlobalExceptionFilter, AppLoggerModule } from 'common';
import { Logger as PinoLogger } from 'nestjs-pino';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  // 1. Determine the allowed origins based on the environment
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.CORS_ORIGIN || 'https://your-production-domain.com']
    : ['http://localhost:8080', 'http://localhost']; // Allows local Swagger and local Frontend

  // 2. Apply the dynamic rules
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

  app.setGlobalPrefix('api'); // Optional: Set a global prefix for REST endpoints
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
    SwaggerModule.setup('account/api/docs', app, document);
  }

  const port = process.env.PORT || 3001; // Ensure this is different from Customer service
  await app.listen(port);
  logger.log(`🚀 Account service is running on: http://localhost:${port}/api`);
}
bootstrap();
