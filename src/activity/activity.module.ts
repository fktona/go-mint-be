import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityService } from './activity.service';
import { ActivityGateway } from './activity.gateway';
import { Activity } from './entities/activity.entity';
import { UserSocialsModule } from '../user-socials/user-socials.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity]),
    UserSocialsModule,
  ],
  providers: [ActivityService, ActivityGateway],
  exports: [ActivityService],
})
export class ActivityModule { }
