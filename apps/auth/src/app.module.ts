// apps/auth/src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { User } from './entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      // We use the env variable, but fall back to the docker service name
      host: process.env.DB_HOST || 'banking_postgres',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'admin',
      database: process.env.DB_NAME || 'banking_auth', // Match your service
      entities: [User],
      synchronize: true, // Auto-creates table 'users'
    }),
    RedisModule,
    AuthModule,
  ],
})
export class AppModule {}
