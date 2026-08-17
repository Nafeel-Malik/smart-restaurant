import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ReservationStatus } from '../../common/enums/reservation-status.enum';

export type ReservationDocument = Reservation & Document;

@Schema({ timestamps: true })
export class Reservation {
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true, index: true })
  customerId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true, index: true })
  restaurantId!: Types.ObjectId;

  @Prop({ required: true, index: true })
  reservationDate!: Date;

  @Prop({ required: true, trim: true })
  timeSlot!: string;

  @Prop({ required: true, min: 1 })
  partySize!: number;

  @Prop({
    required: true,
    enum: Object.values(ReservationStatus),
    default: ReservationStatus.Confirmed,
    index: true,
  })
  status!: ReservationStatus;

  @Prop({ type: String, default: '', trim: true })
  specialRequests?: string;

  @Prop({ required: true, trim: true })
  contactPhone!: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);
ReservationSchema.index({ customerId: 1, reservationDate: 1, timeSlot: 1 });
ReservationSchema.index({ restaurantId: 1, reservationDate: 1, timeSlot: 1 });
