import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderEntity } from './entities/order.entity';

@Injectable()
export class OrdersService {
  async create(
    userId: number,
    createOrderDto: CreateOrderDto,
  ): Promise<OrderEntity> {
    return '';
  }

  async takeOrder(id: number, userId: number): Promise<OrderEntity> {
    return '';
  }

  async findAll(): Promise<OrderEntity[]> {
    return '';
  }

  async findOne(id: number): Promise<OrderEntity> {
    return '';
  }

  async update(
    id: number,
    userId: number,
    updateOrderDto: UpdateOrderDto,
  ): Promise<OrderEntity> {
    return '';
  }

  async remove(id: number, userId: number) {
    return '';
  }
}
