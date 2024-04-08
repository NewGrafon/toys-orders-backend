import { forwardRef, Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from './entities/order.entity';
import { UsersModule } from '../users/users.module';
import { LocalCacheModule } from '../cache/local-cache.module';
import { ToysModule } from '../toys/toys.module';
import { TelegramBotModule } from 'src/telegram-bot/telegram-bot.module';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
  imports: [
    TypeOrmModule.forFeature([OrderEntity]),
    LocalCacheModule,
    forwardRef(() => UsersModule),
    ToysModule,
    forwardRef(() => TelegramBotModule),
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
