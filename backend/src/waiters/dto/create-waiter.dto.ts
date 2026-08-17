import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateWaiterDto {
  @ApiProperty({
    example: 'Jane Smith',
    description: 'Name of the waiter',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 'jane.smith@example.com',
    description: 'Email of the waiter',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: '10:00 AM',
    description: 'Shift start time',
  })
  @IsString()
  @IsNotEmpty()
  timeIn!: string;

  @ApiProperty({
    example: '06:00 PM',
    description: 'Shift end time',
  })
  @IsString()
  @IsNotEmpty()
  timeOut!: string;
}
