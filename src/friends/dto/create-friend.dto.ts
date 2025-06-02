import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { IsSolanaAddress } from 'src/common/validators/is-solana-address.validator';

export class CreateFriendDto {
    @ApiProperty({
        example: '7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1M',
        description: 'Wallet address of the sender',
    })
    @IsSolanaAddress()
    sender_wallet_address: string;

    @ApiProperty({
        example: '7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1M',
        description: 'Wallet address of the user to send friend request to',
    })
    @IsSolanaAddress()
    receiver_wallet_address: string;

    @ApiProperty({
        example: 'Hey, let\'s connect!',
        description: 'Optional message to send with the friend request',
        required: false,
    })
    @IsString()
    @IsOptional()
    message?: string;
}
