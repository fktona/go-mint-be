import { ResponseInterface } from '../interfaces/response.interface';


export class ResponseUtil {
    static success<T>(
        data: T,
        message: string = 'Success',
        meta?: { page?: number; limit?: number; total?: number },
    ): ResponseInterface<T> {
        return {
            success: true,
            message,
            data,
            meta,
        };
    }

    static error(
        message: string,
        code: string,
        details?: any,
    ): ResponseInterface<null> {
        return {
            success: false,
            message,
            error: {
                code,
                details,
            },
        };
    }

    static paginate<T>(
        items: T[],
        total: number,
        page: number,
        limit: number,
        message: string = 'Success',
    ): ResponseInterface<T[]> {
        return {
            success: true,
            message,
            data: items,
            meta: {
                page,
                limit,
                total,
            },
        };
    }
}