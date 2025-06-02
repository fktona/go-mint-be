import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ActivityService } from './activity.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { Activity } from './entities/activity.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ActivityGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly activityService: ActivityService) { }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('createActivity')
  async create(@MessageBody() createActivityDto: CreateActivityDto) {
    const activity = await this.activityService.create(createActivityDto);
    this.server.emit('newActivity', activity);
    return activity;
  }

  @SubscribeMessage('getRecentActivities')
  async getRecentActivities() {
    return await this.activityService.findRecent();
  }

  @SubscribeMessage('getActivitiesByWallet')
  async getActivitiesByWallet(@MessageBody() walletAddress: string) {
    return await this.activityService.findByWalletAddress(walletAddress);
  }

  @SubscribeMessage('findOneActivity')
  async findOne(@MessageBody() id: string) {
    return await this.activityService.findOne(id);
  }

  @SubscribeMessage('updateActivity')
  async update(@MessageBody() updateActivityDto: UpdateActivityDto) {
    const activity = await this.activityService.update(updateActivityDto.id, updateActivityDto);
    this.server.emit('activityUpdated', activity);
    return activity;
  }

  @SubscribeMessage('removeActivity')
  async remove(@MessageBody() id: string) {
    await this.activityService.remove(id);
    this.server.emit('activityRemoved', id);
    return { success: true };
  }
}
