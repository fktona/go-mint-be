import { Injectable, NotFoundException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserTokenDto } from './dto/create-user-token.dto';
import { UpdateUserTokenDto } from './dto/update-user-token.dto';
import { TokenPurpose, UserToken } from './entities/user-token.entity';
import { UserService } from '../user/user.service';
import { CommunityChatService } from '../community-chat/community-chat.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/enums/notification-type.enum';

@Injectable()
export class UserTokensService {
  constructor(
    @InjectRepository(UserToken)
    private readonly userTokenRepository: Repository<UserToken>,
    private readonly userService: UserService,
    @Inject(forwardRef(() => CommunityChatService))
    private readonly communityChatService: CommunityChatService,
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService: NotificationService,
  ) { }

  async create(createUserTokenDto: CreateUserTokenDto): Promise<UserToken> {
    // Check if user exists
    const creator = await this.userService.findOne(createUserTokenDto.creator_id);

    // Check if token address already exists
    const existingToken = await this.userTokenRepository.findOne({
      where: { tokenAddress: createUserTokenDto.tokenAddress },
    });

    const userHasToken = await this.userTokenRepository.findOne({
      where: { creator_id: creator.id },
    });

    if (userHasToken) {
      throw new ConflictException('User already has a token');
    }

    if (existingToken) {
      throw new ConflictException('Token with this address already exists');
    }

    const userToken = this.userTokenRepository.create(createUserTokenDto);
    const savedToken = await this.userTokenRepository.save(userToken);

    // Create community chat for the token
    if (createUserTokenDto.purpose === TokenPurpose.COMMUNITY) {
      await this.communityChatService.createForToken(savedToken.id, creator.walletAddress);
    }

    // Send notification for token creation
    await this.notificationService.create(
      creator.walletAddress,
      NotificationType.TOKEN_CREATED,
      `Token '${savedToken.tokenName}' created successfully!`,
      creator.walletAddress,
      {
        action: 'token_created',
        tokenId: savedToken.id,
      }
    );

    return savedToken;
  }

  async findAll(): Promise<UserToken[]> {
    return this.userTokenRepository.find({
      relations: ['creator'],
    });
  }

  async findOne(id: string): Promise<UserToken> {
    const userToken = await this.userTokenRepository.findOne({
      where: { id },
      relations: ['creator'],
    });

    if (!userToken) {
      throw new NotFoundException(`User token with ID ${id} not found`);
    }

    return userToken;
  }

  async findByCreator(creatorId: string): Promise<UserToken[]> {
    // Check if user exists
    await this.userService.findOne(creatorId);

    return this.userTokenRepository.find({
      where: { creator_id: creatorId },
      relations: ['creator'],
    });
  }

  async update(id: string, updateUserTokenDto: UpdateUserTokenDto): Promise<UserToken> {
    const userToken = await this.findOne(id);

    if (updateUserTokenDto.creator_id) {
      // Check if new creator exists
      await this.userService.findOne(updateUserTokenDto.creator_id);
    }

    if (updateUserTokenDto.tokenAddress) {
      // Check if new token address already exists
      const existingToken = await this.userTokenRepository.findOne({
        where: { tokenAddress: updateUserTokenDto.tokenAddress },
      });

      if (existingToken && existingToken.id !== id) {
        throw new ConflictException('Token with this address already exists');
      }
    }

    Object.assign(userToken, updateUserTokenDto);
    const updatedToken = await this.userTokenRepository.save(userToken);

    // Send notification for token update
    await this.notificationService.create(
      updatedToken.creator.walletAddress,
      NotificationType.TOKEN_UPDATED,
      `Token '${updatedToken.tokenName}' updated successfully!`,
      updatedToken.creator.walletAddress,
      {
        action: 'token_updated',
        tokenId: updatedToken.id,
      }
    );

    return updatedToken;
  }

  async remove(id: string): Promise<void> {
    const userToken = await this.findOne(id);
    await this.userTokenRepository.remove(userToken);

    // Send notification for token deletion
    await this.notificationService.create(
      userToken.creator.walletAddress,
      NotificationType.TOKEN_DELETED,
      `Token '${userToken.tokenName}' deleted successfully!`,
      userToken.creator.walletAddress,
      {
        action: 'token_deleted',
        tokenId: userToken.id,
      }
    );
  }
}
