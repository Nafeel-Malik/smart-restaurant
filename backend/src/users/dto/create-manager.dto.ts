import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateManagerDto {
  @ApiProperty({
    example: 'your_manager_username',
    description: 'Username for the new branch manager',
  })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({
    example: 'your_password',
    description: 'Password for the new branch manager (min 3 characters)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  password!: string;

  @ApiPropertyOptional({
    example: '60d5ecb8b5c9c22b1c8e4567',
    description: 'Optional restaurant to assign immediately',
  })
  @IsOptional()
  @IsMongoId()
  restaurantId?: string;
}
