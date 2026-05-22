import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersModule } from './orders/orders.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { Order } from './orders/order.entity';
import { OrderItem } from './orders/order-item.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // TypeORM + PostgreSQL ulanish
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'postgres'),
        database: config.get('DB_NAME', 'order_service_db'),
        entities: [Order, OrderItem],
        synchronize: true, // Production da false qiling!
        logging: ['error'],
        retryAttempts: 5,
        retryDelay: 3000,
      }),
    }),

    OrdersModule,
    RabbitMQModule,
  ],
})
export class AppModule {}
