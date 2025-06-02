import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateActivityDto {
    @ApiProperty({ description: 'Wallet address of the user' })
    @IsString()
    @IsNotEmpty()
    walletAddress: string;

    @ApiProperty({ description: 'Type of activity (e.g., FRIEND_REQUEST, PROFILE_UPDATE)' })
    @IsString()
    @IsNotEmpty()
    type: string;

    @ApiProperty({ description: 'Description of the activity' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({ description: 'Username of the user', required: false })
    @IsString()
    @IsOptional()
    username?: string;

    @ApiProperty({ description: 'Avatar URL of the user', required: false })
    @IsString()
    @IsOptional()
    avatarUrl?: string;
}
