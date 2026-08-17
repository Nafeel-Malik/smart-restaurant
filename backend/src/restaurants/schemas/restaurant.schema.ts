import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RestaurantDocument = Restaurant & Document;

@Schema({ timestamps: true })
export class Restaurant {
  @Prop({ required: true })
  name!: string;

  @Prop({ default: null })
  logo?: string;

  @Prop({ required: true })
  openingTime!: string;

  @Prop({ required: true })
  closingTime!: string;

  @Prop({ default: 'PKR' })
  currency!: string;

  @Prop({ default: 1, enum: [0, 1] })
  status!: number;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  assignedManager!: Types.ObjectId | null;

  @Prop({ default: 0, min: 0, max: 5 })
  averageRating!: number;

  @Prop({ default: 0, min: 0 })
  reviewCount!: number;
}

export const RestaurantSchema = SchemaFactory.createForClass(Restaurant);
