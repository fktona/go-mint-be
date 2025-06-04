import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { FriendStatus } from '../enums/friend-status.enum';

@Entity('friends')
export class Friend {
    @PrimaryGeneratedColumn('uuid')
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    id: string;

    @Column({ name: 'sender_wallet_address' })
    @ApiProperty({
        example: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        description: 'Wallet address of the sender'
    })
    sender_wallet_address: string;

    @Column({ name: 'receiver_wallet_address' })
    @ApiProperty({
        example: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        description: 'Wallet address of the receiver'
    })
    receiver_wallet_address: string;

    @Column({
        type: 'enum',
        enum: FriendStatus,
        default: FriendStatus.PENDING
    })
    @ApiProperty({
        enum: FriendStatus,
        example: FriendStatus.PENDING,
        description: 'Status of the friendship'
    })
    status: FriendStatus;

    @Column({ nullable: true })
    @ApiProperty({
        example: 'Hey, let\'s connect!',
        description: 'Message sent with the friend request',
        required: false
    })
    message?: string;

    @CreateDateColumn({ name: 'created_at' })
    @ApiProperty()
    created_at: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    @ApiProperty()
    updated_at: Date;
}
