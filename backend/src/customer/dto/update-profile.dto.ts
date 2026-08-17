import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MinLength, ValidateIf } from 'class-validator';
import { Gender } from '../../common/enums/gender.enum';
import { PHONE_REGEX, PHONE_REGEX_MESSAGE } from '../../common/utils/phone.util';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John Doe', description: 'Updated full name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @ApiPropertyOptional({ example: '+923001234567', description: 'Updated phone number' })
  @ValidateIf((o: UpdateProfileDto) => o.phone !== undefined)
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(PHONE_REGEX, { message: PHONE_REGEX_MESSAGE })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: '1995-06-15', description: 'Date of birth (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    example: Gender.Male,
    enum: Gender,
    description: 'Gender',
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;
}
