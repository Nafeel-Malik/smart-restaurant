import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateTableDto {
  @ApiProperty({
    example: 'A1',
    description: 'Table number or identifier',
  })
  @IsString()
  @IsNotEmpty()
  number!: string;

  @ApiPropertyOptional({
    example: 4,
    description: 'Seat capacity used for customer table reservations. Defaults to 4.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;
}
