import { Controller, Get, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerModule } from './customer.module'; // Your feature module
import { Customer } from './entities/customer.entity';

// --- ADD THIS BLOCK ---
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'UP' };
  }
}
// -

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [Customer],
      synchronize: true,
    }),
    CustomerModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
