import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommunityChat } from './entities/community-chat.entity';
import { CommunityChatMessage } from './entities/community-chat-message.entity';
import { UserService } from '../user/user.service';
import { UserToken } from '../user-tokens/entities/user-token.entity';
import { EncryptionService } from '../common/services/encryption.service';

@Injectable()
export class CommunityChatService {
  constructor(
    @InjectRepository(CommunityChat)
    private readonly communityChatRepository: Repository<CommunityChat>,
    @InjectRepository(CommunityChatMessage)
    private readonly communityChatMessageRepository: Repository<CommunityChatMessage>,
    @InjectRepository(UserToken)
    private readonly userTokenRepository: Repository<UserToken>,
    private readonly userService: UserService,
    private readonly encryptionService: EncryptionService,
  ) { }

  async createForToken(tokenId: string, creatorWalletAddress: string): Promise<CommunityChat> {
    // Check if token exists
    const token = await this.userTokenRepository.findOne({
      where: { id: tokenId },
    });

    if (!token) {
      throw new NotFoundException('Token not found');
    }

    // Check if user exists
    await this.userService.findByWalletAddress(creatorWalletAddress);

    // Check if community chat already exists for this token
    const existingChat = await this.communityChatRepository.findOne({
      where: { token_id: tokenId },
    });

    if (existingChat) {
      throw new BadRequestException('Community chat already exists for this token');
    }

    const communityChat = this.communityChatRepository.create({
      name: `${token.tokenName} Community`,
      token_id: tokenId,
      creator_wallet_address: creatorWalletAddress,
    });

    return this.communityChatRepository.save(communityChat);
  }

  async findAll(): Promise<CommunityChat[]> {
    return this.communityChatRepository.find({
      where: { is_active: true },
      relations: ['token', 'creator'],
    });
  }

  async findOne(id: string): Promise<CommunityChat> {
    const chat = await this.communityChatRepository.findOne({
      where: { id, is_active: true },
      relations: ['token', 'creator'],
    });

    if (!chat) {
      throw new NotFoundException('Community chat not found');
    }

    return chat;
  }

  async findByTokenId(tokenId: string): Promise<CommunityChat> {
    const chat = await this.communityChatRepository.findOne({
      where: { token_id: tokenId, is_active: true },
      relations: ['token', 'creator'],
    });

    if (!chat) {
      throw new NotFoundException('Community chat not found for this token');
    }

    return chat;
  }

  async createMessage(chatId: string, senderWalletAddress: string, content: string): Promise<CommunityChatMessage> {
    const chat = await this.findOne(chatId);
    await this.userService.findByWalletAddress(senderWalletAddress);

    // Generate encryption key for this message
    const encryptionKey = this.encryptionService.generateKey();

    // Encrypt the message content
    const encryptionParams = this.encryptionService.encrypt(content, encryptionKey);

    const message = this.communityChatMessageRepository.create({
      community_chat_id: chatId,
      sender_wallet_address: senderWalletAddress,
      content: content, // Store original content for backward compatibility
      encryption_key: encryptionKey,
      is_encrypted: true,
      encryption_params: encryptionParams,
    });

    return this.communityChatMessageRepository.save(message);
  }

  async getMessages(chatId: string): Promise<CommunityChatMessage[]> {
    await this.findOne(chatId);

    return this.communityChatMessageRepository.find({
      where: { community_chat_id: chatId },
      relations: ['sender'],
      order: { created_at: 'ASC' },
    });
  }

  async deactivateChat(id: string, creatorWalletAddress: string): Promise<void> {
    const chat = await this.findOne(id);

    if (chat.creator_wallet_address !== creatorWalletAddress) {
      throw new BadRequestException('Only the creator can deactivate the chat');
    }

    chat.is_active = false;
    await this.communityChatRepository.save(chat);
  }
}
