import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { UserToken } from '../../user-tokens/entities/user-token.entity';
import { User } from '../../user/entities/user.entity';
import { CommunityChatMessage } from './community-chat-message.entity';

@Entity('community_chats')
export class CommunityChat {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    token_id: string;

    @Column()
    creator_wallet_address: string;

    @Column({ default: true })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;

    @ManyToOne(() => UserToken)
    @JoinColumn({ name: 'token_id' })
    token: UserToken;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'creator_wallet_address', referencedColumnName: 'walletAddress' })
    creator: User;

    @OneToMany(() => CommunityChatMessage, message => message.community_chat)
    messages: CommunityChatMessage[];
}
