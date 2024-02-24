import { Injectable } from '@nestjs/common';
// import { OrderEntity } from 'src/orders/entities/order.entity';
// import { OrdersService } from 'src/orders/orders.service';
// import { Role } from 'src/static/enums/users.enum';
// import { UserEntity } from 'src/users/entities/user.entity';
// import { UsersService } from 'src/users/users.service';

@Injectable()
export class TelegramBotService {
  // constructor(
  //     private readonly ordersService: OrdersService,
  //     private readonly usersService: UsersService,
  // ) {
  //     this.previousCheckDate = new Date().getTime();
  //     setInterval(this.checkNewOrders, 30000);
  // }
  // previousCheckDate: number;
  // async checkNewOrders() {
  //     let orders: OrderEntity[] = await this.ordersService.findAll();
  //     orders = orders.filter((order) => !order.takenBy && new Date(order.createdAt).getTime() > this.previousCheckDate);
  //     if (orders.length > 0) {
  //         this.sendMessageNewOrders(orders.length);
  //     }
  //     this.previousCheckDate = new Date().getTime();
  // }
  // async sendMessageNewOrders(amount: number) {
  //     const users: UserEntity[] = (await this.usersService.findAll()).filter((user) => user?.telegramId && user.role === Role.Deliver);
  // }
}
