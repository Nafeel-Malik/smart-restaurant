import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomerController } from './customer.controller';
import { CustomerProfileController } from './customer-profile.controller';
import { AddressController } from './address.controller';
import { FavoritesController } from './favorites.controller';
import { CustomerRestaurantsController } from './customer-restaurants.controller';
import { CustomerActivityController } from './customer-activity.controller';
import { CustomerService } from './customer.service';
import { AddressService } from './address.service';
import { FavoritesService } from './favorites.service';
import { CustomerRestaurantsService } from './customer-restaurants.service';
import { MailModule } from '../mail/mail.module';
import { ReservationsModule } from '../reservations/reservations.module';
import { Customer, CustomerSchema } from './schemas/customer.schema';
import { Otp, OtpSchema } from './schemas/otp.schema';
import { Address, AddressSchema } from './schemas/address.schema';
import { FavoriteRestaurant, FavoriteRestaurantSchema } from './schemas/favorite-restaurant.schema';
import { FavoriteFood, FavoriteFoodSchema } from './schemas/favorite-food.schema';
import { Restaurant, RestaurantSchema } from '../restaurants/schemas/restaurant.schema';
import { MenuItem, MenuItemSchema } from '../menu-items/schemas/menu-item.schema';
import { Category, CategorySchema } from '../categories/schemas/category.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { Reservation, ReservationSchema } from '../reservations/schemas/reservation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: Address.name, schema: AddressSchema },
      { name: FavoriteRestaurant.name, schema: FavoriteRestaurantSchema },
      { name: FavoriteFood.name, schema: FavoriteFoodSchema },
      { name: Restaurant.name, schema: RestaurantSchema },
      { name: MenuItem.name, schema: MenuItemSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Order.name, schema: OrderSchema },
      { name: Reservation.name, schema: ReservationSchema },
    ]),
    MailModule,
    ReservationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'secret',
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [
    CustomerController,
    CustomerProfileController,
    AddressController,
    FavoritesController,
    CustomerRestaurantsController,
    CustomerActivityController,
  ],
  providers: [CustomerService, AddressService, FavoritesService, CustomerRestaurantsService],
  exports: [CustomerService],
})
export class CustomerModule {}
