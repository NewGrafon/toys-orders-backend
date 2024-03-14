import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from '../auth/guards/auth.guard.service';
import { RolesList } from '../static/decorators/auth.decorators';
import { Role } from '../static/enums/users.enum';
import { UserId } from '../static/decorators/user-id.decorator';
import { CreateCartDto } from './dto/create-cart.dto';
import { CartToyDto as CartToyDto } from './dto/cart-toy.dto';
import { CloseOrdersDto } from './dto/close-order.dto';

@Controller('orders')
@UseGuards(AuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('change_in_cart')
  @RolesList(Role.Worker)
  changeAmountInCart(@UserId() userId: number, @Body() cartToyDto: CartToyDto) {
    return this.ordersService.changeAmountInCart(userId, cartToyDto);
  }

  @Delete('remove_from_cart')
  @RolesList(Role.Worker)
  removeFromCart(@UserId() userId: number, @Body() cartToyDto: CartToyDto) {
    return this.ordersService.removeFromCart(userId, cartToyDto);
  }

  @Post('confirm_cart')
  @RolesList(Role.Worker)
  confirmCart(@UserId() userId: number, @Body() createCartDto: CreateCartDto) {
    return this.ordersService.confirmCart(userId, createCartDto);
  }

  @Patch('take/:cartTimestamp')
  @RolesList(Role.Deliver)
  takeOrders(
    @Param('cartTimestamp') cartTimestamp: string,
    @UserId() userId: number,
  ) {
    return this.ordersService.takeOrders(userId, cartTimestamp);
  }

  @Patch('close/:cartTimestamp/:isFinishedNotCancel')
  @RolesList(Role.Worker, Role.Deliver)
  closeOrders(
    @Param('cartTimestamp') cartTimestamp: string,
    @Param('isFinishedNotCancel', ParseBoolPipe) isFinishedNotCancel: boolean,
    @UserId() userId: number,
    @Body() closeOrdersDto: CloseOrdersDto,
  ) {
    return this.ordersService.closeOrders(
      cartTimestamp,
      isFinishedNotCancel,
      userId,
      closeOrdersDto,
    );
  }

  @Delete('cancel/:cartTimestamp')
  @RolesList(Role.Worker)
  cancelOrders(
    @Param('cartTimestamp') cartTimestamp: string,
    @UserId() userId: number,
  ) {
    return this.ordersService.cancelOrders(cartTimestamp, userId);
  }

  @Get('get_all')
  @RolesList()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get('colors_info')
  @RolesList()
  getColorsInfo() {
    return this.ordersService.getColorsInfo();
  }

  @Get('get_by_timestamp/:cartTimestamp')
  @RolesList()
  findOneByCartTimestamp(@Param('cartTimestamp') cartTimestamp: string) {
    return this.ordersService.findByCartTimestamp(cartTimestamp);
  }

  @Get(':id')
  @RolesList()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOneById(id);
  }
}
