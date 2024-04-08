/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
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
import { TelegramBotService } from 'src/telegram-bot/telegram-bot.service';
import { UserEntity } from 'src/users/entities/user.entity';
import { Role } from 'src/static/enums/users.enum';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly repository: Repository<OrderEntity>,
    private readonly cacheService: LocalCacheService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => TelegramBotService))
    private readonly telegramBotService: TelegramBotService,
  ) {
    this.timestampsTasksQueue = new OrdersTasksQueue();
  }

  readonly timestampsTasksQueue: OrdersTasksQueue;
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
      this.usersService.clearCart(userId),
      ...(await this.usersService.findAll())
        .map((user: UserEntity) => {
          if (user.telegramUserId && user.role === Role.Deliver) {
            return this.telegramBotService.newOrderNotification(
              user.telegramUserId,
              now,
            );
          } else {
            return undefined;
          }
        })
        .filter((promise) => promise !== undefined),
    ]);

    return Promise.all(
      results.map((order) => {
        return this.findOneById(order.id);
      }),
    );
  }

  async changeAmountInCart(userId: number, cartToyDto: CartToyDto) {
    return this.usersService.changeAmountInCart(userId, cartToyDto);
  }

  async removeFromCart(userId: number, cartToyDto: CartToyDto) {
    return this.usersService.removeFromCart(userId, cartToyDto);
  }

  async takeOrders(userId: number, cartTimestamp: string): Promise<boolean> {
    const orders = await this.findByCartTimestamp(cartTimestamp);

    if (orders.length === 0) {
      throw new ForbiddenException(ExceptionMessages.OrderNotFound);
    }

    if (orders.length > 0 && orders[0].takenBy?.id !== undefined) {
      throw new BadRequestException(ExceptionMessages.OrderAlreadyTaken);
    }

    return await this.timestampsTasksQueue.addToQueue<boolean>(async () => {
      // пока не нужно
      // const workerUser = await this.usersService.findById(orders[0].creator.id);
      // const workerNotification = workerUser.telegramUserId
      //   ? this.telegramBotService.sendOrderTakenByNotification(
      //       workerUser.telegramUserId,
      //       orders[0].cartTimestamp,
      //     )
      //   : async () => {};

      await Promise.all([
        ...orders.map((order) => {
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
        // workerNotification,
      ]);

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
    }, cartTimestamp);
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

    // пока не нужно
    // const workerUser = await this.usersService.findById(orders[0].creator.id);
    // let workerNotification;
    // if (workerUser.telegramUserId) {
    //   if (isFinishedNotCancel) {
    //     workerNotification =
    //       this.telegramBotService.sendOrderFinishedNotification(
    //         workerUser.telegramUserId,
    //         orders[0].cartTimestamp,
    //       );
    //   } else {
    //     workerNotification =
    //       this.telegramBotService.sendOrderCanceledNotification(
    //         workerUser.telegramUserId,
    //         orders[0].cartTimestamp,
    //       );
    //   }
    // }

    await Promise.all([
      ...orders.map((order, index) => {
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
      // workerNotification,
    ]);

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
      select: {
        id: true,
        cartTimestamp: true,
        colorCode: true,
        amount: true,
        desktop: true,
        isClosed: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
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

class OrdersTasksQueue {
  constructor() {
    this.queue = [];
  }

  private readonly queue: ITimestampScope[];

  public async addToQueue<T>(fnc: Function, timestamp: string): Promise<T> {
    if (!timestamp) {
      throw new InternalServerErrorException();
    }

    let exist: boolean = false;
    let nearestEmptyIndexInQueue: number = -1;
    let queueIndex: number = -1;
    let taskIndex: number = -1;

    const newScope: ITimestampScope = {
      timestamp,
      tasks: [
        {
          function: fnc,
          solved: false,
        },
      ],
      working: false,
    };

    this.queue.every((scope: ITimestampScope, index: number) => {
      if (nearestEmptyIndexInQueue === -1 && this.queue[index] === undefined) {
        nearestEmptyIndexInQueue = index;
      }
      if (scope.timestamp === timestamp) {
        queueIndex = index;
        taskIndex = this.queue[index].tasks.push(newScope.tasks[0]) - 1;
        exist = true;
        return false;
      }

      return true;
    });

    if (!exist) {
      if (nearestEmptyIndexInQueue >= 0) {
        queueIndex = nearestEmptyIndexInQueue;
        this.queue[nearestEmptyIndexInQueue] = newScope;
      } else {
        queueIndex = this.queue.push(newScope) - 1;
        taskIndex = 0;
      }
    }

    return new Promise((resolve, reject) => {
      this.findAndStartNotWorkingScope(queueIndex);
      const interval = setInterval(() => {
        if (!this.queue[queueIndex]) {
          clearInterval(interval);
          return reject(
            `Timestamp Scope from this index (${queueIndex}) was been deleted!`,
          );
        }

        if (this.queue[queueIndex].tasks[taskIndex].error) {
          clearInterval(interval);
          return reject(this.queue[queueIndex].tasks[taskIndex].error);
        }

        if (this.queue[queueIndex].tasks[taskIndex].solved) {
          clearInterval(interval);
          return resolve(this.queue[queueIndex].tasks[taskIndex].result);
        }
      }, 25);
    });
  }

  private findAndStartNotWorkingScope(queueIndex: number): void {
    if (this.queue[queueIndex].working) {
      return;
    }

    this.queue[queueIndex].working = true;

    this.queue[queueIndex].tasks.every((task: ITimestampFunction, index) => {
      if (task.solved) {
        return true;
      }

      task
        .function()
        .then((result: any) => {
          this.queue[queueIndex].tasks[index].result = result;
        })
        .catch((err: any) => {
          this.queue[queueIndex].tasks[index].error = err;
        })
        .finally(() => {
          this.queue[queueIndex].tasks[index].solved = true;
          let allSolved: boolean = true;
          this.queue[queueIndex].tasks.every((task) => {
            if (task.solved === false) {
              allSolved = false;
              return false;
            }

            return true;
          });

          this.queue[queueIndex].working = false;

          if (!allSolved) {
            this.findAndStartNotWorkingScope(queueIndex);
          }
        });

      return false;
    });
  }

  public removeFromQueue(timestamp: string): void {
    let index: number;
    this.queue.every((scope, _index) => {
      if (scope.timestamp === timestamp) {
        index = _index;
      }
    });

    if (index) {
      delete this.queue[index];
    }
  }
}

interface ITimestampScope {
  timestamp: string;
  tasks: ITimestampFunction[];
  working: boolean;
}

interface ITimestampFunction {
  function: Function;
  solved: boolean;
  result?: any;
  error?: any;
}
