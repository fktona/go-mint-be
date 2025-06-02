import { PartialType } from '@nestjs/mapped-types';
import { CreateCommunityChatDto } from './create-community-chat.dto';

export class UpdateCommunityChatDto extends PartialType(CreateCommunityChatDto) {
  id: number;
}
