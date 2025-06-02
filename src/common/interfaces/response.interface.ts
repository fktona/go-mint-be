export interface ResponseInterface<T> {
    success: boolean;
    message: string;
    data?: T;
    error?: {
        code: string;
        details?: any;
    };
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
    };
}