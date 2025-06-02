import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunityChatService } from './community-chat.service';
import { CommunityChatGateway } from './community-chat.gateway';
import { CommunityChat } from './entities/community-chat.entity';
import { CommunityChatMessage } from './entities/community-chat-message.entity';
import { UserModule } from '../user/user.module';
import { UserTokensModule } from '../user-tokens/user-tokens.module';
import { EncryptionService } from '../common/services/encryption.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommunityChat, CommunityChatMessage]),
    UserModule,
    UserTokensModule,
  ],
  providers: [CommunityChatService, CommunityChatGateway, EncryptionService],
  exports: [CommunityChatService],
})
export class CommunityChatModule { }
