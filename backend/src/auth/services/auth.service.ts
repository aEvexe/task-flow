import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../users/users.service';
import { AuthProvider, UserStatus } from '../../users/user.schema';
import { TokenService, Tokens } from './token.service';
import { VerificationService } from './verification.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { VerifyEmailDto } from '../dto/verify-email.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly verificationService: VerificationService,
  ) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<{ message: string; email: string }> {
    const existing = await this.usersService.findByEmail(registerDto.email);

    if (existing) {
      if (existing.status === UserStatus.Active) {
        throw new BadRequestException('Email already registered');
      }

      // If pending, update their data and resend code
      if (existing.status === UserStatus.Pending) {
        const hashedPassword = await bcrypt.hash(registerDto.password, 10);
        await this.usersService.updateById(existing._id!.toString(), {
          name: registerDto.name,
          password: hashedPassword,
        });
        await this.verificationService.sendVerificationEmail(registerDto.email);
        return { message: 'Verification code sent to email', email: registerDto.email };
      }
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    await this.usersService.create({
      name: registerDto.name,
      email: registerDto.email,
      password: hashedPassword,
      status: UserStatus.Pending,
      authProvider: AuthProvider.Email,
    });

    await this.verificationService.sendVerificationEmail(registerDto.email);

    return { message: 'Verification code sent to email', email: registerDto.email };
  }

  async verifyEmail(
    verifyEmailDto: VerifyEmailDto,
  ): Promise<Tokens & { message: string }> {
    await this.verificationService.verifyCode(verifyEmailDto.email, verifyEmailDto.code);

    const user = await this.usersService.findByEmail(verifyEmailDto.email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Activate the user
    await this.usersService.updateById(user._id!.toString(), {
      status: UserStatus.Active,
    });

    const tokens = await this.tokenService.generateTokens({
      sub: user._id!.toString(),
      email: user.email,
      name: user.name,
    });

    return { ...tokens, message: 'Email verified successfully' };
  }

  async login(loginDto: LoginDto): Promise<Tokens & { message: string }> {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.authProvider === AuthProvider.Google) {
      throw new UnauthorizedException(
        'This account uses Google sign-in. Please log in with Google.',
      );
    }

    if (user.status === UserStatus.Pending) {
      throw new BadRequestException('Please verify your email first');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.tokenService.generateTokens({
      sub: user._id!.toString(),
      email: user.email,
      name: user.name,
    });

    return { ...tokens, message: 'Login successful' };
  }

  async findOrCreateGoogleUser(
    email: string,
    name: string,
  ): Promise<Tokens> {
    let user = await this.usersService.findByEmail(email);

    if (!user) {
      user = await this.usersService.create({
        name,
        email,
        authProvider: AuthProvider.Google,
        status: UserStatus.Active,
      });
    }

    return this.tokenService.generateTokens({
      sub: user._id!.toString(),
      email: user.email,
      name: user.name,
    });
  }

  async refreshToken(token: string): Promise<{ accessToken: string }> {
    const payload = await this.tokenService.verifyRefreshToken(token);
    const accessToken = await this.tokenService.generateAccessToken({
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
    });
    return { accessToken };
  }

  async me(token: string): Promise<{ user: { _id: string; email: string; name: string } }> {
    const payload = await this.tokenService.verifyAccessToken(token);
    return {
      user: {
        _id: payload.sub,
        email: payload.email,
        name: payload.name,
      },
    };
  }

  async logout(): Promise<{ message: string }> {
    return { message: 'Logged out successfully' };
  }
}
