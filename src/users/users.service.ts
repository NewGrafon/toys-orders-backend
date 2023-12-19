import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from "./entities/user.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { OrdersService } from "../orders/orders.service";
import { LocalCacheService } from "../cache/local-cache.service";

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
    private readonly ordersService: OrdersService,
    private readonly cacheService: LocalCacheService,
  ) {
  }

  create(createUserDto: CreateUserDto) {

    return '';
  }

  findAll(): Promise<UserEntity[]> {
    return '';
  }

  async findById(id: number, withPassword?: boolean): Promise<UserEntity> {
    return '';
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return '';
  }

  remove(id: number) {
    return '';
  }
}
