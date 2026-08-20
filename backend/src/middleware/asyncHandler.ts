import { Request, Response, NextFunction, RequestHandler } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Async request handler type that accepts any Request subtype
 * (e.g. AuthenticatedRequest) and any Promise return type.
 *
 * Using `any` for req is intentional — this is an internal wrapper;
 * actual type safety comes from each controller's explicit parameter annotation.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AsyncRequestHandler = (req: any, res: Response, next: NextFunction) => Promise<any>;

export function asyncHandler(fn: AsyncRequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    logger.debug('asyncHandler called');
    return Promise.resolve(fn(req, res, next)).catch((e) => {
      logger.debug({ err: e }, 'asyncHandler caught error');
      next(e);
    });
  };
}
