import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WaiterDocument = Waiter & Document;

@Schema({ timestamps: true })
export class Waiter {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  email!: string;

  @Prop({ required: true })
  timeIn!: string;

  @Prop({ required: true })
  timeOut!: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Table' }], default: [] })
  assignedTables!: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true })
  restaurant!: Types.ObjectId;
}

export const WaiterSchema = SchemaFactory.createForClass(Waiter);
