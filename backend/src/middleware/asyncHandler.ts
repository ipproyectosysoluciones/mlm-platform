import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export function asyncHandler(fn: AsyncRequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log('[DEBUG] asyncHandler called');
    Promise.resolve(fn(req, res, next)).catch((e) => {
      console.log('[DEBUG] asyncHandler error:', e);
      next(e);
    });
  };
}
