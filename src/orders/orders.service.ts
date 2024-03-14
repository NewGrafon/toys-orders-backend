/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { OrderEntity } from './entities/order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { InsertResult, Repository } from 'typeorm';
import { LocalCacheService } from '../cache/local-cache.service';
import { ICacheKeys } from '../static/interfaces/cache.interfaces';
import { ExceptionMessages } from '../static/enums/messages.enums';
import { ColorCode } from 'src/static/enums/colors-codes.enum';
import { CreateCartDto } from './dto/create-cart.dto';
import { CartToyDto } from './dto/cart-toy.dto';
import { IOrdersByCartTimestamp } from 'src/static/interfaces/orders.interfaces';
import { UsersService } from 'src/users/users.service';
import { CloseOrdersDto } from './dto/close-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly repository: Repository<OrderEntity>,
    private readonly cacheService: LocalCacheService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersSerice: UsersService,
  ) {}

  readonly cacheKeys: ICacheKeys = this.cacheService.cacheKeys();

  async confirmCart(
    userId: number,
    createCartDto: CreateCartDto,
  ): Promise<OrderEntity[]> {
    const now: Date = new Date();

    createCartDto = Object.assign(createCartDto, {
      creator: {
        id: userId,
      },
    });

    const results: OrderEntity[] = (
      await Promise.all(
        createCartDto.cart.map((_toy) => {
          return this.repository.insert({
            cartTimestamp: now.toISOString(),
            creator: {
              id: userId,
            },
            toy: {
              id: _toy.id,
            },
            colorCode: _toy.colorCode,
            amount: _toy.amount,
            desktop: createCartDto.desktop,
          });
        }),
      )
    ).map((result: InsertResult) => {
      return result.generatedMaps[0] as OrderEntity;
    });

    await this.cacheService.del(this.cacheKeys.allOrders());

    Promise.all([
      ...results.map((result) => {
        return this.findOneById(result.id);
      }),
      this.usersSerice.clearCart(userId),
    ]);

    return this.findByCartTimestamp(results[0].cartTimestamp.toString());
  }

  async changeAmountInCart(userId: number, cartToyDto: CartToyDto) {
    return this.usersSerice.changeAmountInCart(userId, cartToyDto);
  }

  async removeFromCart(userId: number, cartToyDto: CartToyDto) {
    return this.usersSerice.removeFromCart(userId, cartToyDto);
  }

  async takeOrders(userId: number, cartTimestamp: string): Promise<boolean> {
    const orders = await this.findByCartTimestamp(cartTimestamp);

    if (orders.length === 0) {
      throw new ForbiddenException(ExceptionMessages.OrderNotFound);
    }

    if (orders.length > 0 && orders[0].takenBy?.id !== undefined) {
      throw new BadRequestException(ExceptionMessages.OrderAlreadyTaken);
    }

    await Promise.all(
      orders.map((order) => {
        return this.repository.update(
          {
            id: order.id,
          },
          {
            takenBy: {
              id: userId,
            },
          },
        );
      }),
    );

    const timestamp = new Date(cartTimestamp);
    const allPromises: Promise<void>[] = [];
    orders.forEach((order) => {
      allPromises.push(
        this.cacheService.del(this.cacheKeys.orderById(order.id)),
      );
      allPromises.push(
        this.cacheService.del(
          this.cacheKeys.ordersByCartTimestamp(timestamp.getTime()),
        ),
      );
    });
    allPromises.push(this.cacheService.del(this.cacheKeys.allOrders()));
    await Promise.all(allPromises);

    return true;
  }

  async closeOrders(
    cartTimestamp: string,
    isFinishedNotCancel: boolean,
    userId: number,
    closeOrdersDto: CloseOrdersDto,
  ) {
    const orders = await this.findByCartTimestamp(cartTimestamp);

    if (
      orders.length === 0 ||
      !orders[0]?.takenBy?.id ||
      (orders[0].creator.id !== userId && orders[0].takenBy.id !== userId)
    ) {
      throw new ForbiddenException(ExceptionMessages.OrderNotFound);
    }

    if (
      closeOrdersDto.editedOrders.length > 0 &&
      closeOrdersDto.editedOrders.length !== orders.length
    ) {
      throw new ForbiddenException(ExceptionMessages.IncorrectCloseOrdersDto);
    }

    await Promise.all(
      orders.map((order, index) => {
        let newAmount: number;
        const amountType = closeOrdersDto.editedOrders[index]?.type || 'all';
        switch (amountType) {
          case 'all': {
            newAmount = order.amount;
            break;
          }
          case 'not-all': {
            newAmount = closeOrdersDto.editedOrders[index]?.newAmount || 0;
            break;
          }
          case 'none': {
            newAmount = 0;
            break;
          }
          default: {
            newAmount = order.amount;
            break;
          }
        }

        return this.repository.update(
          {
            id: order.id,
          },
          {
            isClosed: isFinishedNotCancel,
            takenBy: isFinishedNotCancel ? order.takenBy : null,
            amount: newAmount,
          },
        );
      }),
    );

    const timestamp = new Date(cartTimestamp);
    const allPromises: Promise<void>[] = [];
    orders.forEach((order) => {
      allPromises.push(
        this.cacheService.del(this.cacheKeys.orderById(order.id)),
      );
      allPromises.push(
        this.cacheService.del(
          this.cacheKeys.ordersByCartTimestamp(timestamp.getTime()),
        ),
      );
    });
    allPromises.push(this.cacheService.del(this.cacheKeys.allOrders()));
    await Promise.all(allPromises);

    return true;
  }

  async cancelOrders(cartTimestamp: string, userId: number) {
    const timestamp = new Date(cartTimestamp);

    const orders = await this.findByCartTimestamp(cartTimestamp);

    if (orders.length === 0 || orders[0]?.creator?.id !== userId) {
      throw new ForbiddenException(ExceptionMessages.OrderNotFound);
    }

    const allPromises: Promise<any>[] = [];
    orders.forEach((order) => {
      allPromises.push(
        this.repository.update(
          {
            id: order.id,
          },
          {
            takenBy: null,
          },
        ),
      );
      allPromises.push(
        this.cacheService.del(this.cacheKeys.orderById(order.id)),
      );
      allPromises.push(
        this.cacheService.del(
          this.cacheKeys.ordersByCartTimestamp(timestamp.getTime()),
        ),
      );
    });
    allPromises.push(this.cacheService.del(this.cacheKeys.allOrders()));
    allPromises.push(this.repository.softDelete({ cartTimestamp: timestamp }));
    await Promise.all(allPromises);

    return true;
  }

  async findAll(): Promise<IOrdersByCartTimestamp[]> {
    const cachedData = await this.cacheService.get(this.cacheKeys.allOrders());
    if (cachedData) {
      return <IOrdersByCartTimestamp[]>cachedData;
    }

    let orders: OrderEntity[] = await this.repository.find({
      relations: {
        creator: true,
        takenBy: true,
        toy: true,
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

    const obj: any = {};

    for (const order of orders) {
      const timestamp: string = order.cartTimestamp.toString();
      if (obj[timestamp]?.orders === undefined) {
        obj[timestamp] = {};
        obj[timestamp].orders = [];
      }

      obj[timestamp].orders.push(order);
    }

    const groupedOrders: IOrdersByCartTimestamp[] = [];

    for (const key in obj) {
      groupedOrders.push({
        cartTimestamp: new Date(key).getTime().toString(),
        orders: obj[key].orders,
      });
    }

    await this.cacheService.set(this.cacheKeys.allOrders(), groupedOrders, 300);

    return groupedOrders;
  }

  async findByCartTimestamp(cartTimestamp: string): Promise<OrderEntity[]> {
    const timestamp = new Date(cartTimestamp);
    const cachedData = (await this.cacheService.get(
      this.cacheKeys.ordersByCartTimestamp(timestamp.getTime()),
    )) as OrderEntity[];

    if (cachedData) {
      return cachedData;
    }

    let orders = await this.repository.find({
      relations: {
        creator: true,
        takenBy: true,
        toy: true,
      },
      where: {
        cartTimestamp: timestamp,
      },
      withDeleted: true,
    });

    if (orders.length === 0) {
      throw new ForbiddenException(ExceptionMessages.OrdersNotFound);
    }

    orders = orders.map((order) => {
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

      return order;
    });

    await Promise.all([
      this.cacheService.set(
        this.cacheKeys.ordersByCartTimestamp(timestamp.getTime()),
        orders,
      ),
    ]);

    return orders;
  }

  async findOneById(orderId: number): Promise<OrderEntity> {
    const cachedData = await this.cacheService.get(
      this.cacheKeys.orderById(orderId),
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

    await this.cacheService.set(this.cacheKeys.orderById(orderId), order);

    return order;
  }

  getColorsInfo(): object {
    const values = Object.keys(ColorCode);
    const keys = Object.values(ColorCode);
    const result = {};
    for (let i = 0; i < keys.length / 2; i++) {
      result[keys[i]] = values[i];
    }

    return result;
  }
}
