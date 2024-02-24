import { OrderEntity } from 'src/orders/entities/order.entity';

export interface IOrdersByCartTimestamp {
  cartTimestamp: number;
  orders: OrderEntity[];
}
