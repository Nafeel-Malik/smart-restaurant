import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Fast Food',
    description: 'Name of the category',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
