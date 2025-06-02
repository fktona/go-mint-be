import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FriendsService } from './friends.service';
import { CreateFriendDto } from './dto/create-friend.dto';
import { UpdateFriendDto } from './dto/update-friend.dto';
import { Friend } from './entities/friend.entity';
import { ResponseUtil } from '../common/utils/response.util';
import { ResponseInterface } from '../common/interfaces/response.interface';
import { FriendListItemDto } from './dto/friend-response.dto';
import { FriendResponseDto } from './dto/friend-response.dto';
import { RelationshipStatusDto } from './dto/relationship-status.dto';

@ApiTags('friends')
@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) { }

  @Post()
  @ApiOperation({ summary: 'Send a friend request' })
  @ApiResponse({ status: 201, description: 'Friend request sent successfully', type: Friend })
  @ApiResponse({ status: 409, description: 'Friend request already exists or user is blocked' })
  async create(@Body() createFriendDto: CreateFriendDto): Promise<ResponseInterface<Friend>> {
    const friend = await this.friendsService.create(createFriendDto.sender_wallet_address, createFriendDto);
    return ResponseUtil.success(friend, 'Friend request sent successfully');
  }


  @Get('relationship')
  @ApiOperation({ summary: 'Check relationship status with another user' })
  @ApiResponse({ status: 200, description: 'Returns the relationship status', type: RelationshipStatusDto })
  async checkRelationshipStatus(
    @Query('walletAddress') walletAddress: string,
    @Query('targetWalletAddress') targetWalletAddress: string,
  ): Promise<ResponseInterface<RelationshipStatusDto>> {
    const status = await this.friendsService.checkRelationshipStatus(walletAddress, targetWalletAddress);
    console.log(status);
    return ResponseUtil.success(status, 'Relationship status retrieved successfully');
  }

  @Delete('cancel-request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a sent friend request' })
  @ApiResponse({ status: 200, description: 'Friend request cancelled successfully' })
  @ApiResponse({ status: 404, description: 'No pending friend request found' })
  async cancelFriendRequest(
    @Query('senderWalletAddress') senderWalletAddress: string,
    @Query('receiverWalletAddress') receiverWalletAddress: string,
  ): Promise<ResponseInterface<null>> {
    await this.friendsService.cancelFriendRequest(senderWalletAddress, receiverWalletAddress);
    return ResponseUtil.success(null, 'Friend request cancelled successfully');
  }

  @Get(':walletAddress')
  @ApiOperation({ summary: 'Get all friends' })
  @ApiResponse({ status: 200, description: 'Return all friends', type: [FriendListItemDto] })
  async findAll(@Param('walletAddress') walletAddress: string): Promise<ResponseInterface<FriendListItemDto[]>> {
    const friends = await this.friendsService.findAll(walletAddress);
    return ResponseUtil.success(friends, 'Friends retrieved successfully');
  }

  @Get('pending/:walletAddress')
  @ApiOperation({ summary: 'Get pending friend requests' })
  @ApiResponse({ status: 200, description: 'Return pending friend requests', type: [Friend] })
  async findPendingRequests(@Param('walletAddress') walletAddress: string): Promise<ResponseInterface<Friend[]>> {
    const requests = await this.friendsService.findPendingRequests(walletAddress);
    return ResponseUtil.success(requests, 'Pending requests retrieved successfully');
  }

  @Get('sent/:walletAddress')
  @ApiOperation({ summary: 'Get sent friend requests' })
  @ApiResponse({ status: 200, description: 'Return sent friend requests', type: [Friend] })
  async findSentRequests(@Param('walletAddress') walletAddress: string): Promise<ResponseInterface<Friend[]>> {
    const requests = await this.friendsService.findSentRequests(walletAddress);
    return ResponseUtil.success(requests, 'Sent requests retrieved successfully');
  }

  @Get('blocked/:walletAddress')
  @ApiOperation({ summary: 'Get blocked users' })
  @ApiResponse({ status: 200, description: 'Return blocked users', type: [Friend] })
  async findBlockedUsers(@Param('walletAddress') walletAddress: string): Promise<ResponseInterface<Friend[]>> {
    const blocked = await this.friendsService.findBlockedUsers(walletAddress);
    return ResponseUtil.success(blocked, 'Blocked users retrieved successfully');
  }

  @Get('request/:id')
  @ApiOperation({ summary: 'Get a specific friendship' })
  @ApiResponse({ status: 200, description: 'Return the friendship', type: Friend })
  @ApiResponse({ status: 404, description: 'Friendship not found' })
  async findOne(@Param('id') id: string): Promise<ResponseInterface<Friend>> {
    const friend = await this.friendsService.findOne(id);
    return ResponseUtil.success(friend, 'Friendship retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update friendship status (accept/reject)' })
  @ApiResponse({ status: 200, description: 'Friendship status updated successfully', type: Friend })
  @ApiResponse({ status: 404, description: 'Friendship not found' })
  async update(
    @Param('id') id: string,
    @Body() updateFriendDto: UpdateFriendDto,
  ): Promise<ResponseInterface<Friend>> {
    const friend = await this.friendsService.update(id, updateFriendDto.sender_wallet_address, updateFriendDto);
    return ResponseUtil.success(friend, 'Friendship status updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a friendship' })
  @ApiResponse({ status: 204, description: 'Friendship removed successfully' })
  @ApiResponse({ status: 404, description: 'Friendship not found' })
  async remove(
    @Param('id') id: string,
    @Body('walletAddress') walletAddress: string
  ): Promise<ResponseInterface<null>> {
    await this.friendsService.remove(id, walletAddress);
    return ResponseUtil.success(null, 'Friendship removed successfully');
  }

  @Post('block')
  @ApiOperation({ summary: 'Block a user' })
  @ApiResponse({ status: 201, description: 'User blocked successfully', type: Friend })
  @ApiResponse({ status: 404, description: 'User not found' })
  async blockUser(
    @Body('senderWalletAddress') senderWalletAddress: string,
    @Body('targetWalletAddress') targetWalletAddress: string
  ): Promise<ResponseInterface<Friend>> {
    const friend = await this.friendsService.blockUser(senderWalletAddress, targetWalletAddress);
    return ResponseUtil.success(friend, 'User blocked successfully');
  }



}






