import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationType } from './enums/notification-type.enum';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) { }

  async create(
    recipientWalletAddress: string,
    type: NotificationType,
    message: string,
    senderWalletAddress?: string,
    metadata?: Record<string, any>,

  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      recipient_wallet_address: recipientWalletAddress,
      sender_wallet_address: senderWalletAddress,
      type,
      message,
      metadata,
    });

    return this.notificationRepository.save(notification);
  }

  async findAll(recipientWalletAddress: string): Promise<Notification[]> {
    const notifications = await this.notificationRepository.find({
      where: { recipient_wallet_address: recipientWalletAddress },
      order: { created_at: 'DESC' },
      relations: ['sender', 'recipient'],
    });
    return notifications;
  }

  async findUnread(recipientWalletAddress: string): Promise<Notification[]> {
    const unreadNotifications = await this.notificationRepository.find({
      where: {
        recipient_wallet_address: recipientWalletAddress,
        is_read: false
      },
      order: { created_at: 'DESC' },
      relations: ['sender', 'recipient'],
    });

    console.log('unreadNotifications', unreadNotifications);
    return unreadNotifications;
  }

  async markAsRead(id: string, recipientWalletAddress: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, recipient_wallet_address: recipientWalletAddress },
      relations: ['sender', 'recipient'],
    });

    if (!notification) {
      throw new NotFoundException(`Notification not found`);
    }

    notification.is_read = true;
    const savedNotification = await this.notificationRepository.save(notification);
    console.log('savedNotification', savedNotification);
    return savedNotification;
  }

  async markAllAsRead(recipientWalletAddress: string): Promise<Notification[]> {
    await this.notificationRepository.update(
      { recipient_wallet_address: recipientWalletAddress, is_read: false },
      { is_read: true },
      // { relations: ['sender', 'recipient'] }
    );

    return this.findUnread(recipientWalletAddress);
  }

  async remove(id: string, recipientWalletAddress: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, recipient_wallet_address: recipientWalletAddress },
      relations: ['sender', 'recipient'],
    });

    if (!notification) {
      console.log('notification not found');
      throw new NotFoundException(`Notification not found`);
    }
    const deletedNotification = await this.notificationRepository.delete({
      id,
      recipient_wallet_address: recipientWalletAddress,
    });

    console.log("deleted")

    return notification
  }

  // Helper methods for different notification types
  async notifyFriendRequest(senderWalletAddress: string, recipientWalletAddress: string): Promise<Notification> {
    return this.create(
      recipientWalletAddress,
      NotificationType.FRIEND_REQUEST_RECEIVED,
      `New friend request from ${senderWalletAddress}`,
      senderWalletAddress,
      { action: 'friend_request ' }
    );
  }

  async notifyFriendRequestAccepted(senderWalletAddress: string, recipientWalletAddress: string): Promise<Notification> {
    return this.create(
      recipientWalletAddress,
      NotificationType.FRIEND_REQUEST_ACCEPTED,
      `${senderWalletAddress} accepted your friend request`,
      senderWalletAddress,
      { action: 'friend_accepted' }
    );
  }

  async notifyNewChatMessage(
    senderWalletAddress: string,
    recipientWalletAddress: string,
    messagePreview: string,
  ): Promise<Notification> {
    return this.create(
      recipientWalletAddress,
      NotificationType.NEW_CHAT_MESSAGE,
      `New message from ${senderWalletAddress}: ${messagePreview}`,
      senderWalletAddress,
      { action: 'chat_message' }
    );
  }

  async notifyNewCommunityMessage(
    senderWalletAddress: string,
    communityChatId: string,
    communityName: string,
    messagePreview: string,
  ): Promise<Notification> {
    return this.create(
      senderWalletAddress,
      NotificationType.NEW_COMMUNITY_MESSAGE,
      `New message in ${communityName}: ${messagePreview}`,
      senderWalletAddress,
      {
        action: 'community_message',
        communityChatId
      }
    );
  }

  async notifyTokenCreated(
    creatorWalletAddress: string,
    tokenName: string,
    tokenId: string,
  ): Promise<Notification> {
    return this.create(
      creatorWalletAddress,
      NotificationType.TOKEN_CREATED,
      `Token "${tokenName}" has been created successfully`,
      creatorWalletAddress,
      {
        action: 'token_created',
        tokenId
      }
    );
  }

  async notifyCommunityChatCreated(
    creatorWalletAddress: string,
    communityName: string,
    communityChatId: string,
  ): Promise<Notification> {
    return this.create(
      creatorWalletAddress,
      NotificationType.COMMUNITY_CHAT_CREATED,
      `Community chat "${communityName}" has been created`,
      creatorWalletAddress,
      {
        action: 'community_chat_created',
        communityChatId
      }
    );
  }
}
