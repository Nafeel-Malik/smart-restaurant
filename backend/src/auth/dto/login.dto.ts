import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'your_username',
    description: 'Username of the user',
  })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({
    example: 'your_password',
    description: 'Password of the user',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
