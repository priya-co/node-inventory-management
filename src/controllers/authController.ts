import { Request, Response } from 'express';
import Joi from 'joi';
import { AuthUtils } from '../utils/auth';
import { mockUserService } from '../data';
import { ILoginRequest, ILoginResponse, IRegisterRequest, IApiResponse, UserRole, IAuthenticatedRequest } from '../types';
import { logger } from '../config/logger';

export class AuthController {
  // Validation schemas
  private static loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  private static registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().min(2).required(),
    role: Joi.string().valid(...Object.values(UserRole)).optional()
  });

  /**
   * User login
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      // Validate input
      const { error, value } = this.loginSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          error: error.details[0].message
        });
        return;
      }

      const { email, password }: ILoginRequest = value;

      // Find user by email
      const user = await mockUserService.findByEmail(email);
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
        return;
      }

      // Check password
      const isPasswordValid = await AuthUtils.comparePassword(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
        return;
      }

      // Check if user is active
      if (!user.isActive) {
        res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
        return;
      }

      // Generate tokens
      const tokens = AuthUtils.generateTokens({
        userId: user._id!,
        email: user.email,
        role: user.role
      });

      // Log successful login
      logger.info('User logged in', { userId: user._id, email: user.email });

      const response: ILoginResponse = {
        success: true,
        message: 'Login successful',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: {
            id: user._id!,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }
      };

      res.json(response);
    } catch (error) {
      logger.error('Login error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * User registration (Admin only)
   */
  static async register(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Validate input
      const { error, value } = this.registerSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          error: error.details[0].message
        });
        return;
      }

      const { email, password, name, role }: IRegisterRequest = value;

      // Check if user already exists
      const existingUser = await mockUserService.findByEmail(email);
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'User already exists with this email'
        });
        return;
      }

      // Hash password
      const hashedPassword = await AuthUtils.hashPassword(password);

      // Create user
      const newUser = await mockUserService.create({
        email,
        password: hashedPassword,
        name,
        role: role || UserRole.VIEWER, // Default to viewer role
        isActive: true
      });

      // Log user creation
      logger.info('User registered', { userId: newUser._id, email: newUser.email, createdBy: req.user?.id });

      const response: IApiResponse = {
        success: true,
        message: 'User registered successfully',
        data: {
          id: newUser._id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          createdAt: newUser.createdAt
        }
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Registration error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token required'
        });
        return;
      }

      // Verify refresh token
      const decoded = AuthUtils.verifyRefreshToken(refreshToken);

      // Find user to ensure they still exist and are active
      const user = await mockUserService.findById(decoded.userId);
      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
        return;
      }

      // Generate new tokens
      const tokens = AuthUtils.generateTokens({
        userId: user._id!,
        email: user.email,
        role: user.role
      });

      // Log token refresh
      logger.info('Token refreshed', { userId: user._id });

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        }
      });
    } catch (error) {
      logger.error('Token refresh error', { error: error instanceof Error ? error.message : String(error) });
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const user = await mockUserService.findById(req.user.id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const response: IApiResponse = {
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      };

      res.json(response);
    } catch (error) {
      logger.error('Get profile error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}