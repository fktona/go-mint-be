import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }
  async create(createUserDto: CreateUserDto): Promise<User> {
    if (!createUserDto || !createUserDto.walletAddress) {
      throw new BadRequestException('walletAddress is required');
    }

    const existingUser = await this.userRepository.findOne({
      where: { walletAddress: createUserDto.walletAddress }
    });

    if (existingUser) {
      return existingUser;
    }

    try {
      console.log('Creating user with DTO:', createUserDto);
      const user = this.userRepository.create(createUserDto);
      console.log('Created user entity:', user);
      const savedUser = await this.userRepository.save(user);
      console.log('Saved user:', savedUser);
      return savedUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new BadRequestException('Failed to create user: ' + error.message);
    }
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['userSocials']
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['userSocials']
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByWalletAddress(walletAddress: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { walletAddress },
      relations: ['userSocials']
    });
    if (!user) {
      throw new NotFoundException(`User with wallet address ${walletAddress} not found`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}
