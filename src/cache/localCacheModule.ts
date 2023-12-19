import { Module } from "@nestjs/common";
import { LocalCacheService } from "./local-cache.service";
import { CacheModule } from "@nestjs/cache-manager";

@Module({
  imports: [
    CacheModule.register({
      ttl: 60
    })
  ],
  providers: [LocalCacheService],
  exports: [LocalCacheService]
})
export class LocalCacheModule {
}
