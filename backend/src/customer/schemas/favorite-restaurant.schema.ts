import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FavoriteRestaurantDocument = FavoriteRestaurant & Document;

@Schema({ timestamps: true })
export class FavoriteRestaurant {
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true, index: true })
  customerId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true, index: true })
  restaurantId!: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const FavoriteRestaurantSchema = SchemaFactory.createForClass(FavoriteRestaurant);
FavoriteRestaurantSchema.index({ customerId: 1, restaurantId: 1 }, { unique: true });
