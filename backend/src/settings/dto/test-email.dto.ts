import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class TestEmailDto {
  @ApiProperty({ example: 'you@example.com' })
  @IsEmail()
  @IsNotEmpty()
  to!: string;
}
