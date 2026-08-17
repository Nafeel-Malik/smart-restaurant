import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class RegisterDto {
  @ApiProperty({
    example: 'your_username',
    description: 'Username for the new user',
  })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({
    example: 'your_password',
    description: 'Password (minimum 3 characters)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  password!: string;

  @ApiProperty({
    example: Role.SuperAdmin,
    enum: [Role.SuperAdmin, Role.BranchManager],
    description: 'Role of the user',
  })
  @IsEnum([Role.SuperAdmin, Role.BranchManager])
  role!: string;

  @ApiPropertyOptional({
    example: '60d5ecb8b5c9c22b1c8e4567',
    description: 'Optional assigned restaurant MongoDB ObjectId',
  })
  @IsOptional()
  @IsMongoId()
  assignedRestaurant?: string;
}
