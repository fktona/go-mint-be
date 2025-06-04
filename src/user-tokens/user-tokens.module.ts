import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserTokensService } from './user-tokens.service';
import { UserTokensController } from './user-tokens.controller';
import { UserToken } from './entities/user-token.entity';
import { UserModule } from '../user/user.module';
import { CommunityChatModule } from '../community-chat/community-chat.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserToken]),
    UserModule,
    forwardRef(() => CommunityChatModule),
    NotificationModule,
  ],
  controllers: [UserTokensController],
  providers: [UserTokensService],
  exports: [UserTokensService],
})
export class UserTokensModule { }
