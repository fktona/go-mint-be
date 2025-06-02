import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
    constructor(private jwtService: JwtService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const client: Socket = context.switchToWs().getClient<Socket>();
            const authToken = client.handshake.headers.authorization?.split(' ')[1];

            if (!authToken) {
                throw new WsException('Unauthorized');
            }

            const payload = this.jwtService.verify(authToken);
            client.data.walletAddress = payload.wallet_address;
            return true;
        } catch (err) {
            throw new WsException('Unauthorized');
        }
    }
} 