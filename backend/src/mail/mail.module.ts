import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MailService } from './mail.service';
import { EmailConfig, EmailConfigSchema } from '../settings/schemas/email-config.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: EmailConfig.name, schema: EmailConfigSchema }]),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
