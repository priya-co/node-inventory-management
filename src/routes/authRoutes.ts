import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { AuthMiddleware } from '../middlewares/authMiddleware';
import { authLimiter } from '../middlewares/rateLimiter';
import { ErrorHandler } from '../middlewares/errorHandler';

const router = Router();

// Apply rate limiting to auth routes
router.use(authLimiter);

/**
 * @route POST /api/v1/auth/login
 * @desc User login
 * @access Public
 */
router.post('/login', ErrorHandler.asyncHandler(AuthController.login));

/**
 * @route POST /api/v1/auth/register
 * @desc User registration (Admin only)
 * @access Private (Admin)
 */
router.post(
  '/register',
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  ErrorHandler.asyncHandler(AuthController.register)
);

/**
 * @route POST /api/v1/auth/refresh
 * @desc Refresh access token
 * @access Public (with valid refresh token)
 */
router.post('/refresh', ErrorHandler.asyncHandler(AuthController.refreshToken));

/**
 * @route GET /api/v1/auth/profile
 * @desc Get current user profile
 * @access Private
 */
router.get(
  '/profile',
  AuthMiddleware.authenticate,
  ErrorHandler.asyncHandler(AuthController.getProfile)
);

export default router;