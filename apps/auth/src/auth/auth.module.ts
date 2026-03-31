import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from '../health/health.controller';
import { User } from '../entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisService } from '../redis/redis.service';
import { SharedMessagingModule } from 'shared-messaging';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    TerminusModule,
    SharedMessagingModule,
  ],
  controllers: [AuthController, HealthController],
  providers: [AuthService, RedisService],
})
export class AuthModule { }
