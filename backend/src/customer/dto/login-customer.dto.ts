import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class LoginCustomerDto {
  @ApiPropertyOptional({
    example: 'john.doe@example.com',
    description: 'Email address. You can also send a phone number in this field.',
  })
  @ValidateIf((o: LoginCustomerDto) => !o.phone)
  @IsString()
  @IsNotEmpty()
  email?: string;

  @ApiPropertyOptional({
    example: '+923001234567',
    description: 'Phone number. Required if email is not provided.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @ApiProperty({
    example: 'SecurePass1',
    description: 'Customer password',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
