import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";
import { AuthGuard } from "../auth/guards/auth.guard.service";
import { RolesList } from "../static/decorators/auth.decorators";
import { Role } from "../static/enums/users.enum";
import { UserId } from "../static/decorators/user-id.decorator";

@Controller("orders")
@UseGuards(AuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {
  }

  @Post("create")
  @RolesList(Role.Worker)
  create(@UserId() userId: number, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(userId, createOrderDto);
  }

  @Patch("take")
  @RolesList(Role.Deliver)
  takeOrder(@Param("id", ParseIntPipe) id: number, @UserId() userId: number) {
    return this.ordersService.takeOrder(id, userId);
  }

  @Get("get_all")
  @RolesList()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(":id")
  @RolesList()
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  @Patch(":id")
  @RolesList(Role.Worker)
  update(@Param("id", ParseIntPipe) id: number, @UserId() userId: number, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, userId, updateOrderDto);
  }

  @Delete(":id")
  @RolesList(Role.Worker)
  remove(@Param("id", ParseIntPipe) id: number, @UserId() userId: number) {
    return this.ordersService.remove(id, userId);
  }
}
