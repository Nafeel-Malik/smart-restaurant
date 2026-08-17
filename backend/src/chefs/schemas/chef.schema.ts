import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChefDocument = Chef & Document;

@Schema({ timestamps: true })
export class Chef {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  email!: string;

  @Prop({ required: true })
  timeIn!: string;

  @Prop({ required: true })
  timeOut!: string;

  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true })
  restaurant!: Types.ObjectId;
}

export const ChefSchema = SchemaFactory.createForClass(Chef);
