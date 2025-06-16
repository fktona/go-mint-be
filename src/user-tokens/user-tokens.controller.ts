import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ResponseInterface } from '../common/interfaces/response.interface';
import { ResponseUtil } from '../common/utils/response.util';
import { UpdateUserTokenDto } from './dto/update-user-token.dto';
import { UserToken } from './entities/user-token.entity';
import { UserTokensService } from './user-tokens.service';

@ApiTags('user-tokens')
@Controller('user-tokens')
export class UserTokensController {
  constructor(private readonly userTokensService: UserTokensService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new user token' })
  @ApiResponse({ status: 201, description: 'User token successfully created', type: UserToken })
  @ApiResponse({ status: 409, description: 'Token with this address already exists' })
  async create(@Body() createUserTokenDto: any): Promise<ResponseInterface<UserToken>> {
    console.log('Creating user token with data:', createUserTokenDto);
    const token = await this.userTokensService.create(createUserTokenDto);
    return ResponseUtil.success(token, 'User token created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all user tokens' })
  @ApiResponse({ status: 200, description: 'Return all user tokens', type: [UserToken] })
  async findAll(): Promise<ResponseInterface<UserToken[]>> {
    const tokens = await this.userTokensService.findAll();
    return ResponseUtil.success(tokens, 'User tokens retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user token by id' })
  @ApiResponse({ status: 200, description: 'Return the user token', type: UserToken })
  @ApiResponse({ status: 404, description: 'User token not found' })
  async findOne(@Param('id') id: string): Promise<ResponseInterface<UserToken>> {
    const token = await this.userTokensService.findOne(id);
    return ResponseUtil.success(token, 'User token retrieved successfully');
  }

  @Get('creator/:creatorId')
  @ApiOperation({ summary: 'Get all tokens created by a specific user' })
  @ApiResponse({ status: 200, description: 'Return all tokens created by the user', type: [UserToken] })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findByCreator(@Param('creatorId') creatorId: string): Promise<ResponseInterface<UserToken[]>> {
    const tokens = await this.userTokensService.findByCreator(creatorId);
    return ResponseUtil.success(tokens, 'User tokens retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user token' })
  @ApiResponse({ status: 200, description: 'User token successfully updated', type: UserToken })
  @ApiResponse({ status: 404, description: 'User token not found' })
  async update(
    @Param('id') id: string,
    @Body() updateUserTokenDto: UpdateUserTokenDto,
  ): Promise<ResponseInterface<UserToken>> {
    const token = await this.userTokensService.update(id, updateUserTokenDto);
    return ResponseUtil.success(token, 'User token updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user token' })
  @ApiResponse({ status: 204, description: 'User token successfully deleted' })
  @ApiResponse({ status: 404, description: 'User token not found' })
  async remove(@Param('id') id: string): Promise<ResponseInterface<null>> {
    await this.userTokensService.remove(id);
    return ResponseUtil.success(null, 'User token deleted successfully');
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted user token' })
  @ApiResponse({ status: 200, description: 'User token successfully restored', type: UserToken })
  @ApiResponse({ status: 404, description: 'User token not found' })
  async restore(@Param('id') id: string): Promise<ResponseInterface<UserToken>> {
    const token = await this.userTokensService.restore(id);
    return ResponseUtil.success(token, 'User token restored successfully');
  }
}
