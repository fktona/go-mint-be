
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-twitter';
import { ConfigService } from '@nestjs/config';
import { VerifiedCallback } from 'passport-jwt';

@Injectable()
export class TwitterStrategy extends PassportStrategy(Strategy, 'twitter') {
  constructor(configService: ConfigService) {

    super({
      consumerKey: configService.get('TWITTER_CLIENT_ID'),
      consumerSecret: configService.get('TWITTER_CLIENT_SECRET'),
      callbackURL: `${configService.get('TWITTER_CALLBACK_URL')}`,
      includeEmail: true,
      passReqToCallback: true,
    } as any)
  }

  async validate(req: any, accessToken: string, _refreshToken: string, profile: any, done: VerifiedCallback) {

    req.full_profile = profile;

    const state = req?.session?.twitterState || null;



    done(null, {
      provider: 'twitter',
      id: profile.id,
      username: profile.username,
      name: profile.displayName,
      avatarUrl: profile.photos?.[0]?.value,
      email: profile.emails?.[0]?.value,
      accessToken,
      state: state,
    });
  }
}







