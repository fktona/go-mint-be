import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { IsSolanaAddress } from 'src/common/validators/is-solana-address.validator';
import { FriendStatus } from '../enums/friend-status.enum';

export class UpdateFriendDto {
    @ApiProperty({
        example: '7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1M',
        description: 'Wallet address of the sender',
    })
    @IsSolanaAddress()
    sender_wallet_address: string;

    @ApiProperty({
        enum: FriendStatus,
        example: FriendStatus.ACCEPTED,
        description: 'New status of the friendship'
    })
    @IsEnum(FriendStatus)
    status: FriendStatus;
}
