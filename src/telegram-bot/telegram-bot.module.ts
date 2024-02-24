import { Module } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
// import { OrdersModule } from 'src/orders/orders.module';
// import { UsersModule } from 'src/users/users.module';

@Module({
  providers: [TelegramBotService],
  imports: [
    // OrdersModule,
    // UsersModule,
  ],
})
export class TelegramBotModule {}
