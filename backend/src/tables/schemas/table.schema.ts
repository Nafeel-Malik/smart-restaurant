import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TableDocument = Table & Document;

@Schema({ timestamps: true })
export class Table {
  @Prop({ required: true })
  number!: string;

  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true })
  restaurant!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Waiter', default: null })
  assignedWaiter!: Types.ObjectId | null;

  @Prop({ type: Number, default: 4, min: 1 })
  capacity!: number;
}

export const TableSchema = SchemaFactory.createForClass(Table);
