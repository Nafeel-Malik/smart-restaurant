import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewDocument = Review & Document;

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true, index: true })
  customerId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true, index: true })
  restaurantId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', default: null, index: true })
  orderId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Reservation', default: null, index: true })
  reservationId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'MenuItem', default: null })
  foodId?: Types.ObjectId | null;

  @Prop({ required: true, min: 1, max: 5 })
  rating!: number;

  @Prop({ type: String, default: '', trim: true, maxlength: 1000 })
  comment?: string;

  @Prop({ type: String, default: '', trim: true, maxlength: 1000 })
  restaurantReply?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
ReviewSchema.index({ restaurantId: 1, createdAt: -1 });
ReviewSchema.index({ customerId: 1, createdAt: -1 });
ReviewSchema.index({ orderId: 1 }, { unique: true, sparse: true });
ReviewSchema.index({ reservationId: 1 }, { unique: true, sparse: true });
