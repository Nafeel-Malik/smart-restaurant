import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { Role } from '../common/enums/role.enum';
import { Customer, CustomerDocument } from './schemas/customer.schema';
import { Otp, OtpDocument } from './schemas/otp.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { Reservation, ReservationDocument } from '../reservations/schemas/reservation.schema';
import { OrderStatus } from '../common/enums/order-status.enum';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { LoginCustomerDto } from './dto/login-customer.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CUSTOMER_UPLOAD_DIR } from './upload.config';
import { MailService } from '../mail/mail.service';

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);

  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async findById(id: string): Promise<CustomerDocument | null> {
    return this.customerModel.findById(id).exec();
  }

  async register(dto: RegisterCustomerDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone.trim();

    const existingEmail = await this.customerModel.findOne({ email }).exec();
    if (existingEmail) {
      throw new ConflictException('Email is already registered');
    }

    const existingPhone = await this.customerModel.findOne({ phone }).exec();
    if (existingPhone) {
      throw new ConflictException('Phone number is already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    let created: CustomerDocument;
    try {
      created = await this.customerModel.create({
        fullName: dto.fullName.trim(),
        email,
        phone,
        password: hashedPassword,
        role: Role.Customer,
        isActive: true,
        isEmailVerified: false,
      });
    } catch (error: any) {
      this.logger.error(`Customer create failed for ${email}: ${error?.message || error}`);
      if (error?.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0] || 'field';
        throw new ConflictException(`${field} is already registered`);
      }
      throw new BadRequestException(error?.message || 'Failed to create customer account');
    }

    this.logger.log(`Customer created ${created._id.toString()} (${created.email})`);

    try {
      await this.issueAndSendOtp(created);
    } catch (error: any) {
      this.logger.error(`OTP email failed for ${created.email}: ${error?.message || error}`);
      throw new HttpException(
        {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message:
            'Account created but verification email failed to send — please use Resend OTP',
          code: 'ACCOUNT_CREATED_EMAIL_FAILED',
          email: created.email,
          id: created._id,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return {
      message: 'Registration successful, OTP sent to email',
      id: created._id,
      email: created.email,
    };
  }

  async login(dto: LoginCustomerDto) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Email or phone is required');
    }

    const customer = await this.findByEmailOrPhone(dto.email, dto.phone);
    if (!customer) {
      throw new UnauthorizedException('Invalid email/phone or password');
    }

    if (!customer.isActive) {
      throw new UnauthorizedException('Customer account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, customer.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email/phone or password');
    }

    if (!customer.isEmailVerified) {
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Please verify your email first',
          code: 'EMAIL_NOT_VERIFIED',
          email: customer.email,
        },
        HttpStatus.FORBIDDEN,
      );
    }

    const publicCustomer = await this.customerModel.findById(customer._id).exec();
    if (!publicCustomer) {
      throw new UnauthorizedException('Invalid email/phone or password');
    }

    return this.toAuthResponse(publicCustomer);
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const email = dto.email.trim().toLowerCase();
    const customer = await this.customerModel.findOne({ email }).exec();
    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    if (customer.isEmailVerified) {
      return this.toAuthResponse(customer);
    }

    const otpRecord = await this.otpModel
      .findOne({
        customerId: customer._id,
        expiresAt: { $gt: new Date() },
      })
      .sort({ createdAt: -1 })
      .exec();

    if (!otpRecord) {
      throw new BadRequestException('OTP expired or not found. Please request a new one.');
    }

    const matches = await bcrypt.compare(dto.otp.trim(), otpRecord.otp);
    if (!matches) {
      throw new BadRequestException('Invalid OTP. Please check the code and try again.');
    }

    customer.isEmailVerified = true;
    await customer.save();
    await this.otpModel.deleteMany({ customerId: customer._id }).exec();

    return this.toAuthResponse(customer);
  }

  async resendOtp(dto: ResendOtpDto) {
    const email = dto.email.trim().toLowerCase();
    const customer = await this.customerModel.findOne({ email }).exec();
    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    if (customer.isEmailVerified) {
      throw new BadRequestException('Email is already verified. Please log in.');
    }

    const latest = await this.otpModel
      .findOne({ customerId: customer._id })
      .sort({ createdAt: -1 })
      .exec();

    if (latest?.createdAt) {
      const elapsed = Date.now() - new Date(latest.createdAt).getTime();
      if (elapsed < OTP_RESEND_COOLDOWN_MS) {
        const retryAfterSeconds = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: `Please wait ${retryAfterSeconds} seconds before requesting another OTP`,
            retryAfterSeconds,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    await this.issueAndSendOtp(customer);
    return { message: 'A new OTP has been sent to your email', email: customer.email };
  }

  async getProfile(customerId: string) {
    const customer = await this.findById(customerId);
    if (!customer) {
      throw new UnauthorizedException('Customer not found or token invalid');
    }
    return this.toPublicCustomer(customer);
  }

  async updateProfile(customerId: string, dto: UpdateProfileDto) {
    const customer = await this.findById(customerId);
    if (!customer) {
      throw new UnauthorizedException('Customer not found or token invalid');
    }

    if (dto.fullName !== undefined) {
      customer.fullName = dto.fullName.trim();
    }

    if (dto.phone !== undefined) {
      const phone = dto.phone.trim();
      if (!phone) {
        throw new BadRequestException('Phone number is required');
      }
      const existingPhone = await this.customerModel
        .findOne({ phone, _id: { $ne: customer._id } })
        .exec();
      if (existingPhone) {
        throw new ConflictException('Phone number is already registered');
      }
      customer.phone = phone;
    }

    if (dto.dateOfBirth !== undefined) {
      customer.dateOfBirth = dto.dateOfBirth || null;
    }

    if (dto.gender !== undefined) {
      customer.gender = dto.gender || null;
    }

    try {
      await customer.save();
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException('Phone number is already registered');
      }
      throw error;
    }

    return this.toPublicCustomer(customer);
  }

  async changePassword(customerId: string, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmNewPassword) {
      throw new BadRequestException('New passwords do not match');
    }

    const customer = await this.customerModel
      .findById(customerId)
      .select('+password')
      .exec();
    if (!customer) {
      throw new UnauthorizedException('Customer not found or token invalid');
    }

    const matches = await bcrypt.compare(dto.currentPassword, customer.password);
    if (!matches) {
      throw new BadRequestException('Current password is incorrect');
    }

    customer.password = await bcrypt.hash(dto.newPassword, 10);
    await customer.save();

    return { message: 'Password updated successfully' };
  }

  async updateProfilePicture(customerId: string, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Profile picture is required');
    }

    const customer = await this.findById(customerId);
    if (!customer) {
      throw new UnauthorizedException('Customer not found or token invalid');
    }

    this.deleteLocalPicture(customer.profilePicture);

    customer.profilePicture = `/uploads/customers/${file.filename}`;
    await customer.save();
    return this.toPublicCustomer(customer);
  }

  private async findByEmailOrPhone(
    email?: string,
    phone?: string,
  ): Promise<(CustomerDocument & { password: string }) | null> {
    if (email) {
      const byEmail = await this.customerModel
        .findOne({ email: email.trim().toLowerCase() })
        .select('+password')
        .exec();
      if (byEmail) {
        return byEmail as CustomerDocument & { password: string };
      }

      const byPhoneFromEmailField = await this.customerModel
        .findOne({ phone: email.trim() })
        .select('+password')
        .exec();
      if (byPhoneFromEmailField) {
        return byPhoneFromEmailField as CustomerDocument & { password: string };
      }
    }

    if (phone) {
      const byPhone = await this.customerModel
        .findOne({ phone: phone.trim() })
        .select('+password')
        .exec();
      if (byPhone) {
        return byPhone as CustomerDocument & { password: string };
      }
    }

    return null;
  }

  private async issueAndSendOtp(customer: CustomerDocument) {
    await this.otpModel.deleteMany({ customerId: customer._id }).exec();

    const otp = randomInt(100000, 1000000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await this.otpModel.create({
      customerId: customer._id,
      otp: hashedOtp,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });

    try {
      await this.mailService.sendOtpEmail(customer.email, otp, customer.fullName);
    } catch (error) {
      await this.otpModel.deleteMany({ customerId: customer._id }).exec();
      throw error;
    }
  }

  private toAuthResponse(customer: CustomerDocument) {
    const payload = {
      sub: customer._id.toString(),
      username: customer.email,
      email: customer.email,
      role: Role.Customer,
    };

    return {
      access_token: this.jwtService.sign(payload),
      token_type: 'Bearer',
      customer: this.toPublicCustomer(customer),
    };
  }

  private deleteLocalPicture(profilePicture?: string | null) {
    if (!profilePicture || !profilePicture.startsWith('/uploads/customers/')) {
      return;
    }
    const filename = profilePicture.replace('/uploads/customers/', '');
    const fullPath = join(CUSTOMER_UPLOAD_DIR, filename);
    if (existsSync(fullPath)) {
      try {
        unlinkSync(fullPath);
      } catch {
        // ignore cleanup failures
      }
    }
  }

  private toPublicCustomer(customer: CustomerDocument) {
    return {
      id: customer._id,
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone,
      role: customer.role,
      isActive: customer.isActive,
      isEmailVerified: customer.isEmailVerified,
      profilePicture: customer.profilePicture || null,
      dateOfBirth: customer.dateOfBirth || null,
      gender: customer.gender || null,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }

  async getActivitySummary(customerId: string) {
    const customer = await this.customerModel.findById(customerId).select('createdAt').exec();
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const customerObjectId = new Types.ObjectId(customerId);
    const [totalOrders, totalReservations, spent] = await Promise.all([
      this.orderModel.countDocuments({ customerId: customerObjectId }).exec(),
      this.reservationModel.countDocuments({ customerId: customerObjectId }).exec(),
      this.orderModel
        .aggregate([
          {
            $match: {
              customerId: customerObjectId,
              status: { $ne: OrderStatus.Cancelled },
            },
          },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ])
        .exec(),
    ]);

    return {
      totalOrders,
      totalReservations,
      totalSpent: Number((spent[0]?.total || 0).toFixed(2)),
      memberSince: customer.createdAt || null,
    };
  }
}
