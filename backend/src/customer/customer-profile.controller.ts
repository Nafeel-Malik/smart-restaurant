import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { MulterExceptionFilter } from '../common/filters/multer-exception.filter';
import { CustomerService } from './customer.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { customerPictureMulterOptions } from './upload.config';

@ApiTags('Customer Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Customer)
@Controller('customer/profile')
export class CustomerProfileController {
  constructor(private readonly customerService: CustomerService) {}

  @ApiOperation({ summary: 'Get the logged-in customer profile' })
  @ApiResponse({ status: 200, description: 'Full customer profile without password' })
  @Get()
  async getProfile(@Req() req: any) {
    return this.customerService.getProfile(req.user.userId);
  }

  @ApiOperation({ summary: 'Update the logged-in customer profile' })
  @ApiResponse({ status: 200, description: 'Updated customer profile' })
  @ApiResponse({ status: 409, description: 'Phone number is already registered' })
  @Patch()
  async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.customerService.updateProfile(req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Change the logged-in customer password' })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  @ApiResponse({ status: 400, description: 'Current password is incorrect or passwords do not match' })
  @HttpCode(HttpStatus.OK)
  @Patch('change-password')
  async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.customerService.changePassword(req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Upload a profile picture for the logged-in customer' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        picture: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Updated customer profile with picture URL' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(FileInterceptor('picture', customerPictureMulterOptions))
  @Post('picture')
  async uploadPicture(@Req() req: any, @UploadedFile() file?: Express.Multer.File) {
    return this.customerService.updateProfilePicture(req.user.userId, file);
  }
}
