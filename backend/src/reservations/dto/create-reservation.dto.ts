import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PHONE_REGEX, PHONE_REGEX_MESSAGE } from '../../common/utils/phone.util';

export class CreateReservationDto {
  @ApiProperty({ example: '60d5ecb8b5c9c22b1c8e1111' })
  @IsMongoId()
  restaurantId!: string;

  @ApiProperty({ example: '2026-08-20', description: 'Reservation calendar date (YYYY-MM-DD)' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'reservationDate must be YYYY-MM-DD' })
  reservationDate!: string;

  @ApiProperty({ example: '19:00', description: 'Time slot in 24-hour HH:mm format' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'timeSlot must be HH:mm' })
  timeSlot!: string;

  @ApiProperty({ example: 4 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  partySize!: number;

  @ApiPropertyOptional({ example: 'Window seat, birthday' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  specialRequests?: string;

  @ApiProperty({
    example: '+923001234567',
    description: 'Contact phone for the reservation (required)',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(PHONE_REGEX, { message: PHONE_REGEX_MESSAGE })
  contactPhone!: string;
}
