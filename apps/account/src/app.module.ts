// Example for Account Service (Apply similar logic to Customer)
import { Controller, Get, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountModule } from './app/account.module'; // Your feature module
import { Account } from './entities/account.entity';
import { AppLoggerModule } from 'common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'UP' };
  }
}

@Module({
  imports: [
    AppLoggerModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [Account],
      synchronize: true,
    }),
    AccountModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
