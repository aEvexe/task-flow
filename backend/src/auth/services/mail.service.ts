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
        port: 587,
        secure: false,
        auth: { user, pass },
      });
    }
  }

  async sendOtp(to: string, code: string): Promise<void> {
    if (!this.transporter) {
      console.log(`[OTP] SMTP not configured. Code for ${to}: ${code}`);
      return;
    }

    await this.transporter.sendMail({
      from: `"TaskFlow" <${this.fromEmail}>`,
      to,
      subject: 'Your TaskFlow verification code',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #026aa7; margin-bottom: 8px;">TaskFlow</h2>
          <p style="color: #172b4d; font-size: 16px;">Your verification code is:</p>
          <div style="background: #f4f5f7; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #172b4d;">${code}</span>
          </div>
          <p style="color: #5e6c84; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
        </div>
      `,
    });

    console.log(`[OTP] Email sent to ${to}`);
  }
}
