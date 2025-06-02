import { IsString, IsIn, IsNotEmpty } from 'class-validator';

export class CreateUserSocialDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['twitter', 'linkedin', 'github', 'facebook'], {
    message: 'Provider must be one of the following: twitter, linkedin, github, facebook',
  })
  provider: string;

  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @IsString()
  refreshToken?: string;

  @IsString()
  @IsNotEmpty()
  profile: string;
}