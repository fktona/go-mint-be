import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseInterface } from '../interfaces/response.interface';

@Injectable()
export class TransformInterceptor<T>
    implements NestInterceptor<T, ResponseInterface<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<ResponseInterface<T>> {
        return next.handle().pipe(
            map((data) => {
                const response = context.switchToHttp().getResponse();
                const statusCode = response.statusCode;

                // If data is already in our response format, return it as is
                if (data && typeof data === 'object' && 'success' in data) {
                    return data;
                }

                // Transform the response into our standard format
                const transformedResponse: ResponseInterface<T> = {
                    success: statusCode >= 200 && statusCode < 300,
                    message: this.getDefaultMessage(statusCode),
                    data: data,
                };

                // Add pagination metadata if it exists
                if (data && typeof data === 'object' && 'items' in data && 'meta' in data) {
                    transformedResponse.data = data.items;
                    transformedResponse.meta = data.meta;
                }

                return transformedResponse;
            }),
        );
    }

    private getDefaultMessage(statusCode: number): string {
        const messages: { [key: number]: string } = {
            200: 'Success',
            201: 'Created successfully',
            204: 'No content',
            400: 'Bad request',
            401: 'Unauthorized',
            403: 'Forbidden',
            404: 'Not found',
            409: 'Conflict',
            500: 'Internal server error',
        };

        return messages[statusCode] || 'Operation completed';
    }
}