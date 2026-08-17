import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsMongoId, Min, ValidateNested } from 'class-validator';

export class CreateOrderItemDto {
  @ApiProperty({ example: '60d5ecb8b5c9c22b1c8e4567' })
  @IsMongoId()
  foodId!: string;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateCustomerOrderDto {
  @ApiProperty({ example: '60d5ecb8b5c9c22b1c8e1111' })
  @IsMongoId()
  restaurantId!: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @ApiProperty({ example: '60d5ecb8b5c9c22b1c8e2222' })
  @IsMongoId()
  deliveryAddressId!: string;
}
