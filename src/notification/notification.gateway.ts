import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationService } from './notification.service';
import { UseGuards } from '@nestjs/common';
import { WsWalletAuthGuard } from '../auth/guards/ws-wallet-auth.guard';
import { NotificationType } from './enums/notification-type.enum';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly notificationService: NotificationService) { }

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsWalletAuthGuard)
  @SubscribeMessage('joinNotifications')
  async handleJoinNotifications(
    @ConnectedSocket() client: Socket,
  ) {
    // Join user's personal notification room
    client.join(`user_${client.data.walletAddress}`);
    return { status: 'joined' };
  }

  @UseGuards(WsWalletAuthGuard)
  @SubscribeMessage('getNotifications')
  async handleGetNotifications(
    @ConnectedSocket() client: Socket,
  ) {
    const notifications = await this.notificationService.findAll(client.data.walletAddress);
    console.log('notificationsbbb', notifications.map(notification => notification.sender.userSocials));

    return notifications;
  }

  @UseGuards(WsWalletAuthGuard)
  @SubscribeMessage('getUnreadCount')
  async handleGetNotificationCount(
    @ConnectedSocket() client: Socket,
  ) {
    const notificationCount = await this.notificationService.findUnread(client.data.walletAddress);
    return notificationCount.length;
  }

  @UseGuards(WsWalletAuthGuard)
  @SubscribeMessage('getUnreadNotifications')
  async handleGetUnreadNotifications(
    @ConnectedSocket() client: Socket,
  ) {
    return this.notificationService.findUnread(client.data.walletAddress);
  }

  @UseGuards(WsWalletAuthGuard)
  @SubscribeMessage('markNotificationAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { id: string },
  ) {
    const notification = await this.notificationService.markAsRead(data.id, client.data.walletAddress);
    this.emitNotificationUpdate(notification);
    return notification;
  }

  @UseGuards(WsWalletAuthGuard)
  @SubscribeMessage('markAllNotificationsAsRead')
  async handleMarkAllAsRead(
    @ConnectedSocket() client: Socket,
  ) {
    console.log('handleMarkAllAsRead', client.data.walletAddress);
    return this.notificationService.markAllAsRead(client.data.walletAddress);
  }

  @UseGuards(WsWalletAuthGuard)
  @SubscribeMessage('removeNotification')
  async handleRemoveNotification(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { id: string },
  ) {
    console.log('handleRemoveNot]ification', data.id, client.data.walletAddress);
    const notification = await this.notificationService.remove(data.id, client.data.walletAddress);
    this.emitDeleteNotification(notification);
    return notification;
  }

  @UseGuards(WsWalletAuthGuard)
  @SubscribeMessage('createNotification')
  async handleCreateNotification(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      recipientWalletAddress: string,
      type: NotificationType,
      message: string,
      senderWalletAddress?: string,
      metadata?: Record<string, any>,
    }
  ) {
    const notification = await this.notificationService.create(
      data.recipientWalletAddress,
      data.type,
      data.message,
      data.senderWalletAddress,
      data.metadata
    );
    console.log('handleCreateNotification', notification.sender.userSocials);
    console.log('notification.recipient_wallet_address', notification.recipient_wallet_address);

    // this.emitNewNotification(notification);
    return notification;
  }

  // Method to emit notification updates to connected clients
  async emitNotificationUpdate(notification: any) {
    this.server.to(`user_${notification.recipient_wallet_address}`).emit('notificationUpdated', notification);
  }

  // Method to emit new notifications to connected clients
  public async emitNewNotification(notification: any) {
    console.log('emitNewNotification', notification);
    this.server.to(`user_${notification.recipient_wallet_address}`).emit('newNotification', notification);
  }
  async emitDeleteNotification(notification: any) {

    console.log("emitying")

    this.server.to(`user_${notification.recipient_wallet_address}`).emit('deleteNotification', notification);
  }


}