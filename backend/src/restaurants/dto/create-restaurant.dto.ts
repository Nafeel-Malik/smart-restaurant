import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateRestaurantDto {
  @ApiProperty({
    example: 'Your Restaurant Name',
    description: 'Name of the restaurant branch',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    example: 'https://example.com/logo.png',
    description: 'Logo image URL or file path',
  })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiProperty({
    example: '09:00 AM',
    description: 'Opening time',
  })
  @IsString()
  @IsNotEmpty()
  openingTime!: string;

  @ApiProperty({
    example: '11:00 PM',
    description: 'Closing time',
  })
  @IsString()
  @IsNotEmpty()
  closingTime!: string;

  @ApiProperty({
    example: 'PKR',
    description: 'Currency used by the restaurant (e.g. PKR, USD)',
  })
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @ApiProperty({
    example: 1,
    enum: [0, 1],
    description: 'Status of the restaurant (1 = Active, 0 = Inactive)',
  })
  @Type(() => Number)
  @IsNumber()
  @IsIn([0, 1])
  status!: number;
}
