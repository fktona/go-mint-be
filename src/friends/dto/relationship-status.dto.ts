import { ApiProperty } from '@nestjs/swagger';
import { FriendStatus } from '../enums/friend-status.enum';

export enum RelationshipType {
    FRIENDS = 'FRIENDS',
    PENDING_INCOMING = 'PENDING_INCOMING',
    PENDING_OUTGOING = 'PENDING_OUTGOING',
    BLOCKED = 'BLOCKED',
    NONE = 'NONE'
}

export class RelationshipStatusDto {
    @ApiProperty({
        enum: RelationshipType,
        description: 'Type of relationship between the users'
    })
    relationshipType: RelationshipType;

    @ApiProperty({
        enum: FriendStatus,
        description: 'Status of the friendship if it exists',
        required: false
    })
    status?: FriendStatus;

    @ApiProperty({
        description: 'Message sent with the friend request if it exists',
        required: false
    })
    message?: string;
} 