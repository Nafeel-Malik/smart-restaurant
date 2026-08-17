import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FavoriteFoodDocument = FavoriteFood & Document;

@Schema({ timestamps: true })
export class FavoriteFood {
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true, index: true })
  customerId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'MenuItem', required: true, index: true })
  foodId!: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const FavoriteFoodSchema = SchemaFactory.createForClass(FavoriteFood);
FavoriteFoodSchema.index({ customerId: 1, foodId: 1 }, { unique: true });
