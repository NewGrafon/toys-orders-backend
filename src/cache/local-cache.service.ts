import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class LocalCacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  readonly cacheKeys: object = {
    user: (id: string | number): string => {
      return `user-${id}`;
    },
    allUsers: (): string => {
      return `user-all`;
    },
    order: (id: string | number): string => {
      return `order-${id}`;
    },
    allOrders: (): string => {
      return `order-all`;
    },
  } as const;

  async get(key: string): Promise<object | null> {
    const cachedData = await this.cacheManager.get(key);
    if (cachedData) {
      return JSON.parse(<string>cachedData);
    } else {
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number) {
    if (typeof value === 'object') {
      value = JSON.stringify(value);
    } else {
      value.toString();
    }

    return await this.cacheManager.set(key, value, ttl ?? 60);
  }
}
