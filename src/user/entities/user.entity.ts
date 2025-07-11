import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserSocial } from '../../user-socials/entities/user-social.entity';
import { UserToken } from '../../user-tokens/entities/user-token.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    id: string;

    @Column({ unique: true, nullable: false })
    @ApiProperty({ example: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' })
    walletAddress: string;

    @Column({ nullable: true })
    @ApiProperty({ example: 'John Doe', required: false })
    username?: string;

    @OneToMany(() => UserSocial, userSocial => userSocial.user, { eager: true })
    userSocials: UserSocial[];

    @OneToMany(() => UserToken, userToken => userToken.creator)
    userTokens: UserToken[];

    @CreateDateColumn()
    @ApiProperty()
    createdAt: Date;

    @UpdateDateColumn()
    @ApiProperty()
    updatedAt: Date;
}
