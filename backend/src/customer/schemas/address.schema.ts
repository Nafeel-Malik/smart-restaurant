import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AddressDocument = Address & Document;

@Schema({ timestamps: true })
export class Address {
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true, index: true })
  customerId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  label!: string;

  @Prop({ required: true, trim: true })
  fullAddress!: string;

  @Prop({ required: true, trim: true })
  city!: string;

  @Prop({ type: String, default: null, trim: true })
  area?: string | null;

  @Prop({ type: Number, default: null })
  latitude?: number | null;

  @Prop({ type: Number, default: null })
  longitude?: number | null;

  @Prop({ required: true, trim: true })
  phone!: string;

  @Prop({ default: false })
  isDefault!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AddressSchema = SchemaFactory.createForClass(Address);
AddressSchema.index({ customerId: 1, isDefault: 1 });
