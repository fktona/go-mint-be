import {
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  IsSolanaAddress,
} from 'src/common/validators/is-solana-address.validator';

import { ApiProperty } from '@nestjs/swagger';


export class CreateUserTokenDto {
    @ApiProperty({
        example: '7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1M',
        description: 'The token contract address',
    })
    @IsSolanaAddress()
    tokenAddress: string;

    @ApiProperty({
        example: 'Token Name',
        description: 'The name of the token',
        required: false,
    })
    @IsString()
    @IsOptional()
    tokenName?: string;

    @ApiProperty({
        example: 'TKN',
        description: 'The symbol of the token',
        required: false,
    })
    @IsString()
    @IsOptional()
    tokenSymbol?: string;

    @ApiProperty({
        example: 'launch',
        description: 'Purpose of the token (COMMUNITY or PERSONAL)',
    })
    @IsString()
    purpose: string;

    @ApiProperty({
        example: 'Description of the token',
        description: 'Description of the token',
        required: false,
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID of the user creating the token',
    })
    @IsUUID()
    creator_id: string;
}
