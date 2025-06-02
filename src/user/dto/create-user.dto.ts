import { ApiProperty } from '@nestjs/swagger';
import {  IsOptional, IsString } from 'class-validator';
import { IsSolanaAddress } from 'src/common/validators/is-solana-address.validator';

export class CreateUserDto {
    @ApiProperty({
        example: '7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1M',
        description: 'The wallet address of the user',
    })
    @IsSolanaAddress()
    walletAddress: string;

    @ApiProperty({
        example: 'John Doe',
        description: 'The username of the user',
        required: false,
    })
    @IsString()
    @IsOptional()
    username?: string;
}
