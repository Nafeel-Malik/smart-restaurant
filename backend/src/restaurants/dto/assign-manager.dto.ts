import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class AssignManagerDto {
  @ApiProperty({
    example: '60d5ecb8b5c9c22b1c8e4567',
    description: 'MongoDB ObjectId of the branch_manager user to assign',
  })
  @IsMongoId()
  @IsNotEmpty()
  managerId!: string;
}
