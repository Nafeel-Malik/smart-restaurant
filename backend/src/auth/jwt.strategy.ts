import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '../common/enums/role.enum';
import { CustomerService } from '../customer/customer.service';
import { UsersService } from '../users/users.service';

export interface JwtPayload {
  sub: string;
  username?: string;
  email?: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private customerService: CustomerService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'secret',
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.role === Role.Customer) {
      const customer = await this.customerService.findById(payload.sub);
      if (!customer || !customer.isActive) {
        throw new UnauthorizedException('Customer not found or token invalid');
      }
      return {
        userId: payload.sub,
        username: customer.email,
        email: customer.email,
        role: Role.Customer,
      };
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found or token invalid');
    }
    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
      assignedRestaurant: user.assignedRestaurant,
    };
  }
}
