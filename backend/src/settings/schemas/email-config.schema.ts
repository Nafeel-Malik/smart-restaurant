import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EmailConfigDocument = EmailConfig & Document;

@Schema({ timestamps: true })
export class EmailConfig {
  @Prop({ default: 'gmail', trim: true })
  provider!: string;

  @Prop({ required: true, trim: true, lowercase: true })
  emailUser!: string;

  @Prop({ required: true })
  emailAppPasswordEncrypted!: string;

  @Prop({ default: '', trim: true })
  passwordLast4!: string;

  @Prop({ default: 'Smart Restaurant Management System', trim: true })
  fromName!: string;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  updatedBy?: Types.ObjectId | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const EmailConfigSchema = SchemaFactory.createForClass(EmailConfig);
