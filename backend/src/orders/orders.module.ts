import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { Restaurant, RestaurantSchema } from '../restaurants/schemas/restaurant.schema';
import { MenuItem, MenuItemSchema } from '../menu-items/schemas/menu-item.schema';
import { Address, AddressSchema } from '../customer/schemas/address.schema';
import { Customer, CustomerSchema } from '../customer/schemas/customer.schema';
import { Reservation, ReservationSchema } from '../reservations/schemas/reservation.schema';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { CustomerOrdersController } from '../customer/customer-orders.controller';
import { CustomerPreOrderController } from '../customer/customer-pre-order.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Restaurant.name, schema: RestaurantSchema },
      { name: MenuItem.name, schema: MenuItemSchema },
      { name: Address.name, schema: AddressSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Reservation.name, schema: ReservationSchema },
    ]),
  ],
  controllers: [OrdersController, CustomerOrdersController, CustomerPreOrderController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
