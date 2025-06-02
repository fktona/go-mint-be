import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { UserSocialsService } from './user-socials.service';
import { JwtService } from '@nestjs/jwt';
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { SociaLConnect } from 'src/common/decorators';
import { DynamicAuthGuard } from 'src/lib/dynamic-auth.guard';

@Controller('connect')
export class UserSocialsController {
  constructor(
    private readonly userSocialsService: UserSocialsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  // Route for initiating OAuth flow with a specific provider
  @Get('init/:provider/:id')
  @SociaLConnect()
  async authProvider(@Req() req: Request) {
    // The passport strategy will handle the redirect
  }

  // Route for handling OAuth callbacks
  @Get(':provider/callback')
  @UseGuards(DynamicAuthGuard)
  async authCallback(@Req() req: any, @Res() res: Response) {
    console.log("authCallback called", req.authInfo);
    try {
      // Extract profile from authenticated request
      const profile = req?.full_profile;
      const userId = req.profile.customData?.stateId;

      // Check if social connection already exists
      const existingConnection = await this.userSocialsService.findByProvider(userId, req.params.provider);

      if (existingConnection && existingConnection.walletAddress !== userId) {
        console.log({ existingConnection, userId, provider: req.params.provider });
        // If connection exists, redirect with success=false and reason
        console.log("social_already_connected", existingConnection.walletAddress, userId, req.params.provider);
        return res.redirect(
          `${this.configService.get('FRONTEND_URL')}/profile?success=false&reason=social_already_connected&provider=${req.params.provider}`
        );
      }

      // If no existing connection, create new one
      await this.userSocialsService.create(userId, profile);

      // Redirect to frontend with success
      res.redirect(
        `${this.configService.get('FRONTEND_URL')}/profile?success=true&provider=${req.params.provider}`
      );

    } catch (error) {
      console.error('Failed to save social connection:', error);
      return res.redirect(
        `${this.configService.get('FRONTEND_URL')}/profile?success=false&reason=connection_error&provider=${req.params.provider}`
      );
    }
  }

  @Get("socials")
  async findAll(@Req() req: any) {
    const userId = req?.user?.userId;
    return await this.userSocialsService.findAll(userId);
  }
}