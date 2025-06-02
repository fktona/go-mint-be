import { Injectable, NotFoundException, InternalServerErrorException, Logger, applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { DynamicAuthGuard } from 'src/lib/dynamic-auth.guard';
import { SocialProvider } from '../enum';


export function HandleServiceErrors(errorMessage?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const logger = new Logger(target.constructor.name);
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {

        if (error instanceof NotFoundException) throw error;
        logger.error(`Failed to ${propertyKey}: ${error.message}`);
        throw new InternalServerErrorException(
          errorMessage || `Could not ${propertyKey.replace(/([A-Z])/g, ' $1').toLowerCase()}`
        );
      }
    };

    return descriptor;
  };
}


export function HandleServiceErrorsWithLogging(errorMessage?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const logger = new Logger(target.constructor.name);
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        // Log error and throw internal server error
        logger.error(`Failed to ${propertyKey}: ${error.message}`);
        throw new InternalServerErrorException(
          errorMessage || `Could not ${propertyKey.replace(/([A-Z])/g, ' $1').toLowerCase()}`
        );
      }
    };

    return descriptor;
  };
}
export function SendNotification({
  eventType,
  messageTemplate,
  dataExtractor,
}: {
  eventType: string;
  messageTemplate: string;
  dataExtractor?: (args: any[], result: any) => any;
} = { eventType: '', messageTemplate: '' }
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Execute the original method
      const result = await originalMethod.apply(this, args);

      try {
        // Get userId (usually first argument)
        const userId = args[0];

        // Extract notification data
        const data = dataExtractor ? dataExtractor(args, result) : {};

        // Process template string
        const message = messageTemplate.replace(/\${(\w+)}/g, (_, key) => {
          return args[1]?.[key] || args[1] || '';
        });

        // Send notification using the service's notification service
        if (this.notificationsService) {
          await this.notificationsService.sendNotification(
            userId, eventType, message, data
          );
        }
      } catch (error) {
        // Log error but don't fail the operation
        const logger = new Logger(target.constructor.name);
        logger.error(`Failed to send notification: ${error.message}`);
      }

      return result;
    };

    return descriptor;
  };
}


export function Auth() {
  return applyDecorators(
    ApiBearerAuth(),
  );
}



export function SociaLConnect() {
  return applyDecorators(
    ApiParam({ name: 'provider', enum: SocialProvider }),
    ApiParam({ name: 'id', required: true }),
    UseGuards(DynamicAuthGuard)
  );
}


