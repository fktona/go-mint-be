import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-tiktok-auth';
import { ConfigService } from '@nestjs/config';
import { VerifiedCallback } from 'passport-jwt';

@Injectable()
export class TiktokStrategy extends PassportStrategy(Strategy, 'tiktok') {
    constructor(configService: ConfigService) {
        super({
            clientID: configService.get('TIKTOK_CLIENT_ID'),
            clientSecret: configService.get('TIKTOK_CLIENT_SECRET'),
            callbackURL: configService.get('TIKTOK_CALLBACK_URL'),
            scope: ['user.info.basic'],
            passReqToCallback: true,
        } as any);
    }

    async validate(req: any, accessToken: string, _refreshToken: string, profile: any, done: VerifiedCallback) {
        req.full_profile = profile;
        const state = req?.session?.tiktokState || null;

        done(null, {
            provider: 'tiktok',
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