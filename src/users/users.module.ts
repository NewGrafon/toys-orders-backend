import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { OrdersModule } from '../orders/orders.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { LocalCacheModule } from '../cache/local-cache.module';
import { ToysModule } from 'src/toys/toys.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    forwardRef(() => OrdersModule),
    LocalCacheModule,
    ToysModule,
  ],
})
export class UsersModule {}
