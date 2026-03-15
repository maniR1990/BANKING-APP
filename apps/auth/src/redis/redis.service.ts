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
    return sessionData ? JSON.parse(sessionData) : null;
  }

  async refreshSession(sessionId: string, expiresInSeconds: number) {
    await this.redisClient.expire(`session:${sessionId}`, expiresInSeconds);
  }

  async deleteSession(sessionId: string) {
    await this.redisClient.del(`session:${sessionId}`);
  }

  async invalidateAllSessionsForUser(userId: string) {
    // Note: In a production app, it's better to store a reverse lookup mapping
    // of userId -> Set of sessionIds, or index them.
    // For simplicity, we are scanning all sessions.
    const keys = await this.redisClient.keys('session:*');
    for (const key of keys) {
      const sessionData = await this.redisClient.get(key);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        if (parsed.userId === userId) {
          await this.redisClient.del(key);
        }
      }
    }
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }
}
