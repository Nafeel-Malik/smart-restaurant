import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../../common/enums/role.enum';
import { Gender } from '../../common/enums/gender.enum';

export type CustomerDocument = Customer & Document;

@Schema({ timestamps: true })
export class Customer {
  @Prop({ required: true, trim: true })
  fullName!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, unique: true, trim: true })
  phone!: string;

  @Prop({ required: true, select: false })
  password!: string;

  @Prop({ required: true, enum: [Role.Customer], default: Role.Customer })
  role!: string;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  isEmailVerified!: boolean;

  @Prop({ type: String, default: null, trim: true })
  profilePicture?: string | null;

  @Prop({ type: String, default: null })
  dateOfBirth?: string | null;

  @Prop({ type: String, enum: [...Object.values(Gender), null], default: null })
  gender?: string | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
