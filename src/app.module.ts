import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { UserTokensModule } from './user-tokens/user-tokens.module';
import { UserSocialsModule } from './user-socials/user-socials.module';
import { FriendsModule } from './friends/friends.module';
import { ChatModule } from './chat/chat.module';
import { CommunityChatModule } from './community-chat/community-chat.module';
import { ActivityModule } from './activity/activity.module';
import dbConfig from './config/db.config';
import appConfig from './config/app.config';
@Module({
  imports: [

    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: ['.env', '.env.development', '.env.production'],
      load: [dbConfig, appConfig],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: async () => {
        return dbConfig();
      },
      inject: [],
    }),
    UserModule,
    UserTokensModule,
    FriendsModule,
    UserSocialsModule,
    ChatModule,
    CommunityChatModule,
    ActivityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }