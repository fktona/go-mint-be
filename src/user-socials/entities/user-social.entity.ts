import { SocialProvider } from 'src/common/enum';
import { User } from '../../user/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index, Unique } from 'typeorm';

@Entity('user_socials')
@Unique(['userId', 'provider']) // Updated unique constraint
export class UserSocial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.userSocials, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' }) // Use primary key relationship
  user: User;

  @Column({ name: 'user_id', type: 'uuid' }) // Add explicit column for foreign key
  userId: string;

  @Column({ type: "varchar", default: "0xe" })
  walletAddress: string;

  @Column({
    type: 'enum',
    enum: SocialProvider,
    nullable: true
  })
  provider: SocialProvider;

  @Column({ name: 'provider_id' })
  providerId: string; // The ID from the provider (GitHub ID, Twitter ID, etc.)

  @Column({ name: 'access_token', type: 'text', nullable: true })
  accessToken: string;

  @Column({ name: 'refresh_token', type: 'text', nullable: true })
  refreshToken: string | null;

  @Column({ name: 'token_expires_at', nullable: true, type: 'timestamp' })
  tokenExpiresAt: Date | null;

  @Column({ name: 'profile_url', nullable: true, type: 'varchar' })
  profileUrl: string | null;

  @Column({ name: 'username', nullable: true, type: 'varchar' })
  @Index()
  username: string | null;

  @Column({ name: 'bio', nullable: true, type: 'varchar' })
  bio: string | null;

  @Column({ name: 'display_name', nullable: true, type: 'varchar' })
  displayName: string | null;

  @Column({ name: 'follower_count', nullable: true, type: 'int' })
  followerCount: number | null;

  @Column({ name: 'following_count', nullable: true, type: 'int' })
  followingCount: number | null;



  @Column({ name: 'avatar_url', nullable: true, type: 'varchar' })
  avatarUrl: string | null;

  @Column({ name: 'cover_url', nullable: true, type: 'varchar' })
  coverUrl: string | null;

  @Column({ name: 'website_url', nullable: true, type: 'varchar' })
  websiteUrl: string | null;

  @Column({ name: 'location', nullable: true, type: 'varchar' })
  location: string | null;

  @Column({ name: 'is_verified', nullable: true, type: 'boolean' })
  isVerified: boolean | null;


  @Column({ name: 'email', nullable: true, type: 'varchar' })
  @Index()
  email: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}