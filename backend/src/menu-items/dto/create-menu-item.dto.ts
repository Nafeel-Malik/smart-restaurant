import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMenuItemDto {
  @ApiProperty({
    example: 'Burger',
    description: 'Name of the menu item',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 9.99,
    description: 'Price of the menu item',
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  price!: number;

  @ApiPropertyOptional({
    example: 'https://example.com/burger.jpg',
    description: 'Image URL for the menu item',
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({
    example: '60d5ecb8b5c9c22b1c8e4567',
    description: 'Category ID',
  })
  @IsMongoId()
  @IsNotEmpty()
  categoryId!: string;
}
