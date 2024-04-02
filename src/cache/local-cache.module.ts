import { Module } from '@nestjs/common';
import { LocalCacheService } from './local-cache.service';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      ttl: 120,
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      user: 'default',
      password: process.env.REDIS_PASSWORD,
    }),
  ],
  providers: [LocalCacheService],
  exports: [LocalCacheService],
})
export class LocalCacheModule {}
