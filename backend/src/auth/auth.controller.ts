import { Controller, Post, Get, Body, UseGuards, UseInterceptors, UseFilters, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './services/auth.service';
import { VerificationService } from './services/verification.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { TokenCookieInterceptor } from './interceptors/token-cookie.interceptor';
import { OAuthExceptionFilter } from './filters/oauth-exception.filter';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly verificationService: VerificationService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'Verification code sent to email' })
  @ApiResponse({ status: 400, description: 'Email already registered' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('verify-email')
  @UseInterceptors(TokenCookieInterceptor)
  @ApiOperation({ summary: 'Verify email and complete registration' })
  @ApiResponse({ status: 201, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('resend-code')
  @ApiOperation({ summary: 'Resend verification code' })
  @ApiResponse({ status: 201, description: 'Code resent' })
  @ApiResponse({ status: 400, description: 'Please wait before resending' })
  async resendCode(@Body('email') email: string) {
    await this.verificationService.resendVerificationCode(email);
    return { message: 'Verification code resent' };
  }

  @Post('login')
  @UseInterceptors(TokenCookieInterceptor)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @UseInterceptors(TokenCookieInterceptor)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Req() req: Request) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return { message: 'No refresh token provided' };
    }
    return this.authService.refreshToken(refreshToken);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout and clear cookies' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
    return this.authService.logout();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user from cookie' })
  async me(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.accessToken;
    if (!token) {
      return { user: null };
    }
    try {
      return await this.authService.me(token);
    } catch {
      res.clearCookie('accessToken', { path: '/' });
      res.clearCookie('refreshToken', { path: '/' });
      return { user: null };
    }
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @UseFilters(OAuthExceptionFilter)
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const tokens = req.user as { accessToken: string; refreshToken: string };
    const frontendUrl = this.configService.get<string>('frontendUrl') || 'http://localhost:5173';

    res.cookie('accessToken', tokens.accessToken, { ...COOKIE_OPTIONS, maxAge: 24 * 60 * 60 * 1000 });
    res.cookie('refreshToken', tokens.refreshToken, { ...COOKIE_OPTIONS, maxAge: 30 * 24 * 60 * 60 * 1000 });

    res.redirect(`${frontendUrl}/auth/google/callback`);
  }
}
