// apps/auth/src/redis/redis.module.ts
import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global() // This makes RedisService available everywhere without re-importing
@Module({
  providers: [RedisService],
  exports: [RedisService], // Crucial: allow AuthModule to use it
})
export class RedisModule {}
