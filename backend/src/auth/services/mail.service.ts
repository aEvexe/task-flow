import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const user = this.configService.get<string>('smtp.user');
    const pass = this.configService.get<string>('smtp.pass');
    this.fromEmail = user || '';

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
      });
    }
  }

  async sendOtp(to: string, code: string): Promise<void> {
    if (!this.transporter) {
      console.log(`[OTP] SMTP not configured. Code for ${to}: ${code}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"TaskFlow" <${this.fromEmail}>`,
        to,
        subject: 'Your TaskFlow verification code',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 0;">
            <div style="background: #dc4c3e; padding: 28px 32px; border-radius: 12px 12px 0 0;">
              <h2 style="color: #fff; margin: 0; font-size: 22px; font-weight: 700;">TaskFlow</h2>
            </div>
            <div style="padding: 32px; background: #fff; border: 1px solid #eee; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="color: #202020; font-size: 16px; margin: 0 0 8px;">Your verification code is:</p>
              <div style="background: #fdf2f1; border-radius: 10px; padding: 24px; text-align: center; margin: 20px 0;">
                <span style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #dc4c3e;">${code}</span>
              </div>
              <p style="color: #999; font-size: 13px; margin: 16px 0 0; line-height: 1.5;">This code expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
            </div>
          </div>
        `,
      });
      console.log(`[OTP] Email sent to ${to}`);
    } catch (error) {
      console.error(`[OTP] Failed to send email to ${to}, code: ${code}`, error);
    }
  }
}
