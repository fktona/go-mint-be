import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatMessage } from './entities/chat-message.entity';
import { FriendsModule } from '../friends/friends.module';
import { UserModule } from '../user/user.module';
import { EncryptionService } from '../common/services/encryption.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessage]),
    FriendsModule,
    UserModule,
  ],
  providers: [ChatService, ChatGateway, EncryptionService],
  exports: [ChatService],
})
export class ChatModule { }
