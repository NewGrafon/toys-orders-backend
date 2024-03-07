import { OrderEntity } from 'src/orders/entities/order.entity';

export interface IOrdersByCartTimestamp {
  cartTimestamp: string;
  orders: OrderEntity[];
}
