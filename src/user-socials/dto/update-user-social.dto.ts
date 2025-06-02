import { PartialType } from '@nestjs/mapped-types';
import { CreateUserSocialDto } from './create-user-social.dto';

export class UpdateUserSocialDto extends PartialType(CreateUserSocialDto) {}
