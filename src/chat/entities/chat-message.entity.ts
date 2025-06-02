import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('chat_messages')
export class ChatMessage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    sender_wallet_address: string;

    @Column()
    receiver_wallet_address: string;

    @Column('text')
    content: string;

    @Column({ default: false })
    is_read: boolean;

    @CreateDateColumn()
    created_at: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'sender_wallet_address', referencedColumnName: 'walletAddress' })
    sender: User;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'receiver_wallet_address', referencedColumnName: 'walletAddress' })
    receiver: User;
} 