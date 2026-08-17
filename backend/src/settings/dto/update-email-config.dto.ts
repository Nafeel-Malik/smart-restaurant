import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateEmailConfigDto {
  @ApiProperty({ example: 'your_email_here@gmail.com' })
  @IsEmail()
  @IsNotEmpty()
  emailUser!: string;

  @ApiPropertyOptional({
    example: 'your_16_char_app_password',
    description: '16-character Gmail App Password. Omit to keep the currently saved password.',
  })
  @Transform(({ value }) => {
    if (typeof value !== 'string') return undefined;
    const cleaned = value.trim().replaceAll(' ', '');
    return cleaned ? cleaned : undefined;
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  emailAppPassword?: string;

  @ApiPropertyOptional({ example: 'Smart Restaurant Management System' })
  @IsOptional()
  @IsString()
  fromName?: string;
}
