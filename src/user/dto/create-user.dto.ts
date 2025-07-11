import {
  IsOptional,
  IsString,
  IsNotEmpty,
  Validate,
} from 'class-validator';
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

// Custom validator for non-whitespace strings
function IsNotWhitespace(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isNotWhitespace',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return typeof value === 'string' && value.trim().length > 0;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must not be empty or contain only whitespace`;
        },
      },
    });
  };
}

export class CreateUserDto {
    @ApiProperty({
        example: '7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1M',
        description: 'The wallet address of the user',
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    @IsNotWhitespace()
    // @IsSolanaAddress()
    walletAddress: string;

    @ApiProperty({
        example: 'John Doe',
        description: 'The username of the user',
        required: false,
    })
    @IsString()
    @IsOptional()
    username?: string;
}
