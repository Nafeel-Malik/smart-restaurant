import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PHONE_REGEX, PHONE_REGEX_MESSAGE } from '../../common/utils/phone.util';

@ValidatorConstraint({ name: 'MatchPassword', async: false })
class MatchPasswordConstraint implements ValidatorConstraintInterface {
  validate(confirmPassword: string, args: ValidationArguments) {
    const object = args.object as RegisterCustomerDto;
    return confirmPassword === object.password;
  }

  defaultMessage() {
    return 'confirmPassword must match password';
  }
}

export class RegisterCustomerDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the customer',
  })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Unique email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: '+923001234567',
    description: 'Unique phone number',
  })
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(PHONE_REGEX, { message: PHONE_REGEX_MESSAGE })
  phone!: string;

  @ApiProperty({
    example: 'SecurePass1',
    description: 'Password (minimum 8 characters)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    example: 'SecurePass1',
    description: 'Must match password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Validate(MatchPasswordConstraint)
  confirmPassword!: string;
}
