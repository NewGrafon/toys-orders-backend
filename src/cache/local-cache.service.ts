import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ICacheKeys } from '../static/interfaces/cache.interfaces';

@Injectable()
export class LocalCacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  public readonly cacheKeys: Function = (): ICacheKeys => {
    return {
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
    };
  };

  async get(key: string): Promise<object | null> {
    const cachedData = await this.cacheManager.get(key);
    if (cachedData) {
      return JSON.parse(<string>cachedData);
    } else {
      return null;
    }
  }

  set(key: string, value: any, ttl?: number) {
    if (typeof value === 'object') {
      value = JSON.stringify(value);
    } else {
      value.toString();
    }

    return this.cacheManager.set(key, value, ttl ?? 60);
  }

  del(key: string) {
    return this.cacheManager.del(key);
  }
}
