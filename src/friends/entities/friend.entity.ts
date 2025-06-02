import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum FriendStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
    BLOCKED = 'BLOCKED'
}

@Entity('friends')
export class Friend {
    @PrimaryGeneratedColumn('uuid')
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    id: string;

    @Column()
    @ApiProperty({
        example: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        description: 'Wallet address of the sender'
    })
    sender_wallet_address: string;

    @Column()
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

    @CreateDateColumn()
    @ApiProperty()
    createdAt: Date;

    @UpdateDateColumn()
    @ApiProperty()
    updatedAt: Date;
}
