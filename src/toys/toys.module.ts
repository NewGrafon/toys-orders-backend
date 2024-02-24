import { Module } from '@nestjs/common';
import { ToysService } from './toys.service';
import { ToysController } from './toys.controller';
import { LocalCacheModule } from 'src/cache/local-cache.module';

@Module({
  controllers: [ToysController],
  providers: [ToysService],
  imports: [LocalCacheModule],
})
export class ToysModule {}
