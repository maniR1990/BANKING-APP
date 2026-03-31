/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */
import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter, AppLoggerModule } from 'common';
import { Logger as PinoLogger } from 'nestjs-pino';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  console.log('--- [VERIFICATION] RABBITMQ VERSION 2: FANOUT EXCHANGE ACTIVE ---');
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  // 1. Determine the allowed origins based on the environment
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.CORS_ORIGIN || 'https://your-production-domain.com']
    : ['http://localhost:8080', 'http://localhost']; // Allows local Swagger and local Frontend

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Banking Auth Service')
      .setDescription('Internal API for Authentication')
      .setVersion('1.0')
      .addCookieAuth('banking_session')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('public/auth/api/docs', app, document);
  }

  // Use the shared Pino logger
  app.useLogger(app.get(PinoLogger));

  // Register the global exception filter
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new GlobalExceptionFilter(httpAdapter));

  // Required for reading the banking_session cookie
  app.use(cookieParser());

  // Enable the DTO validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
