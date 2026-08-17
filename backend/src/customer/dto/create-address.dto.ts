import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { PHONE_REGEX, PHONE_REGEX_MESSAGE } from '../../common/utils/phone.util';

export class CreateAddressDto {
  @ApiProperty({ example: 'Home', description: 'Address label, e.g. Home, Work, Other' })
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiProperty({ example: 'House 12, Street 4, F-11', description: 'Full street address' })
  @IsString()
  @IsNotEmpty()
  fullAddress!: string;

  @ApiProperty({ example: 'Islamabad' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiPropertyOptional({ example: 'F-11', description: 'Area or neighborhood' })
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional({ example: 33.6844 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: 73.0479 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiProperty({
    example: '+923001234567',
    description: 'Contact phone for this delivery address (required)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(PHONE_REGEX, { message: PHONE_REGEX_MESSAGE })
  phone!: string;

  @ApiPropertyOptional({ example: true, description: 'If true, this becomes the only default address' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
