import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { CommunityChat } from './community-chat.entity';
import { EncryptionParams } from '../../common/services/encryption.service';

@Entity('community_chat_messages')
export class CommunityChatMessage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    community_chat_id: string;

    @Column()
    sender_wallet_address: string;

    @Column('text')
    content: string;

    @Column({ nullable: true })
    encryption_key: string;

    @Column({ default: false })
    is_encrypted: boolean;

    @Column('jsonb', { nullable: true })
    encryption_params: EncryptionParams;

    @CreateDateColumn()
    created_at: Date;

    @ManyToOne(() => CommunityChat, communityChat => communityChat.messages)
    @JoinColumn({ name: 'community_chat_id' })
    community_chat: CommunityChat;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'sender_wallet_address', referencedColumnName: 'walletAddress' })
    sender: User;
} 