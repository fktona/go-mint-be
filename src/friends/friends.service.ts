import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFriendDto } from './dto/create-friend.dto';
import { UpdateFriendDto } from './dto/update-friend.dto';
import { Friend, FriendStatus } from './entities/friend.entity';
import { UserService } from '../user/user.service';
import { FriendResponseDto, FriendListItemDto } from './dto/friend-response.dto';
import { RelationshipStatusDto, RelationshipType } from './dto/relationship-status.dto';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(Friend)
    private readonly friendRepository: Repository<Friend>,
    private readonly userService: UserService,
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
      message: createFriendDto.message,
    });

    return this.friendRepository.save(friend);
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

    return this.friendRepository.save(friendship);
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
}
