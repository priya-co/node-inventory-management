import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '15'); // minutes
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW * 60 * 1000, // Convert to milliseconds
  max: RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    message: `Too many requests. Maximum ${RATE_LIMIT_MAX_REQUESTS} requests per ${RATE_LIMIT_WINDOW} minutes allowed.`,
    retryAfter: `${RATE_LIMIT_WINDOW} minutes`
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req: Request) => {
    // Skip rate limiting for health checks or in test environment
    return req.url === '/health' || process.env.NODE_ENV === 'test';
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: `Too many requests. Maximum ${RATE_LIMIT_MAX_REQUESTS} requests per ${RATE_LIMIT_WINDOW} minutes allowed.`,
      retryAfter: `${RATE_LIMIT_WINDOW} minutes`
    });
  }
});

// Stricter rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    return process.env.NODE_ENV === 'test';
  }
});

// Rate limiter for report generation (resource intensive)
export const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 reports per hour
  message: {
    success: false,
    message: 'Too many report requests. Maximum 10 reports per hour allowed.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    return process.env.NODE_ENV === 'test';
  }
});