import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { UserSocialsModule } from '../user-socials/user-socials.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    UserSocialsModule
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule { }
