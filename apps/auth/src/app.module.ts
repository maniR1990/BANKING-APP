import { Controller, Get, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { User } from './entities/user.entity';
import { AppLoggerModule } from 'common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'UP', service: 'auth-service' };
  }
}

@Module({
  imports: [
    AppLoggerModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'banking-postgres', // Use K8s service name
      port: 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'admin',
      database: process.env.DB_NAME || 'banking_auth',
      entities: [User],
      synchronize: true,
    }),
    RedisModule,
    AuthModule,
  ],
  controllers: [HealthController],
})
export class AppModule { }
