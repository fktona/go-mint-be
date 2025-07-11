import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { ResponseUtil } from '../common/utils/response.util';
import { ResponseInterface } from '../common/interfaces/response.interface';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created', type: User })
  @ApiResponse({ status: 409, description: 'User with this wallet address already exists' })
  async create(@Body() createUserDto: CreateUserDto): Promise<ResponseInterface<User>> {
    try {
      if (!createUserDto || !createUserDto.walletAddress) {
        throw new BadRequestException('walletAddress is required');
      }
      
      const user = await this.userService.create(createUserDto);
      return ResponseUtil.success(user, 'User created successfully');
    } catch (error) {
      console.error('Error in create user controller:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create user: ' + error.message);
    }
  }

  @Post('test')
  @ApiOperation({ summary: 'Test endpoint to debug request body' })
  async testCreate(@Body() body: any): Promise<ResponseInterface<any>> {
    return ResponseUtil.success({
      receivedBody: body,
      bodyType: typeof body,
      bodyKeys: body ? Object.keys(body) : [],
      walletAddress: body?.walletAddress,
    }, 'Test endpoint response');
  }

  @Post('test-validation')
  @ApiOperation({ summary: 'Test validation with CreateUserDto' })
  async testValidation(@Body() createUserDto: CreateUserDto): Promise<ResponseInterface<any>> {
    return ResponseUtil.success({
      receivedDto: createUserDto,
      walletAddress: createUserDto?.walletAddress,
      hasWalletAddress: !!createUserDto?.walletAddress,
    }, 'Validation test response');
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Return all users', type: [User] })
  async findAll(): Promise<ResponseInterface<User[]>> {
    const users = await this.userService.findAll();
    return ResponseUtil.success(users, 'Users retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiResponse({ status: 200, description: 'Return the user', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string): Promise<ResponseInterface<User>> {
    const user = await this.userService.findOne(id);
    return ResponseUtil.success(user, 'User retrieved successfully');
  }

  @Get('wallet/:address')
  @ApiOperation({ summary: 'Get a user by wallet address' })
  @ApiResponse({ status: 200, description: 'Return the user', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findByWalletAddress(@Param('address') address: string): Promise<ResponseInterface<User>> {
    const user = await this.userService.findByWalletAddress(address);
    return ResponseUtil.success(user, 'User retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'User successfully updated', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<ResponseInterface<User>> {
    const user = await this.userService.update(id, updateUserDto);
    return ResponseUtil.success(user, 'User updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 204, description: 'User successfully deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id') id: string): Promise<ResponseInterface<null>> {
    await this.userService.remove(id);
    return ResponseUtil.success(null, 'User deleted successfully');
  }
}
