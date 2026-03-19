import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../services/auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('googleClientId') || 'not-configured',
      clientSecret: configService.get<string>('googleClientSecret') || 'not-configured',
      callbackURL: configService.get<string>('googleCallbackUrl') || 'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<void> {
    const { emails, displayName } = profile;
    const email = emails[0].value;

    const tokens = await this.authService.findOrCreateGoogleUser(
      email,
      displayName,
    );

    done(null, tokens);
  }
}
