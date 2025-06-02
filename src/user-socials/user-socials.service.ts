import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserSocialDto } from './dto/create-user-social.dto';
import { UpdateUserSocialDto } from './dto/update-user-social.dto';
import { UserSocial } from './entities/user-social.entity';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/entities/user.entity';
import { SocialProvider } from 'src/common/enum';

@Injectable()
export class UserSocialsService {
  // In-memory state storage with expiration - in production, use Redis or database
  private oauthStateStore: Map<string, { userId: string, expiresAt: number, provider?: string }> = new Map();

  constructor(
    @InjectRepository(UserSocial)
    private readonly userSocialRepository: Repository<UserSocial>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService, // Inject JwtService for token verification
  ) {
    // Clean up expired states periodically (every 5 minutes)
    setInterval(() => this.cleanupExpiredStates(), 5 * 60 * 1000);
  }

  /**
   * Store OAuth state with user ID and set expiration
   */
  async storeOAuthState(state: string, userId: string): Promise<void> {
    // Set expiration to 15 minutes from now (900000 ms)
    const expiresAt = Date.now() + 900000;
    this.oauthStateStore.set(state, { userId, expiresAt });
  }

  /**
   * Get user ID from stored state, verifying the state is valid and not expired
   */
  async getUserIdFromState(state: string): Promise<string | null> {
    try {
      // First try to get from in-memory store (for state params passed directly)
      const storedState = this.oauthStateStore.get(state);
      if (storedState && storedState.expiresAt > Date.now()) {
        return storedState.userId;
      }

      // If not found in store, try to verify as JWT (for state that was signed)
      const decoded = await this.jwtService.verifyAsync(state);
      if (decoded && decoded.userId) {
        return decoded.userId;
      }

      // Neither approach worked
      return null;
    } catch (error) {
      console.error('Error getting user ID from state:', error);
      return null;
    }
  }

  /**
   * Clear OAuth state after it's been used
   */
  async clearOAuthState(state: string): Promise<void> {
    this.oauthStateStore.delete(state);
  }

  /**
   * Clean up expired states from the store
   */
  private cleanupExpiredStates(): void {
    const now = Date.now();
    for (const [state, data] of this.oauthStateStore.entries()) {
      if (data.expiresAt <= now) {
        this.oauthStateStore.delete(state);
      }
    }
  }

  async create(stateOrWalletAddress: string, socialData: any): Promise<UserSocial> {
    console.log('Creating social connection with state/wallet:', stateOrWalletAddress, socialData);
    try {
      // First check if this is a state parameter
      let walletAddress = stateOrWalletAddress;

      // If this has a stored state, use the associated wallet address
      const storedState = this.oauthStateStore.get(stateOrWalletAddress);
      if (storedState && storedState.userId) {
        console.log(`Found stored state, using userId ${storedState.userId} as wallet address`);
        walletAddress = storedState.userId;

        // Clean up the used state
        this.oauthStateStore.delete(stateOrWalletAddress);
      } else {
        console.log(`No stored state found for ${stateOrWalletAddress}, treating as direct wallet address`);
      }

      // Check if connection already exists
      const existingConnection = await this.userSocialRepository.findOne({
        where: {
          walletAddress,
          provider: socialData.provider
        }
      });

      const user = await this.userRepository.findOne({
        where: { walletAddress }
      });
      if (!user) {
        throw new NotFoundException(`User with wallet address ${walletAddress} not found`);
      }

      if (existingConnection) {
        console.log(`Updating existing ${socialData.provider} connection for wallet ${walletAddress}`);
        return this.update(existingConnection.id, {
          accessToken: socialData.accessToken,
          refreshToken: socialData.refreshToken,
          username: socialData.username,
          displayName: socialData.name || socialData.displayName,
          avatarUrl: socialData._json.profile_image_url_https || null,
          followerCount: socialData._json.followers_count || null,
          followingCount: socialData._json.friends_count || null,
          bio: socialData._json.description || null,
          coverUrl: socialData._json.profile_banner_url || null,
          websiteUrl: socialData._json.url || null,
          isVerified: socialData._json.verified || null,
          profileUrl: socialData.provider === 'twitter' ?
            `https://twitter.com/${socialData.username}` : null
        });

      }

      // Create new connection
      console.log(`Creating new ${socialData.provider} connection for wallet ${walletAddress}`);
      const userSocial = this.userSocialRepository.create({
        userId: user.id,
        walletAddress,
        provider: socialData.provider,
        providerId: socialData.id,
        accessToken: socialData.accessToken,
        refreshToken: socialData.refreshToken || null,
        username: socialData.username,
        displayName: socialData.name || socialData.displayName || socialData.username,
        followerCount: socialData._json.followers_count || null,
        followingCount: socialData._json.friends_count || null,
        bio: socialData._json.description || null,
        coverUrl: socialData._json.profile_banner_url || null,
        websiteUrl: socialData._json.url || null,
        isVerified: socialData._json.verified || null,
        avatarUrl: socialData._json.profile_image_url_https || null,
        email: socialData.email || null,
        profileUrl: socialData.provider === 'twitter' ?
          `https://twitter.com/${socialData.username}` : null
      });

      return await this.userSocialRepository.save(userSocial);
    } catch (error) {
      console.error('Error creating social connection:', error);
      throw new InternalServerErrorException('Failed to create social connection');
    }
  }

  async findAll(userId: string) {
    return this.userSocialRepository.find({
      where: { userId },
    });
  }

  async findByProvider(walletAddress: string, provider: SocialProvider) {
    const connection = await this.userSocialRepository.findOne({
      where: { walletAddress, provider }
    });

    if (!connection) {
      throw new NotFoundException(`No ${provider} connection found for this user`);
    }

    return connection;
  }

  async findByUsername(username: string) {
    const connection = await this.userSocialRepository.findOne({
      where: { username }
    });

    if (!connection) {
      return null;
    }

    return connection;
  }

  async update(id: string, updateUserSocialDto: Partial<UserSocial>) {
    const connection = await this.userSocialRepository.findOne({
      where: { id }
    });

    if (!connection) {
      throw new NotFoundException(`Social connection not found`);
    }

    Object.assign(connection, updateUserSocialDto);
    return await this.userSocialRepository.save(connection);
  }

  async remove(walletAddress: string, provider: SocialProvider) {
    const connection = await this.userSocialRepository.findOne({
      where: { walletAddress, provider }
    });

    if (!connection) {
      throw new NotFoundException(`No ${provider} connection found for this user`);
    }

    await this.userSocialRepository.softRemove(connection);
    return { message: `${provider} connection removed successfully` };
  }

  async storeTwitterState(userId: string): Promise<string> {
    const stateId = crypto.randomUUID(); // Generate unique ID
    this.oauthStateStore.set(stateId, {
      userId,
      provider: 'twitter',
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes expiration
    });
    console.log("Stored Twitter state:", stateId, userId);
    return stateId;
  }

  async getTwitterState(stateId: string): Promise<any> {
    return this.oauthStateStore.get(stateId);
  }

  async findByWalletAddress(walletAddress: string): Promise<UserSocial | null> {
    try {
      const userSocial = await this.userSocialRepository.findOne({
        where: { walletAddress },
        order: { createdAt: 'DESC' }, // Get the most recent social connection
      });

      return userSocial || null;
    } catch (error) {
      console.error('Error finding user social by wallet address:', error);
      return null;
    }
  }
}