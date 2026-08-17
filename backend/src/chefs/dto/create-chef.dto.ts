import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateChefDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Name of the chef',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email of the chef',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: '09:00 AM',
    description: 'Shift start time',
  })
  @IsString()
  @IsNotEmpty()
  timeIn!: string;

  @ApiProperty({
    example: '05:00 PM',
    description: 'Shift end time',
  })
  @IsString()
  @IsNotEmpty()
  timeOut!: string;
}
