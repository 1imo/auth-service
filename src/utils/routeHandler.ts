import { Request, Response } from 'express';

type AsyncRequestHandler = (req: Request, res: Response) => Promise<void>;

/**
 * Creates a request handler with error handling
 * @param handler - Async request handler function
 */
export const createHandler = (handler: AsyncRequestHandler) => {
    return async (req: Request, res: Response) => {
        try {
            await handler(req, res);
        } catch (error) {
            console.error('Request handler error:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Internal server error'
            });
        }
    };
}; 