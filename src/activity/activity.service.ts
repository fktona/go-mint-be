import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './entities/activity.entity';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { UserSocialsService } from '../user-socials/user-socials.service';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
    private userSocialsService: UserSocialsService,
  ) { }

  async create(createActivityDto: CreateActivityDto): Promise<Activity> {
    // Fetch user social information if not provided
    if (!createActivityDto.username || !createActivityDto.avatarUrl) {
      const userSocials = await this.userSocialsService.findByWalletAddress(createActivityDto.walletAddress);
      if (userSocials) {
        createActivityDto.username = createActivityDto.username || userSocials.username || undefined;
        createActivityDto.avatarUrl = createActivityDto.avatarUrl || userSocials.avatarUrl || undefined;
      }
    }

    const activity = this.activityRepository.create(createActivityDto);
    return await this.activityRepository.save(activity);
  }

  async findAll(): Promise<Activity[]> {
    return await this.activityRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findRecent(limit: number = 10): Promise<Activity[]> {
    return await this.activityRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByWalletAddress(walletAddress: string): Promise<Activity[]> {
    return await this.activityRepository.find({
      where: { walletAddress },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Activity> {
    const activity = await this.activityRepository.findOne({ where: { id } });
    if (!activity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }
    return activity;
  }

  async update(id: string, updateActivityDto: UpdateActivityDto): Promise<Activity> {
    const { id: _, ...updateData } = updateActivityDto;
    await this.activityRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.activityRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }
  }
}
