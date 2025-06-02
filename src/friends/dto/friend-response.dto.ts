import { ApiProperty } from '@nestjs/swagger';
import { Friend } from '../entities/friend.entity';

export class FriendResponseDto extends Friend {
    @ApiProperty({
        example: 'John Doe',
        description: 'Username of the friend',
        required: false,
        nullable: true
    })
    username?: string | null;

    @ApiProperty({
        example: 'https://example.com/avatar.jpg',
        description: 'Avatar URL of the friend from their social platform',
        required: false,
        nullable: true
    })
    avatarUrl?: string | null;

    @ApiProperty({
        example: 'twitter',
        description: 'Social platform of the friend',
        required: false,
        nullable: true
    })
    platform?: string | null;
}

export class FriendListItemDto {
    @ApiProperty({
        example: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        description: 'Wallet address of the friend'
    })
    wallet_address: string;

    @ApiProperty({
        example: 'John Doe',
        description: 'Username of the friend',
        required: false,
        nullable: true
    })
    username?: string | null;

    @ApiProperty({
        example: 'https://example.com/avatar.jpg',
        description: 'Avatar URL of the friend from their social platform',
        required: false,
        nullable: true
    })
    avatarUrl?: string | null;

    @ApiProperty({
        example: 'twitter',
        description: 'Social platform of the friend',
        required: false,
        nullable: true
    })
    platform?: string | null;
} 