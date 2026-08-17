import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsMongoId, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) => {
  if (value === '' || value === null || value === undefined) return undefined;
  return value;
};

export class CreateReviewDto {
  @ApiProperty({ example: '60d5ecb8b5c9c22b1c8e1111' })
  @IsMongoId()
  restaurantId!: string;

  @ApiPropertyOptional({ example: '60d5ecb8b5c9c22b1c8e2222' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsMongoId()
  orderId?: string;

  @ApiPropertyOptional({ example: '60d5ecb8b5c9c22b1c8e3333' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsMongoId()
  reservationId?: string;

  @ApiPropertyOptional({ example: '60d5ecb8b5c9c22b1c8e4444' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsMongoId()
  foodId?: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional({ example: 'Great food and friendly service.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
