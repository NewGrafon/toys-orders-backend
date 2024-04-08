import { Module } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { OrdersModule } from 'src/orders/orders.module';
import { UsersModule } from 'src/users/users.module';
import TelegramBot from 'node-telegram-bot-api';

@Module({
  providers: [TelegramBotService],
  exports: [TelegramBotService],
  imports: [],
})
export class TelegramBotModule {}
