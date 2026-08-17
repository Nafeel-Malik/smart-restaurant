import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as nodemailer from 'nodemailer';
import { EmailConfig, EmailConfigDocument } from '../settings/schemas/email-config.schema';
import { decrypt } from '../common/utils/encryption.util';

type ResolvedMailConfig = {
  user: string;
  pass: string;
  fromName: string;
  source: 'database' | 'env';
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(EmailConfig.name) private emailConfigModel: Model<EmailConfigDocument>,
  ) {}

  async sendOtpEmail(toEmail: string, otp: string, fullName: string) {
    const config = await this.resolveConfig();
    await this.sendMail(config, {
      to: toEmail,
      subject: 'Your RestoPro verification code',
      text: `Hi ${fullName},\n\nYour verification code is ${otp}. It expires in 10 minutes.\n\nSmart Restaurant Management System`,
      html: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #1f1f1f;">
            <h2 style="margin: 0 0 12px;">${this.escapeHtml(config.fromName)}</h2>
            <p>Hi ${this.escapeHtml(fullName)},</p>
            <p>Use this code to verify your email address:</p>
            <p style="font-size: 32px; letter-spacing: 8px; font-weight: bold; margin: 24px 0;">${otp}</p>
            <p>This code expires in <strong>10 minutes</strong>.</p>
            <p style="color: #666; font-size: 13px;">If you did not create a RestoPro customer account, you can ignore this email.</p>
          </div>
        `,
    });
    this.logger.log(`OTP email sent to ${toEmail} via ${config.source}`);
  }

  async sendTestEmail(toEmail: string) {
    const config = await this.resolveConfig();
    await this.sendMail(config, {
      to: toEmail,
      subject: 'RestoPro SMTP test email',
      text: `This is a test email from ${config.fromName}. SMTP is working.`,
      html: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #1f1f1f;">
            <h2 style="margin: 0 0 12px;">${this.escapeHtml(config.fromName)}</h2>
            <p>This is a test email. Your SMTP configuration is working.</p>
            <p style="color: #666; font-size: 13px;">Source: ${config.source === 'database' ? 'in-app settings' : '.env fallback'}</p>
          </div>
        `,
    });
    this.logger.log(`Test email sent to ${toEmail} via ${config.source}`);
    return {
      success: true,
      message: 'Test email sent!',
      to: toEmail,
      from: config.user,
      source: config.source,
    };
  }

  private async resolveConfig(): Promise<ResolvedMailConfig> {
    const dbConfig = await this.emailConfigModel.findOne({ isActive: true }).sort({ updatedAt: -1 }).exec();
    if (dbConfig) {
      const masterKey = this.configService.get<string>('MASTER_ENCRYPTION_KEY')?.trim();
      if (!masterKey) {
        throw new ServiceUnavailableException(
          'Email config is saved in the database but MASTER_ENCRYPTION_KEY is missing from backend/.env.',
        );
      }
      try {
        return {
          user: dbConfig.emailUser,
          pass: decrypt(dbConfig.emailAppPasswordEncrypted, masterKey),
          fromName: dbConfig.fromName || 'Smart Restaurant Management System',
          source: 'database',
        };
      } catch (error: any) {
        this.logger.error(`Failed to decrypt saved email App Password: ${error?.message || error}`);
        throw new ServiceUnavailableException(
          'Could not decrypt the saved App Password. Check MASTER_ENCRYPTION_KEY in backend/.env.',
        );
      }
    }

    const user = (this.configService.get<string>('EMAIL_USER') || '').trim();
    const pass = (this.configService.get<string>('EMAIL_APP_PASSWORD') || '').trim().replaceAll(' ', '');
    if (!user || !pass) {
      throw new ServiceUnavailableException(
        'Email is not configured. A Superadmin can set SMTP under Email Settings, or set EMAIL_USER and EMAIL_APP_PASSWORD in backend/.env.',
      );
    }
    return {
      user,
      pass,
      fromName: 'Smart Restaurant Management System',
      source: 'env',
    };
  }

  private async sendMail(
    config: ResolvedMailConfig,
    options: { to: string; subject: string; text: string; html: string },
  ) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

    try {
      await transporter.sendMail({
        from: `"${config.fromName}" <${config.user}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to send email to ${options.to}: code=${error?.code || 'n/a'} command=${error?.command || 'n/a'} response=${error?.response || 'n/a'}`,
        error?.stack || String(error),
      );
      throw new ServiceUnavailableException(this.mapSmtpError(error));
    }
  }

  private mapSmtpError(error: any): string {
    const code = String(error?.code || '').toUpperCase();
    const response = String(error?.response || error?.message || '');

    if (code === 'EAUTH' || /invalid login|authentication failed|username and password not accepted/i.test(response)) {
      return 'Authentication failed — check your App Password';
    }
    if (code === 'EENVELOPE' || /invalid mailbox/i.test(response)) {
      return 'Invalid recipient address';
    }
    if (code === 'ETIMEDOUT' || code === 'ESOCKET' || code === 'ECONNECTION') {
      return 'Could not reach Gmail SMTP. Check your network connection.';
    }
    return response || error?.message || 'Failed to send email';
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
