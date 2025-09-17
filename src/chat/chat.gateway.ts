import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { UseGuards } from '@nestjs/common';
import { WsWalletAuthGuard } from '../auth/guards/ws-wallet-auth.guard';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/enums/notification-type.enum';
import { NotificationGateway } from '../notification/notification.gateway';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private typingUsers = new Map<string, Set<string>>();

  constructor(
    private readonly chatService: ChatService,
    private readonly notificationService: NotificationService,
    private readonly notificationGateway: NotificationGateway,
  ) { }

  async handleConnection(client: Socket) {
    // Handle connection
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    // Handle disconnection
    console.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsWalletAuthGuard)
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() createChatMessageDto: CreateChatMessageDto,
  ) {
    try {
      const message = await this.chatService.createMessage(
        client.data.walletAddress,
        createChatMessageDto,
      );
      this.server.to(client.id).emit('messageSent', message);
      const receiverRoom = `user_${createChatMessageDto.receiver_wallet_address}`;
      this.server.to(receiverRoom).emit('newMessage', message);
      const notification = await this.notificationService.create(
        createChatMessageDto.receiver_wallet_address,
        NotificationType.NEW_CHAT_MESSAGE,
        `New message from ${client.data.walletAddress}`,
        client.data.walletAddress,
        {
          action: 'new_message',
          messageId: message.id,
          conversationId: `${client.data.walletAddress}-${createChatMessageDto.receiver_wallet_address}`
        }
      );
      this.notificationGateway.emitNewNotification(notification);
      return message;
    } catch (error) {
      this.server.to(client.id).emit('error', error.message);
      throw error;
    }
  }
  @UseGuards(WsWalletAuthGuard)
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiver_wallet_address: string; isTyping: boolean },
  ) {
    const receiverRoom = `user_${data.receiver_wallet_address}`;

    if (data.isTyping) {
      if (!this.typingUsers.has(receiverRoom)) {
        this.typingUsers.set(receiverRoom, new Set());
      }
      this.typingUsers.get(receiverRoom)?.add(client.data.walletAddress);
    } else {
      this.typingUsers.get(receiverRoom)?.delete(client.data.walletAddress);
      if (this.typingUsers.get(receiverRoom)?.size === 0) {
        this.typingUsers.delete(receiverRoom);
      }
    }

    this.server.to(receiverRoom).emit('typing', {
      user: client.data.walletAddress,
      isTyping: data.isTyping,
    });
  }

  @UseGuards(WsWalletAuthGuard)
  @SubscribeMessage('joinChat')
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { otherUserWalletAddress: string },
  ) {
    const conversation = await this.chatService.getConversation(
      client.data.walletAddress,
      data.otherUserWalletAddress,
    );

    // Join user's personal room
    client.join(`user_${client.data.walletAddress}`);

    return conversation;
  }

  @UseGuards(WsWalletAuthGuard)
  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    const message = await this.chatService.markMessageAsRead(
      data.messageId,
      client.data.walletAddress,
    );

    // Notify sender that their message was read
    const senderRoom = `user_${message.sender_wallet_address}`;
    this.server.to(senderRoom).emit('messageRead', {
      messageId: message.id,
      readBy: client.data.walletAddress,
    });

    return message;
  }
}
