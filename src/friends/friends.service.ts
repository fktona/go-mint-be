import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFriendDto } from './dto/create-friend.dto';
import { UpdateFriendDto } from './dto/update-friend.dto';
import { Friend } from './entities/friend.entity';
import { UserService } from '../user/user.service';
import { FriendResponseDto, FriendListItemDto } from './dto/friend-response.dto';
import { RelationshipStatusDto, RelationshipType } from './dto/relationship-status.dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/enums/notification-type.enum';
import { FriendStatus } from './enums/friend-status.enum';
import { NotificationGateway } from '../notification/notification.gateway';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(Friend)
    private readonly friendRepository: Repository<Friend>,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
    private readonly notificationGateway: NotificationGateway,
  ) { }

  async create(senderWalletAddress: string, createFriendDto: CreateFriendDto): Promise<Friend> {
    console.log(senderWalletAddress, createFriendDto);

    // Check if users exist
    await this.userService.findByWalletAddress(senderWalletAddress);
    await this.userService.findByWalletAddress(createFriendDto.receiver_wallet_address);

    // Check if sender and receiver are the same
    if (senderWalletAddress === createFriendDto.receiver_wallet_address) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    // Check if friendship already exists
    const existingFriendship = await this.friendRepository.findOne({
      where: [
        { sender_wallet_address: senderWalletAddress, receiver_wallet_address: createFriendDto.receiver_wallet_address },
        { sender_wallet_address: createFriendDto.receiver_wallet_address, receiver_wallet_address: senderWalletAddress },
      ],
    });

    if (existingFriendship) {
      if (existingFriendship.status === FriendStatus.BLOCKED) {
        throw new ConflictException('Cannot send friend request to a blocked user');
      }
      if (existingFriendship.status === FriendStatus.ACCEPTED) {
        throw new ConflictException('Friendship already exists');
      }
      if (existingFriendship.status === FriendStatus.PENDING) {
        throw new ConflictException('Friend request already pending');
      }
    }

    const friend = this.friendRepository.create({
      sender_wallet_address: senderWalletAddress,
      receiver_wallet_address: createFriendDto.receiver_wallet_address,
      status: FriendStatus.PENDING,
    });

    const savedFriend = await this.friendRepository.save(friend);

    // Send notification for friend request
    const notification = await this.notificationService.create(
      createFriendDto.receiver_wallet_address,
      NotificationType.FRIEND_REQUEST_RECEIVED,
      `New friend request from ${senderWalletAddress}`,
      senderWalletAddress,
      { action: 'friend_request' }
    );

    this.notificationGateway.emitNewNotification(notification);

    return savedFriend;
  }

  private async enhanceFriendWithUserDetails(friend: Friend): Promise<FriendResponseDto> {
    const otherWalletAddress = friend.sender_wallet_address === friend.receiver_wallet_address
      ? friend.receiver_wallet_address
      : friend.sender_wallet_address;

    try {
      const user = await this.userService.findByWalletAddress(otherWalletAddress);
      const userSocial = user.userSocials?.[0]; // Get the first social connection

      return {
        ...friend,
        username: user.username || userSocial?.username || null,
        avatarUrl: userSocial?.avatarUrl || null,
        platform: userSocial?.provider || null,
      };
    } catch (error) {
      return friend;
    }
  }

  private async getFriendWalletAddress(friend: Friend, currentWalletAddress: string): Promise<string> {
    return friend.sender_wallet_address === currentWalletAddress
      ? friend.receiver_wallet_address
      : friend.sender_wallet_address;
  }

  async findAll(walletAddress: string): Promise<FriendListItemDto[]> {
    const friends = await this.friendRepository.find({
      where: [
        { sender_wallet_address: walletAddress, status: FriendStatus.ACCEPTED },
        { receiver_wallet_address: walletAddress, status: FriendStatus.ACCEPTED },
      ],
    });

    const friendList = await Promise.all(friends.map(async (friend) => {
      const friendWalletAddress = await this.getFriendWalletAddress(friend, walletAddress);
      const user = await this.userService.findByWalletAddress(friendWalletAddress);
      const userSocial = user.userSocials?.[0];

      return {
        wallet_address: friendWalletAddress,
        username: user.username || userSocial?.username || null,
        avatarUrl: userSocial?.avatarUrl || null,
        platform: userSocial?.provider || null,
      };
    }));

    return friendList;
  }

  async findPendingRequests(walletAddress: string): Promise<FriendResponseDto[]> {
    const requests = await this.friendRepository.find({
      where: { receiver_wallet_address: walletAddress, status: FriendStatus.PENDING },
    });

    return Promise.all(requests.map(request => this.enhanceFriendWithUserDetails(request)));
  }

  async findSentRequests(walletAddress: string): Promise<FriendResponseDto[]> {
    const requests = await this.friendRepository.find({
      where: { sender_wallet_address: walletAddress, status: FriendStatus.PENDING },
    });

    return Promise.all(requests.map(request => this.enhanceFriendWithUserDetails(request)));
  }

  async findBlockedUsers(walletAddress: string): Promise<FriendResponseDto[]> {
    const blocked = await this.friendRepository.find({
      where: [
        { sender_wallet_address: walletAddress, status: FriendStatus.BLOCKED },
        { receiver_wallet_address: walletAddress, status: FriendStatus.BLOCKED },
      ],
    });

    return Promise.all(blocked.map(blockedUser => this.enhanceFriendWithUserDetails(blockedUser)));
  }

  async findOne(id: string): Promise<FriendResponseDto> {
    const friend = await this.friendRepository.findOne({
      where: { id },
    });

    if (!friend) {
      throw new NotFoundException(`Friendship with ID ${id} not found`);
    }

    return this.enhanceFriendWithUserDetails(friend);
  }

  async update(id: string, walletAddress: string, updateFriendDto: UpdateFriendDto): Promise<Friend> {
    const friend = await this.findOne(id);

    // Check if user is authorized to update the friendship
    if (friend.receiver_wallet_address !== walletAddress) {
      throw new BadRequestException('Only the receiver can update the friendship status');
    }

    // Prevent updating to PENDING status
    if (updateFriendDto.status === FriendStatus.PENDING) {
      throw new BadRequestException('Cannot set status to PENDING');
    }

    friend.status = updateFriendDto.status;
    return this.friendRepository.save(friend);
  }

  async remove(id: string, walletAddress: string): Promise<void> {
    const friend = await this.findOne(id);

    // Check if user is authorized to remove the friendship
    if (friend.sender_wallet_address !== walletAddress && friend.receiver_wallet_address !== walletAddress) {
      throw new BadRequestException('Not authorized to remove this friendship');
    }

    await this.friendRepository.remove(friend);
  }

  async blockUser(walletAddress: string, targetWalletAddress: string): Promise<Friend> {
    // Check if users exist
    await this.userService.findByWalletAddress(walletAddress);
    await this.userService.findByWalletAddress(targetWalletAddress);

    // Check if friendship exists
    let friendship = await this.friendRepository.findOne({
      where: [
        { sender_wallet_address: walletAddress, receiver_wallet_address: targetWalletAddress },
        { sender_wallet_address: targetWalletAddress, receiver_wallet_address: walletAddress },
      ],
    });

    if (!friendship) {
      friendship = this.friendRepository.create({
        sender_wallet_address: walletAddress,
        receiver_wallet_address: targetWalletAddress,
        status: FriendStatus.BLOCKED,
      });
    } else {
      friendship.status = FriendStatus.BLOCKED;
    }

    const savedFriendship = await this.friendRepository.save(friendship);

    // Send notification for block
    const notification = await this.notificationService.create(
      targetWalletAddress,
      NotificationType.FRIEND_BLOCKED,
      `${walletAddress} blocked you`,
      walletAddress,
      { action: 'friend_blocked' }
    );
    this.notificationGateway.emitNewNotification(notification);

    return savedFriendship;
  }

  async checkRelationshipStatus(userWalletAddress: string, targetWalletAddress: string): Promise<RelationshipStatusDto> {
    // Check if users exist
    await this.userService.findByWalletAddress(userWalletAddress);
    await this.userService.findByWalletAddress(targetWalletAddress);

    // Check if friendship exists
    const friendship = await this.friendRepository.findOne({
      where: [
        { sender_wallet_address: userWalletAddress, receiver_wallet_address: targetWalletAddress },
        { sender_wallet_address: targetWalletAddress, receiver_wallet_address: userWalletAddress },
      ],
    });

    if (!friendship) {
      return {
        relationshipType: RelationshipType.NONE
      };
    }

    switch (friendship.status) {
      case FriendStatus.ACCEPTED:
        return {
          relationshipType: RelationshipType.FRIENDS,
          status: friendship.status
        };
      case FriendStatus.BLOCKED:
        return {
          relationshipType: RelationshipType.BLOCKED,
          status: friendship.status
        };
      case FriendStatus.PENDING:
        if (friendship.sender_wallet_address === userWalletAddress) {
          return {
            relationshipType: RelationshipType.PENDING_OUTGOING,
            status: friendship.status,
            message: friendship.message
          };
        } else {
          return {
            relationshipType: RelationshipType.PENDING_INCOMING,
            status: friendship.status,
            message: friendship.message
          };
        }
      default:
        console.log(friendship);
        return {
          relationshipType: RelationshipType.NONE
        };
    }
  }

  async cancelFriendRequest(senderWalletAddress: string, receiverWalletAddress: string): Promise<void> {
    // Check if users exist
    await this.userService.findByWalletAddress(senderWalletAddress);
    await this.userService.findByWalletAddress(receiverWalletAddress);

    // Find the pending friend request
    const friendRequest = await this.friendRepository.findOne({
      where: {
        sender_wallet_address: senderWalletAddress,
        receiver_wallet_address: receiverWalletAddress,
        status: FriendStatus.PENDING
      }
    });

    if (!friendRequest) {
      throw new NotFoundException('No pending friend request found');
    }

    // Delete the friend request
    await this.friendRepository.remove(friendRequest);
  }

  async acceptRequest(id: string, receiverWalletAddress: string): Promise<Friend> {
    const friendRequest = await this.friendRepository.findOne({
      where: { id, receiver_wallet_address: receiverWalletAddress, status: FriendStatus.PENDING },
    });

    if (!friendRequest) {
      throw new NotFoundException('Friend request not found');
    }

    friendRequest.status = FriendStatus.ACCEPTED;
    const savedFriend = await this.friendRepository.save(friendRequest);

    // Send notification for accepted request
    const notification = await this.notificationService.create(
      friendRequest.sender_wallet_address,
      NotificationType.FRIEND_REQUEST_ACCEPTED,
      `${receiverWalletAddress} accepted your friend request`,
      receiverWalletAddress,
      { action: 'friend_accepted' }
    );

    this.notificationGateway.emitNewNotification(notification);

    return savedFriend;
  }

  async rejectRequest(id: string, receiverWalletAddress: string): Promise<void> {
    const friendRequest = await this.friendRepository.findOne({
      where: { id, receiver_wallet_address: receiverWalletAddress, status: FriendStatus.PENDING },
    });

    if (!friendRequest) {
      throw new NotFoundException('Friend request not found');
    }

    await this.friendRepository.remove(friendRequest);

    // Send notification for rejected request
    const notification = await this.notificationService.create(
      friendRequest.sender_wallet_address,
      NotificationType.FRIEND_REQUEST_REJECTED,
      `${receiverWalletAddress} rejected your friend request`,
      receiverWalletAddress,
      { action: 'friend_rejected' }
    );

    this.notificationGateway.emitNewNotification(notification);
  }

  async removeFriend(walletAddress1: string, walletAddress2: string): Promise<void> {
    const friendship = await this.friendRepository.findOne({
      where: [
        { sender_wallet_address: walletAddress1, receiver_wallet_address: walletAddress2, status: FriendStatus.ACCEPTED },
        { sender_wallet_address: walletAddress2, receiver_wallet_address: walletAddress1, status: FriendStatus.ACCEPTED },
      ],
    });

    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    await this.friendRepository.remove(friendship);

    // Send notifications to both users
    const notification1 = await this.notificationService.create(
      walletAddress1,
      NotificationType.FRIEND_REMOVED,
      `${walletAddress2} removed you from their friends`,
      walletAddress2,
      { action: 'friend_removed' }
    );

    this.notificationGateway.emitNewNotification(notification1);

    const notification2 = await this.notificationService.create(
      walletAddress2,
      NotificationType.FRIEND_REMOVED,
      `${walletAddress1} removed you from their friends`,
      walletAddress1,
      { action: 'friend_removed' }
    );

    this.notificationGateway.emitNewNotification(notification2);
  }

  async unblockUser(blockerWalletAddress: string, blockedWalletAddress: string): Promise<void> {
    const block = await this.friendRepository.findOne({
      where: {
        sender_wallet_address: blockerWalletAddress,
        receiver_wallet_address: blockedWalletAddress,
        status: FriendStatus.BLOCKED,
      },
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    await this.friendRepository.remove(block);

    // Send notification for unblock
    const notification = await this.notificationService.create(
      blockedWalletAddress,
      NotificationType.FRIEND_UNBLOCKED,
      `${blockerWalletAddress} unblocked you`,
      blockerWalletAddress,
      { action: 'friend_unblocked' }
    );

    this.notificationGateway.emitNewNotification(notification);
  }

  async findFriends(walletAddress: string): Promise<Friend[]> {
    return this.friendRepository.find({
      where: [
        { sender_wallet_address: walletAddress, status: FriendStatus.ACCEPTED },
        { receiver_wallet_address: walletAddress, status: FriendStatus.ACCEPTED },
      ],
    });
  }
}
