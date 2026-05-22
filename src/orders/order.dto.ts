import { IsNotEmpty, IsString, IsNumber, IsArray, IsOptional, Min } from 'class-validator';

export class CreateOrderItemDto {
  @IsNotEmpty()
  productName: string;

  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  price: number;
}

export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  customerName: string;

  @IsNotEmpty()
  customerEmail: string;

  @IsOptional()
  shippingAddress?: string;

  @IsOptional()
  notes?: string;

  @IsArray()
  items: CreateOrderItemDto[];
}

export class UpdateOrderStatusDto {
  @IsNotEmpty()
  status: string;
}
