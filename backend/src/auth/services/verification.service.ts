import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { MailService } from './mail.service';

@Injectable()
export class VerificationService {
  constructor(
    private usersService: UsersService,
    private mailService: MailService,
  ) {}

  generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendVerificationEmail(email: string): Promise<void> {
    const code = this.generateCode();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.usersService.updateOne(
      { email: email.toLowerCase() },
      { verificationCode: code, verificationCodeExpiry: expiry },
    );

    await this.mailService.sendOtp(email, code);
  }

  async verifyCode(email: string, code: string): Promise<boolean> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.verificationCode) {
      throw new BadRequestException('No verification code found. Please request a new one.');
    }

    if (user.verificationCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    if (user.verificationCodeExpiry && new Date() > user.verificationCodeExpiry) {
      throw new BadRequestException('Verification code has expired');
    }

    // Clear the code after successful verification
    await this.usersService.updateById(user._id!.toString(), {
      $unset: { verificationCode: '', verificationCodeExpiry: '' },
    });

    return true;
  }

  async resendVerificationCode(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // 1-minute cooldown
    if (user.verificationCodeExpiry) {
      const timeSinceLastCode = Date.now() - (user.verificationCodeExpiry.getTime() - 15 * 60 * 1000);
      const oneMinute = 60 * 1000;

      if (timeSinceLastCode < oneMinute) {
        throw new BadRequestException('Please wait before resending the verification code.');
      }
    }

    await this.sendVerificationEmail(email);
  }
}
