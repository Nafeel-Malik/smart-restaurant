import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MinLength,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'MatchNewPassword', async: false })
class MatchNewPasswordConstraint implements ValidatorConstraintInterface {
  validate(confirmNewPassword: string, args: ValidationArguments) {
    const object = args.object as ChangePasswordDto;
    return confirmNewPassword === object.newPassword;
  }

  defaultMessage() {
    return 'confirmNewPassword must match newPassword';
  }
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'SecurePass1', description: 'Current password' })
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty({ example: 'NewSecurePass1', description: 'New password (minimum 8 characters)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword!: string;

  @ApiProperty({ example: 'NewSecurePass1', description: 'Must match newPassword' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Validate(MatchNewPasswordConstraint)
  confirmNewPassword!: string;
}
