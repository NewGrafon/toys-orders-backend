import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { OrdersService } from '../orders/orders.service';
import { LocalCacheService } from '../cache/local-cache.service';
import { ICacheKeys } from '../static/interfaces/cache.interfaces';
import { ExceptionMessages } from '../static/enums/messages.enums';
import * as bcrypt from 'bcrypt';
import { BCRYPT_SALT } from '../static/consts/bcrypt.const';
import { Role } from '../static/enums/users.enum';
import { ConfigService } from '@nestjs/config';
import { CartToyDto } from 'src/orders/dto/cart-toy.dto';
import { ToysService } from 'src/toys/toys.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
    private readonly ordersService: OrdersService,
    private readonly cacheService: LocalCacheService,
    private readonly configService: ConfigService,
    private readonly toysService: ToysService,
  ) {
    this.repository
      .findOneBy({
        firstname: 'Администратор',
        lastname: '',
      })
      .then((r) => {
        const hashedPassword: string = bcrypt.hashSync(
          configService.get('SECRET_WORD'),
          BCRYPT_SALT,
        );
        if (!r) {
          this.repository.insert({
            firstname: 'Администратор',
            lastname: '',
            role: Role.Admin,
            password: hashedPassword,
          });
        } else {
          if (r.password !== hashedPassword) {
            this.repository.update(
              {
                id: r.id,
              },
              {
                password: hashedPassword,
              },
            );
          }
        }
      });
  }

  readonly cacheKeys: ICacheKeys = this.cacheService.cacheKeys();

  async changeAmountInCart(
    userId: number,
    cartToyDto: CartToyDto,
  ): Promise<UserEntity> {
    if (cartToyDto.amount === 0) {
      throw new BadRequestException(ExceptionMessages.ToyAmountIncorrect);
    }

    const toy = await this.toysService.findOne(cartToyDto.id);

    if (!toy) {
      throw new ForbiddenException(ExceptionMessages.ToyNotFound);
    }

    const user = await this.findById(userId);

    if (!user) {
      throw new ForbiddenException(ExceptionMessages.UserNotFound);
    }

    if (
      typeof user.cart !== 'object' ||
      user.cart === undefined ||
      user.cart === null
    ) {
      user.cart = [];
    }

    let toyExistInArray: boolean = false;
    user.cart.every((cartToy: CartToyDto, index: number) => {
      if (
        cartToy.id === cartToyDto.id &&
        cartToy.colorCode === cartToyDto.colorCode
      ) {
        user[index].amount += cartToyDto.amount;
        toyExistInArray = true;
        return false;
      }
      return true;
    });

    if (!toyExistInArray && cartToyDto.amount > 0) {
      user.cart.push(cartToyDto);
    }

    const updatedUser = await this.repository.save(user);

    await Promise.all([this.cacheService.del(this.cacheKeys.user(userId))]);

    return updatedUser;
  }

  async removeFromCart(
    userId: number,
    cartToyDto: CartToyDto,
  ): Promise<UserEntity> {
    const toy = await this.toysService.findOne(cartToyDto.id);

    if (!toy) {
      throw new ForbiddenException(ExceptionMessages.ToyNotFound);
    }

    const user = await this.findById(userId);

    if (!user) {
      throw new ForbiddenException(ExceptionMessages.UserNotFound);
    }

    if (
      typeof user.cart !== 'object' ||
      user.cart === undefined ||
      user.cart === null
    ) {
      user.cart = [];
      return this.repository.save(user);
    }

    user.cart = user.cart.filter((cartToy: CartToyDto) => {
      if (
        cartToy.id === cartToyDto.id &&
        cartToy.colorCode === cartToyDto.colorCode
      ) {
        return false;
      }
      return true;
    });

    const updatedUser = await this.repository.save(user);

    await Promise.all([this.cacheService.del(this.cacheKeys.user(userId))]);

    return updatedUser;
  }

  async findAll(): Promise<UserEntity[]> {
    const cachedData = await this.cacheService.get(this.cacheKeys.allUsers());
    if (cachedData) {
      return <UserEntity[]>cachedData;
    }

    const users = await this.repository.find({
      // relations: {
      //   cart: true,
      // },
      withDeleted: true,
      order: {
        createdAt: 'DESC',
      },
    });

    await this.cacheService.set(this.cacheKeys.allUsers(), users, 900);

    return users;
  }

  async findById(userId: number, withPassword?: boolean): Promise<UserEntity> {
    if (!withPassword) {
      const cachedData = await this.cacheService.get(
        this.cacheKeys.user(userId),
      );
      if (cachedData) {
        return <UserEntity>cachedData;
      }
    }

    const user = await this.repository.findOne({
      // relations: {
      //   cart: true,
      // },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        role: true,
        cart: true,
        password: withPassword ?? false,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
      where: {
        id: userId,
      },
      withDeleted: true,
    });

    if (!withPassword) {
      await this.cacheService.set(this.cacheKeys.user(userId), user);
    }

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    let hashedPassword: string;
    if (createUserDto.password) {
      hashedPassword = await bcrypt.hash(createUserDto.password, BCRYPT_SALT);
      createUserDto.password = hashedPassword;
    } else {
      throw new BadRequestException(ExceptionMessages.SomethingWrong);
    }

    const result = (await this.repository.insert(createUserDto))
      .generatedMaps[0] as UserEntity;

    await this.cacheService.del(this.cacheKeys.allUsers());

    return this.findById(result.id);
  }

  async update(userId: number, updateUserDto: UpdateUserDto) {
    let user: UserEntity;

    const cachedData = await this.cacheService.get(this.cacheKeys.user(userId));
    if (cachedData) {
      user = <UserEntity>cachedData;
    } else {
      user = await this.repository.findOneBy({
        id: userId,
      });
    }

    if (!user) {
      throw new ForbiddenException(ExceptionMessages.UserNotFound);
    }

    let hashedPassword: string;
    if (updateUserDto.password) {
      hashedPassword = await bcrypt.hash(updateUserDto.password, BCRYPT_SALT);
      updateUserDto.password = hashedPassword;
    }

    await Promise.all([
      this.repository.update(
        {
          id: userId,
        },
        {
          firstname: updateUserDto.firstname ?? user.firstname,
          lastname: updateUserDto.lastname ?? user.lastname,
          role: updateUserDto.role ?? user.role,
          password: updateUserDto.password ?? user.password,
        },
      ),
      this.cacheService.del(this.cacheKeys.user(userId)),
      this.cacheService.del(this.cacheKeys.allUsers()),
    ]);

    return this.findById(userId);
  }

  async remove(userId: number) {
    await Promise.all([
      this.repository.softDelete({
        id: userId,
      }),
      this.cacheService.del(this.cacheKeys.user(userId)),
      this.cacheService.del(this.cacheKeys.allUsers()),
    ]);

    return this.findById(userId);
  }
}
