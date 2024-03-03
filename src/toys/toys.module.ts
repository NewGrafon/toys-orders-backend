import { Module, forwardRef } from '@nestjs/common';
import { ToysService } from './toys.service';
import { ToysController } from './toys.controller';
import { LocalCacheModule } from 'src/cache/local-cache.module';
import { ToyEntity } from './entities/toy.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/users/users.module';

@Module({
  controllers: [ToysController],
  providers: [ToysService],
  exports: [ToysService],
  imports: [
    TypeOrmModule.forFeature([ToyEntity]), 
    LocalCacheModule,
    forwardRef(() => UsersModule),
  ],
})
export class ToysModule {}
