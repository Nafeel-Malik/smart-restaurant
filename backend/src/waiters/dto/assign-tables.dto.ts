import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId } from 'class-validator';

export class AssignTablesDto {
  @ApiProperty({
    example: ['60d5ecb8b5c9c22b1c8e4567', '60d5ecb8b5c9c22b1c8e4568'],
    description: 'Array of MongoDB ObjectIds of tables to assign to this waiter',
    type: [String],
  })
  @IsArray()
  @IsMongoId({ each: true })
  tableIds!: string[];
}
