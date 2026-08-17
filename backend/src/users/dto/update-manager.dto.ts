import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateManagerDto {
  @ApiPropertyOptional({ example: 'your_username', description: 'Updated username' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ example: 'your_new_password', description: 'Updated password' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
