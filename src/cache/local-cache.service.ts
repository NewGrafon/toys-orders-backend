import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ICacheKeys } from '../static/interfaces/cache.interfaces';

@Injectable()
export class LocalCacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  // eslint-disable-next-line @typescript-eslint/ban-types
  public readonly cacheKeys: Function = (): ICacheKeys => {
    return {
      user: (id: string | number): string => {
        return `user-${id}`;
      },
      allUsers: (): string => {
        return `user-all`;
      },
      toyById: (id: string | number): string => {
        return `toy-id-${id}`;
      },
      toyByCode: (code: string): string => {
        return `toy-code-${code}`;
      },
      allToys: (): string => {
        return `toy-all`;
      },
      ordersByCartTimestamp: (cartTimestamp: string | number): string => {
        return `orders-timestamp-${cartTimestamp}`;
      },
      orderById: (id: string | number): string => {
        return `order-id-${id}`;
      },
      allOrders: (): string => {
        return `order-all`;
      },
    };
  };

  async get(key: string): Promise<object | string | null> {
    const cachedData = await this.cacheManager.get(key);
    if (cachedData) {
      try {
        const json = JSON.parse(<string>cachedData);
        return json;
      } catch {
        return <string>cachedData.toString();
      }
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
