import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import {
  CreateOrderDto,
  PayOrderDto,
  PaymentCallbackDto,
  ShipOrderDto,
} from "./orders.dto";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  list() {
    return this.ordersService.list();
  }

  @Post()
  create(@Body() input: CreateOrderDto) {
    return this.ordersService.create(input);
  }

  @Get(":id")
  getById(@Param("id") id: string) {
    return this.ordersService.getById(id);
  }

  @Post(":id/pay")
  pay(@Param("id") id: string, @Body() input: PayOrderDto) {
    return this.ordersService.pay(id, input);
  }

  @Post("payments/mock/callback")
  paymentCallback(@Body() input: PaymentCallbackDto) {
    return this.ordersService.paymentCallback(input);
  }

  @Post(":id/ship")
  ship(@Param("id") id: string, @Body() input: ShipOrderDto) {
    return this.ordersService.ship(id, input);
  }

  @Post(":id/complete")
  complete(@Param("id") id: string) {
    return this.ordersService.complete(id);
  }

  @Post(":id/cancel")
  cancel(@Param("id") id: string) {
    return this.ordersService.cancel(id);
  }
}
