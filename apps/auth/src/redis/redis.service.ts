import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient!: Redis;

  async onModuleInit() {
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: 6379,
    });
  }

  async createSession(
    sessionId: string,
    userId: string,
    expiresInSeconds: number,
    data?: any,
  ) {
    const sessionData = JSON.stringify({ userId, ...data });
    await this.redisClient.set(
      `session:${sessionId}`,
      sessionData,
      'EX',
      expiresInSeconds,
    );
  }

  async getSession(sessionId: string) {
    const sessionData = await this.redisClient.get(`session:${sessionId}`);
    if (sessionData) {
      await this.redisClient.expire(`session:${sessionId}`, 300); // Reset TTL on access (optional)
    }
    return sessionData ? JSON.parse(sessionData) : null;
  }

  async deleteSession(sessionId: string) {
    await this.redisClient.del(`session:${sessionId}`);
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }
}
