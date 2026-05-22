import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ===== HTTP REST Endpoints =====

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get('stats')
  getStats() {
    return this.ordersService.getStats();
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.ordersService.findByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }

  // ===== RabbitMQ Message Handlers =====

  @MessagePattern('NEW_USER_REGISTERED')
  async handleNewUser(@Payload() data: any) {
    console.log(`📨 [ORDER_SERVICE] NEW_USER_REGISTERED:`, data);
    await this.ordersService.handleNewUserRegistered(data);
    return { success: true };
  }

  @MessagePattern('GET_USER_ORDERS')
  async getUserOrders(@Payload() data: { userId: string }) {
    return this.ordersService.findByUser(data.userId);
  }
}
