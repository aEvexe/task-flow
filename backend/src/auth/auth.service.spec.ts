import { Test, TestingModule } from '@nestjs/testing';
import {
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { VerificationService } from './services/verification.service';
import { UsersService } from '../users/users.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: Partial<Record<keyof UsersService, jest.Mock>>;
  let tokenService: Partial<Record<keyof TokenService, jest.Mock>>;
  let verificationService: Partial<Record<keyof VerificationService, jest.Mock>>;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      updateById: jest.fn(),
      updateOne: jest.fn(),
    };

    tokenService = {
      generateTokens: jest.fn().mockResolvedValue({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      }),
      generateAccessToken: jest.fn().mockResolvedValue('test-access-token'),
      verifyAccessToken: jest.fn().mockResolvedValue({
        sub: 'user-id-123',
        email: 'john@example.com',
        name: 'John Doe',
      }),
      verifyRefreshToken: jest.fn().mockResolvedValue({
        sub: 'user-id-123',
        email: 'john@example.com',
        name: 'John Doe',
      }),
    };

    verificationService = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      verifyCode: jest.fn().mockResolvedValue(true),
      resendVerificationCode: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: TokenService, useValue: tokenService },
        { provide: VerificationService, useValue: verificationService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = { name: 'John Doe', email: 'john@example.com', password: 'password123' };

    it('should create pending user and send verification email', async () => {
      usersService.findByEmail!.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
      usersService.create!.mockResolvedValue({ _id: 'user-id-123' });

      const result = await authService.register(registerDto);

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'john@example.com',
          status: 'pending',
          authProvider: 'email',
        }),
      );
      expect(verificationService.sendVerificationEmail).toHaveBeenCalledWith('john@example.com');
      expect(result).toEqual({ message: 'Verification code sent to email', email: 'john@example.com' });
    });

    it('should update and resend code for existing pending user', async () => {
      usersService.findByEmail!.mockResolvedValue({
        _id: { toString: () => 'existing-id' },
        email: 'john@example.com',
        status: 'pending',
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');

      const result = await authService.register(registerDto);

      expect(usersService.updateById).toHaveBeenCalled();
      expect(usersService.create).not.toHaveBeenCalled();
      expect(verificationService.sendVerificationEmail).toHaveBeenCalled();
      expect(result.message).toContain('Verification code sent');
    });

    it('should throw BadRequestException for active user', async () => {
      usersService.findByEmail!.mockResolvedValue({
        _id: 'existing-id',
        email: 'john@example.com',
        status: 'active',
      });

      await expect(authService.register(registerDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyEmail', () => {
    const verifyDto = { email: 'john@example.com', code: '123456' };

    it('should verify code, activate user, and return tokens', async () => {
      usersService.findByEmail!.mockResolvedValue({
        _id: { toString: () => 'user-id-123' },
        email: 'john@example.com',
        name: 'John Doe',
      });
      usersService.updateById!.mockResolvedValue({});

      const result = await authService.verifyEmail(verifyDto);

      expect(verificationService.verifyCode).toHaveBeenCalledWith('john@example.com', '123456');
      expect(usersService.updateById).toHaveBeenCalledWith('user-id-123', { status: 'active' });
      expect(result).toEqual({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        message: 'Email verified successfully',
      });
    });

    it('should throw when verification code is invalid', async () => {
      verificationService.verifyCode!.mockRejectedValue(
        new BadRequestException('Invalid verification code'),
      );

      await expect(authService.verifyEmail(verifyDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    const loginDto = { email: 'john@example.com', password: 'password123' };

    it('should login with correct credentials and return tokens', async () => {
      usersService.findByEmail!.mockResolvedValue({
        _id: { toString: () => 'user-id-123' },
        email: 'john@example.com',
        name: 'John Doe',
        authProvider: 'email',
        status: 'active',
        password: 'hashedPassword123',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login(loginDto);

      expect(result).toEqual({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        message: 'Login successful',
      });
    });

    it('should throw on wrong password', async () => {
      usersService.findByEmail!.mockResolvedValue({
        _id: { toString: () => 'user-id-123' },
        email: 'john@example.com',
        authProvider: 'email',
        status: 'active',
        password: 'hashedPassword123',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw when user not found', async () => {
      usersService.findByEmail!.mockResolvedValue(null);
      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw for Google users', async () => {
      usersService.findByEmail!.mockResolvedValue({
        _id: { toString: () => 'user-id-123' },
        authProvider: 'google',
      });
      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw for pending users', async () => {
      usersService.findByEmail!.mockResolvedValue({
        _id: { toString: () => 'user-id-123' },
        authProvider: 'email',
        status: 'pending',
      });
      await expect(authService.login(loginDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOrCreateGoogleUser', () => {
    it('should create new active Google user', async () => {
      usersService.findByEmail!.mockResolvedValue(null);
      usersService.create!.mockResolvedValue({
        _id: { toString: () => 'new-google-user' },
        email: 'google@example.com',
        name: 'Google User',
      });

      const result = await authService.findOrCreateGoogleUser('google@example.com', 'Google User');

      expect(usersService.create).toHaveBeenCalledWith({
        name: 'Google User',
        email: 'google@example.com',
        authProvider: 'google',
        status: 'active',
      });
      expect(result).toEqual({ accessToken: 'test-access-token', refreshToken: 'test-refresh-token' });
    });

    it('should return tokens for existing user', async () => {
      usersService.findByEmail!.mockResolvedValue({
        _id: { toString: () => 'existing-user' },
        email: 'google@example.com',
        name: 'Google User',
      });

      const result = await authService.findOrCreateGoogleUser('google@example.com', 'Google User');
      expect(usersService.create).not.toHaveBeenCalled();
      expect(result).toEqual({ accessToken: 'test-access-token', refreshToken: 'test-refresh-token' });
    });
  });

  describe('refreshToken', () => {
    it('should return new access token', async () => {
      const result = await authService.refreshToken('valid-refresh-token');
      expect(tokenService.verifyRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(result).toEqual({ accessToken: 'test-access-token' });
    });

    it('should throw on invalid refresh token', async () => {
      tokenService.verifyRefreshToken!.mockRejectedValue(new UnauthorizedException());
      await expect(authService.refreshToken('invalid')).rejects.toThrow(UnauthorizedException);
    });
  });
});
