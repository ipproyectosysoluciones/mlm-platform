import { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '../types';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  let statusCode = 500;
  let response: ApiResponse<null>;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    response = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    };
  } else if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    response = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: { general: [err.message] },
      },
    };
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    response = {
      success: false,
      error: {
        code: 'DUPLICATE_ERROR',
        message: 'Resource already exists',
      },
    };
  } else {
    statusCode = 500;
    response = {
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Internal server error',
      },
    };
  }

  // Log based on status code
  if (statusCode >= 500) {
    console.error('Server Error:', err);
  } else {
    console.warn('Client Error:', err.message);
  }

  res.status(statusCode).json(response);
}

export function notFoundHandler(req: Request, res: Response): void {
  const response: ApiResponse<null> = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  };
  res.status(404).json(response);
}
