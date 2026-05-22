import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './order.entity';
import { CreateOrderDto, UpdateOrderStatusDto } from './order.dto';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  // Yangi order yaratish
  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    // Umumiy summani hisoblash
    const totalAmount = createOrderDto.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const order = this.ordersRepository.create({
      ...createOrderDto,
      totalAmount,
      status: OrderStatus.PENDING,
    });

    const savedOrder = await this.ordersRepository.save(order);

    // User service ga xabar yuborish - orderCount oshirish uchun
    await this.rabbitMQService.publishToQueue('user_queue', {
      event: 'ORDER_CREATED',
      data: {
        orderId: savedOrder.id,
        userId: savedOrder.userId,
        totalAmount: savedOrder.totalAmount,
      },
    });

    // Notification service ga xabar yuborish
    await this.rabbitMQService.publishToQueue('notification_queue', {
      event: 'ORDER_PLACED',
      data: {
        orderId: savedOrder.id,
        customerEmail: savedOrder.customerEmail,
        customerName: savedOrder.customerName,
        totalAmount: savedOrder.totalAmount,
        status: savedOrder.status,
      },
    });

    console.log(`📤 Sent ORDER_CREATED & ORDER_PLACED events`);
    return savedOrder;
  }

  // Barcha orderlar
  async findAll(): Promise<Order[]> {
    return this.ordersRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  // ID bo'yicha topish
  async findOne(id: number): Promise<Order> {
    const order = await this.ordersRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order #${id} topilmadi`);
    }
    return order;
  }

  // User orderlarini olish
  async findByUser(userId: string): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  // Status yangilash
  async updateStatus(id: number, dto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findOne(id);
    const oldStatus = order.status;
    order.status = dto.status as OrderStatus;
    const updated = await this.ordersRepository.save(order);

    // Notification service ga status o'zgarishi haqida xabar
    await this.rabbitMQService.publishToQueue('notification_queue', {
      event: 'ORDER_STATUS_CHANGED',
      data: {
        orderId: id,
        oldStatus,
        newStatus: dto.status,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
      },
    });

    return updated;
  }

  // Statistika
  async getStats(): Promise<any> {
    const total = await this.ordersRepository.count();
    const pending = await this.ordersRepository.count({ where: { status: OrderStatus.PENDING } });
    const delivered = await this.ordersRepository.count({ where: { status: OrderStatus.DELIVERED } });
    const result = await this.ordersRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'revenue')
      .getRawOne();

    return {
      total,
      pending,
      delivered,
      cancelled: await this.ordersRepository.count({ where: { status: OrderStatus.CANCELLED } }),
      totalRevenue: parseFloat(result?.revenue || '0').toFixed(2),
    };
  }

  // RabbitMQ'dan kelgan user ma'lumotlari
  async handleNewUserRegistered(data: any): Promise<void> {
    console.log(`📥 [ORDER_SERVICE] NEW_USER_REGISTERED:`, data);
    // Yangi user uchun welcome order yoki discount hisoblash mumkin
  }
}
