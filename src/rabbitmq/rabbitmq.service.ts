import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private readonly logger = new Logger(RabbitMQService.name);

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      this.logger.log('✅ RabbitMQ connected (Order Service)');
    } catch (error) {
      this.logger.error('❌ RabbitMQ connection failed:', error.message);
    }
  }

  async publishToQueue(queue: string, message: any): Promise<boolean> {
    try {
      if (!this.channel) await this.connect();
      await this.channel.assertQueue(queue, { durable: true });
      const content = Buffer.from(JSON.stringify(message));
      this.channel.sendToQueue(queue, content, { persistent: true });
      this.logger.log(`📤 Published to [${queue}]: ${message.event}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to publish to [${queue}]:`, error.message);
      return false;
    }
  }

  async publishToExchange(exchange: string, message: any): Promise<boolean> {
    try {
      if (!this.channel) await this.connect();
      await this.channel.assertExchange(exchange, 'fanout', { durable: true });
      const content = Buffer.from(JSON.stringify(message));
      this.channel.publish(exchange, '', content, { persistent: true });
      this.logger.log(`📢 Broadcasted to exchange [${exchange}]`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to broadcast:`, error.message);
      return false;
    }
  }

  private async disconnect() {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch (error) {
      this.logger.error('Error disconnecting:', error);
    }
  }
}
