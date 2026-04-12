import { Request, Response, NextFunction, RequestHandler } from 'express';
import { logger } from '../utils/logger';

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export function asyncHandler(fn: AsyncRequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    logger.debug('asyncHandler called');
    Promise.resolve(fn(req, res, next)).catch((e) => {
      logger.debug({ err: e }, 'asyncHandler caught error');
      next(e);
    });
  };
}
