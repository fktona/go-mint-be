import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsWalletAuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const client: Socket = context.switchToWs().getClient<Socket>();
            const walletAddress = client.handshake.auth.walletAddress as string;

            if (!walletAddress) {
                throw new WsException('Wallet address is required');
            }

            client.data.walletAddress = walletAddress;
            return true;
        } catch (err) {
            throw new WsException('Unauthorized');
        }
    }
} 