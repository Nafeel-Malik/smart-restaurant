import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, ValidateIf } from 'class-validator';

export class AssignWaiterDto {
  @ApiPropertyOptional({
    example: '60d5ecb8b5c9c22b1c8e4567',
    description: 'MongoDB ObjectId of the assigned waiter (nullable to unassign)',
  })
  @IsOptional()
  @ValidateIf((o) => o.waiterId != null && o.waiterId !== '')
  @IsMongoId()
  waiterId?: string | null;
}
