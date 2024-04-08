import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { dateFormatToString } from 'src/static/functions/date-formatter.function';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TelegramBot = require('node-telegram-bot-api');
import { TimestampType } from 'src/static/types/timestamp.type';

@Injectable()
export class TelegramBotService {
  private readonly bot: any;
  constructor(private readonly configService: ConfigService) {
    this.bot = new TelegramBot(this.configService.get('TELEGRAM_TOKEN'), {
      polling: true,
    });
    this.bot.on('messaage', (message) => {
      if (message.text === '/start') {
        message.reply(
          'Добро пожаловать! Нажмите на кнопку слева от поля ввода текста чтобы запустить приложение.',
          // Markup.keyboard([
          //     Markup.button.webApp(
          //         'Отправить сообщение',
          //         webAppUrl
          //     )
          // ]),
        );
      }
    });
    // this.previousCheckDate = new Date().getTime();
    // setInterval(this.checkNewOrders, 30000);
  }
  // previousCheckDate: number;
  // async checkNewOrders() {
  //     let orders: OrderEntity[] = await this.ordersService.findAll();
  //     orders = orders.filter((order) => !order.takenBy && new Date(order.createdAt).getTime() > this.previousCheckDate);
  //     if (orders.length > 0) {
  //         this.sendMessageNewOrders(orders.length);
  //     }
  //     this.previousCheckDate = new Date().getTime();
  // }

  async sendOrderTakenByNotification(
    telegramUserId: number,
    cartTimestamp: TimestampType,
  ) {
    const message: string = `Ваш заказ от даты "${dateFormatToString(
      cartTimestamp as Date,
    )}" взят в работу.`;
    this.bot.sendMessage(telegramUserId, message);
  }

  async sendOrderFinishedNotification(
    telegramUserId: number,
    cartTimestamp: TimestampType,
  ) {
    const message: string = `Ваш заказ от даты "${dateFormatToString(
      cartTimestamp as Date,
    )}" завершен.`;
    this.bot.sendMessage(telegramUserId, message);
  }

  async sendOrderCanceledNotification(
    telegramUserId: number,
    cartTimestamp: TimestampType,
  ) {
    const message: string = `Доставщик, что взял Ваш заказ от даты "${dateFormatToString(
      cartTimestamp as Date,
    )}", отказался от него.`;
    this.bot.sendMessage(telegramUserId, message);
  }
}
