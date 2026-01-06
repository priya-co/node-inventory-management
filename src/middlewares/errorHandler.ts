import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export class ErrorHandler {
  /**
   * Global error handling middleware
   */
  static handle = (err: Error, req: Request, res: Response, next: NextFunction): void => {
    // Log the error
    logger.error('Error occurred:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Default error response
    let statusCode = 500;
    let message = 'Internal server error';

    // Handle specific error types
    if (err.name === 'ValidationError') {
      statusCode = 400;
      message = 'Validation error';
    } else if (err.name === 'CastError') {
      statusCode = 400;
      message = 'Invalid data format';
    } else if (err.message.includes('not found')) {
      statusCode = 404;
      message = err.message;
    } else if (err.message.includes('unauthorized') || err.message.includes('forbidden')) {
      statusCode = 403;
      message = err.message;
    }

    // Send error response
    res.status(statusCode).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  };

  /**
   * Handle 404 errors
   */
  static notFound = (req: Request, res: Response, next: NextFunction): void => {
    const error = new Error(`Route ${req.originalUrl} not found`);
    res.status(404);
    next(error);
  };

  /**
   * Async error wrapper for route handlers
   */
  static asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };
}