import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './entities/chat-message.entity';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { FriendsService } from '../friends/friends.service';
import { UserService } from '../user/user.service';
import { EncryptionService } from '../common/services/encryption.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    private readonly friendsService: FriendsService,
    private readonly userService: UserService,
    private readonly encryptionService: EncryptionService,
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService: NotificationService,
  ) { }

  async createMessage(senderWalletAddress: string, createChatMessageDto: CreateChatMessageDto): Promise<ChatMessage> {
    // Check if users exist
    await this.userService.findByWalletAddress(senderWalletAddress);
    await this.userService.findByWalletAddress(createChatMessageDto.receiver_wallet_address);

    // Check if sender is blocked by receiver
    const blockedUsers = await this.friendsService.findBlockedUsers(createChatMessageDto.receiver_wallet_address);
    const isBlocked = blockedUsers.some(
      (block) => block.sender_wallet_address === senderWalletAddress || block.receiver_wallet_address === senderWalletAddress
    );

    if (isBlocked) {
      throw new BadRequestException('Cannot send message to a user who has blocked you');
    }

    // Generate encryption key for this message
    const encryptionKey = this.encryptionService.generateKey();

    // Encrypt the message content
    const encrypted = this.encryptionService.encrypt(createChatMessageDto.content, encryptionKey);

    const message = this.chatMessageRepository.create({
      sender_wallet_address: senderWalletAddress,
      receiver_wallet_address: createChatMessageDto.receiver_wallet_address,
      content: encrypted.encryptedContent,
      encryption_key: encryptionKey,
      is_encrypted: true,
      encryption_salt: encrypted.salt,
      encryption_iv: encrypted.iv,
      encryption_tag: encrypted.tag,
    });

    return this.chatMessageRepository.save(message);
  }

  async getConversation(walletAddress1: string, walletAddress2: string): Promise<ChatMessage[]> {
    return this.chatMessageRepository.find({
      where: [
        { sender_wallet_address: walletAddress1, receiver_wallet_address: walletAddress2 },
        { sender_wallet_address: walletAddress2, receiver_wallet_address: walletAddress1 },
      ],
      order: { created_at: 'ASC' },
    });
  }

  async markMessageAsRead(messageId: string, walletAddress: string): Promise<ChatMessage> {
    const message = await this.chatMessageRepository.findOne({
      where: { id: messageId, receiver_wallet_address: walletAddress },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    message.is_read = true;
    return this.chatMessageRepository.save(message);
  }

  async getUnreadMessages(walletAddress: string): Promise<ChatMessage[]> {
    return this.chatMessageRepository.find({
      where: { receiver_wallet_address: walletAddress, is_read: false },
      order: { created_at: 'DESC' },
    });
  }
}
