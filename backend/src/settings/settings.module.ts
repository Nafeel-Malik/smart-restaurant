import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailConfig, EmailConfigSchema } from './schemas/email-config.schema';
import { EmailConfigService } from './email-config.service';
import { EmailConfigController } from './email-config.controller';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: EmailConfig.name, schema: EmailConfigSchema }]),
    MailModule,
  ],
  controllers: [EmailConfigController],
  providers: [EmailConfigService],
  exports: [MongooseModule, EmailConfigService],
})
export class SettingsModule {}
