import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CommunityChatService } from './community-chat.service';
import { CreateCommunityChatDto } from './dto/create-community-chat.dto';
import { UpdateCommunityChatDto } from './dto/update-community-chat.dto';
import { UseGuards } from '@nestjs/common';
import { WsWalletAuthGuard } from '../auth/guards/ws-wallet-auth.guard';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class CommunityChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private typingUsers = new Map<string, Set<string>>();

  constructor(private readonly communityChatService: CommunityChatService) { }

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsWalletAuthGuard)
  @SubscribeMessage('joinCommunityChat')
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    const chat = await this.communityChatService.findOne(data.chatId);
    client.join(`community_chat_${data.chatId}`);

    const messages = await this.communityChatService.getMessages(data.chatId);
    return { chat, messages };
  }

  @UseGuards(WsWalletAuthGuard)
  @SubscribeMessage('sendCommunityMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; content: string },
  ) {
    try {
      const message = await this.communityChatService.createMessage(
        data.chatId,
        client.data.walletAddress,
        data.content,
      );

      this.server.to(`community_chat_${data.chatId}`).emit('newCommunityMessage', message);
      return message;
    } catch (error) {
      this.server.to(client.id).emit('error', error.message);
      throw error;
    }
  }

  @UseGuards(WsWalletAuthGuard)
  @SubscribeMessage('communityTyping')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; isTyping: boolean },
  ) {
    const chatRoom = `community_chat_${data.chatId}`;

    if (data.isTyping) {
      if (!this.typingUsers.has(chatRoom)) {
        this.typingUsers.set(chatRoom, new Set());
      }
      this.typingUsers.get(chatRoom)?.add(client.data.walletAddress);
    } else {
      this.typingUsers.get(chatRoom)?.delete(client.data.walletAddress);
      if (this.typingUsers.get(chatRoom)?.size === 0) {
        this.typingUsers.delete(chatRoom);
      }
    }

    this.server.to(chatRoom).emit('communityTyping', {
      user: client.data.walletAddress,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('findAllCommunityChat')
  findAll() {
    console.log('findAllCommunityChat');
    const communityChats = this.communityChatService.findAll();
    console.log('communityChats', communityChats);
    return communityChats;
  }

  @SubscribeMessage('findOneCommunityChat')
  findOne(@MessageBody() id: string) {
    return this.communityChatService.findOne(id);
  }


}
