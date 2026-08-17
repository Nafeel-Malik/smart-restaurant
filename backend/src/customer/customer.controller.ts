import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CustomerService } from './customer.service';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { LoginCustomerDto } from './dto/login-customer.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';

@ApiTags('Customer Auth')
@Controller('customer/auth')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @ApiOperation({ summary: 'Register a new customer and send email OTP. No JWT is issued until verification.' })
  @ApiResponse({ status: 201, description: 'Registration successful, OTP sent to email' })
  @ApiResponse({ status: 400, description: 'Validation error or passwords do not match' })
  @ApiResponse({ status: 409, description: 'Email or phone is already registered' })
  @Post('register')
  async register(@Body() dto: RegisterCustomerDto) {
    return this.customerService.register(dto);
  }

  @ApiOperation({ summary: 'Verify email OTP and issue JWT access token' })
  @ApiResponse({ status: 200, description: 'Email verified and access token returned' })
  @ApiResponse({ status: 400, description: 'Invalid, expired, or missing OTP' })
  @HttpCode(HttpStatus.OK)
  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.customerService.verifyOtp(dto);
  }

  @ApiOperation({ summary: 'Resend email OTP. Rate limited to once per 60 seconds.' })
  @ApiResponse({ status: 200, description: 'A new OTP has been sent' })
  @ApiResponse({ status: 400, description: 'Customer not found, already verified, or resend cooldown active' })
  @HttpCode(HttpStatus.OK)
  @Post('resend-otp')
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.customerService.resendOtp(dto);
  }

  @ApiOperation({ summary: 'Login customer with email or phone and return JWT access token' })
  @ApiResponse({ status: 200, description: 'Successful login with access token returned' })
  @ApiResponse({ status: 400, description: 'Email or phone is required' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or inactive account' })
  @ApiResponse({ status: 403, description: 'Email is not verified' })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginCustomerDto) {
    return this.customerService.login(dto);
  }

  @ApiOperation({ summary: 'Get the logged-in customer profile' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Customer)
  @ApiResponse({ status: 200, description: 'Current authenticated customer details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (Requires customer role)' })
  @Get('me')
  async me(@Req() req: any) {
    return this.customerService.getProfile(req.user.userId);
  }
}
