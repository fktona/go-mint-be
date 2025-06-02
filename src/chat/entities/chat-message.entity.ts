import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { EncryptionParams } from '../../common/services/encryption.service';

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

    @Column({ nullable: true })
    encryption_key: string;

    @Column({ default: false })
    is_encrypted: boolean;

    @Column('jsonb', { nullable: true })
    encryption_params: EncryptionParams;

    @CreateDateColumn()
    created_at: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'sender_wallet_address', referencedColumnName: 'walletAddress' })
    sender: User;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'receiver_wallet_address', referencedColumnName: 'walletAddress' })
    receiver: User;
} 