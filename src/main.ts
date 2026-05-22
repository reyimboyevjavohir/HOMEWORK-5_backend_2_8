import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // RabbitMQ Microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672'],
      queue: process.env.RABBITMQ_QUEUE || 'order_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.enableCors();

  await app.startAllMicroservices();
  await app.listen(process.env.PORT || 3002);

  console.log(`🚀 ORDER SERVICE (PostgreSQL) running on: http://localhost:${process.env.PORT || 3002}`);
  console.log(`📨 RabbitMQ queue: ${process.env.RABBITMQ_QUEUE || 'order_queue'} listening...`);
}
bootstrap();
