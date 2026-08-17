import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from "@nestjs/mongoose";
import { join } from 'path';
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { RestaurantsModule } from "./restaurants/restaurants.module";
import { ChefsModule } from "./chefs/chefs.module";
import { WaitersModule } from "./waiters/waiters.module";
import { TablesModule } from "./tables/tables.module";
import { CategoriesModule } from "./categories/categories.module";
import { MenuItemsModule } from "./menu-items/menu-items.module";
import { CustomerModule } from "./customer/customer.module";
import { OrdersModule } from "./orders/orders.module";
import { SettingsModule } from "./settings/settings.module";
import { ReservationsModule } from "./reservations/reservations.module";
import { ReviewsModule } from "./reviews/reviews.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), '.env'),
        join(__dirname, '..', '.env'),
      ],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
    }),
    UsersModule,
    AuthModule,
    RestaurantsModule,
    ChefsModule,
    WaitersModule,
    TablesModule,
    CategoriesModule,
    MenuItemsModule,
    CustomerModule,
    OrdersModule,
    SettingsModule,
    ReservationsModule,
    ReviewsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}