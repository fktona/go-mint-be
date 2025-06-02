import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateActivityDto {
  @ApiProperty({ description: 'Activity ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Type of activity', required: false })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ description: 'Description of the activity', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
