import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { PublicKey } from '@solana/web3.js';

export function IsSolanaAddress(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isSolanaAddress',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    try {
                        // Try to create a PublicKey from the address
                        new PublicKey(value);
                        return true;
                    } catch (error) {
                        return false;
                    }
                },
                defaultMessage(args: ValidationArguments) {
                    return `${args.property} must be a valid Solana address`;
                },
            },
        });
    };
} 