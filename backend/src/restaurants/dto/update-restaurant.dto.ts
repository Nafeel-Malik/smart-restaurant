import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { CreateRestaurantDto } from './create-restaurant.dto';

export class UpdateRestaurantDto extends PartialType(CreateRestaurantDto) {
  @ApiPropertyOptional({
    example: 0,
    enum: [0, 1],
    description: 'Toggle status of the restaurant (1 = Active, 0 = Inactive)',
  })
  @IsOptional()
  @IsIn([0, 1])
  status?: number;
}
