import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend | null = null;
  private fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('resendApiKey');
    this.fromEmail = this.configService.get<string>('resendFrom') || 'TaskFlow <onboarding@resend.dev>';

    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
  }

  async sendOtp(to: string, code: string): Promise<void> {
    if (!this.resend) {
      console.log(`[OTP] Resend not configured. Code for ${to}: ${code}`);
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
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
