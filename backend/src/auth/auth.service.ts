import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByUsername(registerDto.username);
    if (existingUser) {
      throw new ConflictException('Username is already taken');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.usersService.create({
      username: registerDto.username,
      password: hashedPassword,
      role: registerDto.role,
      assignedRestaurant:
        registerDto.assignedRestaurant && Types.ObjectId.isValid(registerDto.assignedRestaurant)
          ? new Types.ObjectId(registerDto.assignedRestaurant)
          : null,
    });

    return {
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        assignedRestaurant: user.assignedRestaurant,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByUsername(loginDto.username);
    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const payload = {
      sub: user._id.toString(),
      username: user.username,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    await user.populate('assignedRestaurant');

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      user: this.toPublicUser(user),
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found or token invalid');
    }
    await user.populate('assignedRestaurant');
    return this.toPublicUser(user);
  }

  async logout() {
    return {
      message: 'Logged out successfully',
    };
  }

  private toPublicUser(user: { _id: unknown; username: string; role: string; assignedRestaurant: unknown }) {
    return {
      id: user._id,
      username: user.username,
      role: user.role,
      assignedRestaurant: user.assignedRestaurant,
    };
  }
}
