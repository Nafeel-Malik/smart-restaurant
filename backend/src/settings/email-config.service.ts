import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { EmailConfig, EmailConfigDocument } from './schemas/email-config.schema';
import { UpdateEmailConfigDto } from './dto/update-email-config.dto';
import { encrypt, lastFour } from '../common/utils/encryption.util';
import { MailService } from '../mail/mail.service';

@Injectable()
export class EmailConfigService {
  private readonly logger = new Logger(EmailConfigService.name);

  constructor(
    @InjectModel(EmailConfig.name) private emailConfigModel: Model<EmailConfigDocument>,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async getPublicConfig() {
    const config = await this.findActive();
    if (!config) {
      const envUser = (this.configService.get<string>('EMAIL_USER') || '').trim();
      const envPass = (this.configService.get<string>('EMAIL_APP_PASSWORD') || '').trim();
      const envConfigured = Boolean(envUser && envPass);
      return {
        configured: envConfigured,
        source: envConfigured ? 'env' : 'none',
        provider: 'gmail',
        emailUser: envConfigured ? envUser : null,
        emailAppPasswordMasked: envConfigured ? 'configured via .env' : null,
        fromName: 'Smart Restaurant Management System',
        isActive: envConfigured,
        updatedAt: null,
      };
    }

    return {
      configured: true,
      source: 'database',
      provider: config.provider || 'gmail',
      emailUser: config.emailUser,
      emailAppPasswordMasked: config.passwordLast4 ? `••••••••••••${config.passwordLast4}` : 'configured',
      fromName: config.fromName,
      isActive: config.isActive,
      updatedAt: config.updatedAt || null,
    };
  }

  async upsert(dto: UpdateEmailConfigDto, updatedBy?: string) {
    const masterKey = this.requireMasterKey();
    const existing = await this.findActive();
    const nextPassword = dto.emailAppPassword?.trim().replaceAll(' ', '');

    if (!existing && !nextPassword) {
      throw new BadRequestException('App Password is required when saving email config for the first time');
    }

    if (nextPassword && nextPassword.length !== 16) {
      this.logger.warn(`App Password length is ${nextPassword.length}; Gmail App Passwords are typically 16 characters`);
    }

    const payload: Partial<EmailConfig> = {
      provider: 'gmail',
      emailUser: dto.emailUser.trim().toLowerCase(),
      fromName: dto.fromName?.trim() || existing?.fromName || 'Smart Restaurant Management System',
      isActive: true,
      updatedBy: updatedBy && Types.ObjectId.isValid(updatedBy) ? new Types.ObjectId(updatedBy) : existing?.updatedBy || null,
    };

    if (nextPassword) {
      payload.emailAppPasswordEncrypted = encrypt(nextPassword, masterKey);
      payload.passwordLast4 = lastFour(nextPassword);
    }

    let saved: EmailConfigDocument;
    if (existing) {
      Object.assign(existing, payload);
      saved = await existing.save();
    } else {
      saved = await this.emailConfigModel.create(payload);
    }

    this.logger.log(`Email config updated for ${saved.emailUser}`);
    return this.getPublicConfig();
  }

  async sendTest(to: string) {
    if (!to?.trim()) {
      throw new BadRequestException('Test recipient email is required');
    }
    return this.mailService.sendTestEmail(to.trim());
  }

  private async findActive() {
    return this.emailConfigModel.findOne({ isActive: true }).sort({ updatedAt: -1 }).exec();
  }

  private requireMasterKey() {
    const key = this.configService.get<string>('MASTER_ENCRYPTION_KEY')?.trim();
    if (!key) {
      throw new ServiceUnavailableException('MASTER_ENCRYPTION_KEY is missing from backend/.env');
    }
    return key;
  }
}
