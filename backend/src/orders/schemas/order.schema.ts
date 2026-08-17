import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { OrderType } from '../../common/enums/order-type.enum';
import { PaymentStatus } from '../../common/enums/payment-status.enum';

export type OrderDocument = Order & Document;

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'MenuItem', required: true })
  foodId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true })
  price!: number;

  @Prop({ required: true, min: 1 })
  quantity!: number;

  @Prop({ required: true })
  subtotal!: number;
}
export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ _id: false })
export class DeliveryAddressSnapshot {
  @Prop({ required: true, trim: true })
  label!: string;

  @Prop({ required: true, trim: true })
  fullAddress!: string;

  @Prop({ required: true, trim: true })
  city!: string;

  @Prop({ type: String, default: null, trim: true })
  area?: string | null;

  @Prop({ type: String, default: null, trim: true })
  phone?: string | null;
}
export const DeliveryAddressSnapshotSchema = SchemaFactory.createForClass(DeliveryAddressSnapshot);

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true, index: true })
  customerId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true, index: true })
  restaurantId!: Types.ObjectId;

  @Prop({ required: true, enum: Object.values(OrderType), default: OrderType.Delivery })
  orderType!: OrderType;

  @Prop({ type: Types.ObjectId, ref: 'Reservation', default: null, index: true })
  reservationId?: Types.ObjectId | null;

  @Prop({ type: [OrderItemSchema], required: true })
  items!: OrderItem[];

  @Prop({ type: Types.ObjectId, ref: 'Address', default: null })
  deliveryAddressId?: Types.ObjectId | null;

  @Prop({ type: DeliveryAddressSnapshotSchema, default: null })
  deliveryAddressSnapshot?: DeliveryAddressSnapshot | null;

  @Prop({ required: true, min: 0 })
  totalAmount!: number;

  @Prop({ required: true, enum: Object.values(OrderStatus), default: OrderStatus.Pending, index: true })
  status!: OrderStatus;

  @Prop({ required: true, enum: Object.values(PaymentStatus), default: PaymentStatus.Pending })
  paymentStatus!: PaymentStatus;

  createdAt?: Date;
  updatedAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ restaurantId: 1, createdAt: -1 });
OrderSchema.index({ reservationId: 1, orderType: 1, status: 1 });
