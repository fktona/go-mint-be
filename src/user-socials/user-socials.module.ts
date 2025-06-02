import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSocialsController } from './user-socials.controller';
import { StrategyRegistryService } from './strategies/strategy-registry.service';
import { TwitterStrategy } from './strategies/twitter.strategy';
import { TiktokStrategy } from './strategies/tiktok.strategy';
import { DynamicStrategy } from 'src/lib/dynamic.strategy';
import { UserSocial } from './entities/user-social.entity';
import { UserSocialsService } from './user-socials.service';
import jwtConfig from 'src/config/jwt.config';
import { JwtModule } from '@nestjs/jwt';
import { User } from 'src/user/entities/user.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'dynamic' }),
    TypeOrmModule.forFeature([UserSocial, User]),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    forwardRef(() => UserModule),
  ],
  controllers: [UserSocialsController],
  providers: [
    UserSocialsService,
    StrategyRegistryService,
    TwitterStrategy,
    TiktokStrategy,
    DynamicStrategy,
  ],
  exports: [StrategyRegistryService, DynamicStrategy, UserSocialsService],
})
export class UserSocialsModule { }