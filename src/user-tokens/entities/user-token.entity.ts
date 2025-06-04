import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, DeleteDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity';

export enum TokenPurpose {
    COMMUNITY = 'COMMUNITY',
    PERSONAL = 'PERSONAL'
}

@Entity('user_tokens')
export class UserToken {
    @PrimaryGeneratedColumn('uuid')
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    id: string;

    @Column()
    @ApiProperty({ example: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' })
    tokenAddress: string;

    @Column({ nullable: true })
    @ApiProperty({ example: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' })
    tokenName: string;

    @Column({ nullable: true })
    @ApiProperty({ example: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' })
    tokenSymbol: string;

    @Column({
        type: 'enum',
        enum: TokenPurpose,
        default: TokenPurpose.PERSONAL
    })
    @ApiProperty({
        enum: TokenPurpose,
        example: TokenPurpose.COMMUNITY,
        description: 'Purpose of the token (COMMUNITY or PERSONAL)'
    })
    purpose: TokenPurpose;

    @Column({ nullable: true })
    @ApiProperty({
        example: 'Community Governance Token',
        description: 'Description of the token',
        required: false
    })
    description?: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'creator_id' })
    @ApiProperty({ type: () => User })
    creator: User;

    @Column()
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    creator_id: string;

    @CreateDateColumn()
    @ApiProperty()
    createdAt: Date;

    @UpdateDateColumn()
    @ApiProperty()
    updatedAt: Date;

    @DeleteDateColumn()
    @ApiProperty()
    deletedAt: Date;
}
