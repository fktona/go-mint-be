import { IsString, IsNotEmpty } from 'class-validator';

export class CreateChatMessageDto {
    @IsString()
    @IsNotEmpty()
    receiver_wallet_address: string;

    @IsString()
    @IsNotEmpty()
    content: string;
} 