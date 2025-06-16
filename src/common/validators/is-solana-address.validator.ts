import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

import { PublicKey } from '@solana/web3.js';

export function IsSolanaAddress(strictValidation: boolean = false, validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isSolanaAddress',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    if (!strictValidation) {
                        // Accept any string when not in strict mode
                        return typeof value === 'string';
                    }
                    
                    try {
                        // Try to create a PublicKey from the address
                        new PublicKey(value);
                        return true;
                    } catch (error) {
                        return false;
                    }
                },
                defaultMessage(args: ValidationArguments) {
                    const constraint = args.constraints?.[0] ?? true;
                    return constraint 
                        ? `${args.property} must be a valid Solana address` 
                        : `${args.property} must be a string`;
                },
            },
        });
    };
}