import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from '../../common/enums/role.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  username!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ required: true, enum: [Role.SuperAdmin, Role.BranchManager] })
  role!: string;

  @Prop({ type: Types.ObjectId, ref: 'Restaurant', default: null })
  assignedRestaurant!: Types.ObjectId | null;
}

export const UserSchema = SchemaFactory.createForClass(User);