import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from '../auth/guards/auth.guard.service';
import { RolesList } from '../static/decorators/auth.decorators';
import { Role } from '../static/enums/users.enum';
import { UserId } from '../static/decorators/user-id.decorator';

@Controller('orders')
@UseGuards(AuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('create')
  @RolesList(Role.Worker)
  create(@UserId() userId: number, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(userId, createOrderDto);
  }

  @Patch('take/:id')
  @RolesList(Role.Deliver)
  takeOrder(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.ordersService.takeOrder(id, userId);
  }

  @Patch('close/:id')
  @RolesList(Role.Worker, Role.Deliver)
  closeOrder(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.ordersService.closeOrder(id, userId);
  }

  @Delete('cancel/:id')
  @RolesList(Role.Worker)
  cancelOrder(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.ordersService.cancelOrder(id, userId);
  }

  @Get('get_all')
  @RolesList()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  @RolesList()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOneById(id);
  }
}
