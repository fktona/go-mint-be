import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { NotificationType } from '../enums/notification-type.enum';

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    recipient_wallet_address: string;

    @Column({ nullable: true })
    sender_wallet_address: string;

    @Column({
        type: 'enum',
        enum: NotificationType,
    })
    type: NotificationType;

    @Column('text')
    message: string;

    @Column({ default: false })
    is_read: boolean;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn()
    created_at: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'recipient_wallet_address', referencedColumnName: 'walletAddress' })
    recipient: User;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'sender_wallet_address', referencedColumnName: 'walletAddress' })
    sender: User;
}
