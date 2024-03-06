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

  // need test
  @Post('confirm_cart')
  @RolesList(Role.Worker)
  confirmCart(@UserId() userId: number, @Body() createCartDto: CreateCartDto) {
    return this.ordersService.confirmCart(userId, createCartDto);
  }

  // need test
  @Patch('take/:cartTimestamp')
  @RolesList(Role.Deliver)
  takeOrders(
    @Param('cartTimestamp', ParseIntPipe) cartTimestamp: number,
    @UserId() userId: number,
  ) {
    return this.ordersService.takeOrders(userId, cartTimestamp);
  }

  // need test
  @Patch('close/:cartTimestamp/:isFinishedNotCancel')
  @RolesList(Role.Worker, Role.Deliver)
  closeOrders(
    @Param('cartTimestamp', ParseIntPipe) cartTimestamp: number,
    @Param('isFinishedNotCancel', ParseBoolPipe) isFinishedNotCancel: boolean,
    @UserId() userId: number,
  ) {
    return this.ordersService.closeOrders(
      cartTimestamp,
      isFinishedNotCancel,
      userId,
    );
  }

  // need test
  @Delete('cancel/:cartTimestamp')
  @RolesList(Role.Worker)
  cancelOrders(
    @Param('cartTimestamp', ParseIntPipe) cartTimestamp: number,
    @UserId() userId: number,
  ) {
    return this.ordersService.cancelOrder(cartTimestamp, userId);
  }

  // need test
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

  // need test
  @Get(':id')
  @RolesList()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOneById(id);
  }
}
