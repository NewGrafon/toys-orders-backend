import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderEntity } from './entities/order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocalCacheService } from '../cache/local-cache.service';
import { ICacheKeys } from '../static/interfaces/cache.interfaces';
import { ExceptionMessages } from '../static/enums/messages.enums';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly repository: Repository<OrderEntity>,
    private readonly cacheService: LocalCacheService,
  ) {}

  readonly cacheKeys: ICacheKeys = this.cacheService.cacheKeys();

  async create(
    userId: number,
    createOrderDto: CreateOrderDto,
  ): Promise<OrderEntity> {
    createOrderDto = Object.assign(createOrderDto, {
      creator: {
        id: userId,
      },
    });
    const result = (await this.repository.insert(createOrderDto))
      .generatedMaps[0] as OrderEntity;

    await this.cacheService.del(this.cacheKeys.order(result.id));

    return this.findOneById(result.id);
  }

  async takeOrder(orderId: number, userId: number): Promise<boolean> {
    const order = await this.findOneById(orderId);

    if (order && order.takenBy?.id !== undefined) {
      throw new BadRequestException(ExceptionMessages.OrderAlreadyTaken);
    }

    await this.repository.update(
      {
        id: orderId,
      },
      {
        takenBy: {
          id: userId,
        },
      },
    );

    await Promise.all([
      this.cacheService.del(this.cacheKeys.order(orderId)),
      this.cacheService.del(this.cacheKeys.allOrders()),
    ]);

    return true;
  }

  async closeOrder(orderId: number, isFinishedNotCancel: boolean, userId: number) {
    const order = await this.findOneById(orderId);

    if (
      !order ||
      !order?.takenBy?.id ||
      (order.creator.id !== userId && order.takenBy.id !== userId)
    ) {
      throw new ForbiddenException(ExceptionMessages.OrderNotFound);
    }

    await Promise.all([
      this.repository.update({ id: orderId }, { isClosed: isFinishedNotCancel, takenBy: isFinishedNotCancel ? order.takenBy : null }),
      this.cacheService.del(this.cacheKeys.order(orderId)),
      this.cacheService.del(this.cacheKeys.allOrders()),
    ]);

    return true;
  }

  async cancelOrder(orderId: number, userId: number) {
    const order = await this.findOneById(orderId);

    if (!order || order.creator.id !== userId) {
      throw new ForbiddenException(ExceptionMessages.OrderNotFound);
    }

    await Promise.all([
      this.repository.softDelete({ id: orderId }),
      this.cacheService.del(this.cacheKeys.order(orderId)),
      this.cacheService.del(this.cacheKeys.allOrders()),
    ]);

    return true;
  }

  async findAll(): Promise<OrderEntity[]> {
    const cachedData = await this.cacheService.get(this.cacheKeys.allOrders());
    if (cachedData) {
      return <OrderEntity[]>cachedData;
    }

    let orders = await this.repository.find({
      relations: {
        creator: true,
        takenBy: true,
      },
      withDeleted: true,
    });

    orders = orders.map((order) => {
      // @ts-ignore
      order.takenBy = {
        id: order?.takenBy?.id,
        firstname: order?.takenBy?.firstname,
        lastname: order?.takenBy?.lastname,
      };

      // @ts-ignore
      order.creator = {
        id: order?.creator?.id,
        firstname: order?.creator?.firstname,
        lastname: order?.creator?.lastname,
      };

      return order;
    });

    await this.cacheService.set(this.cacheKeys.allOrders(), orders);

    return orders;
  }

  async findOneById(orderId: number): Promise<OrderEntity> {
    const cachedData = await this.cacheService.get(
      this.cacheKeys.order(orderId),
    );
    if (cachedData) {
      return <OrderEntity>cachedData;
    }

    const order = await this.repository.findOne({
      relations: {
        creator: true,
        takenBy: true,
      },
      where: {
        id: orderId,
      },
      withDeleted: true,
    });

    if (!order) {
      throw new ForbiddenException(ExceptionMessages.OrderNotFound);
    }

    // @ts-ignore
    order.takenBy = {
      id: order.takenBy?.id,
      firstname: order.takenBy?.firstname,
      lastname: order.takenBy?.lastname,
    };

    // @ts-ignore
    order.creator = {
      id: order?.creator.id,
      firstname: order?.creator.firstname,
      lastname: order?.creator.lastname,
    };

    await this.cacheService.set(this.cacheKeys.order(orderId), order);

    return order;
  }
}
