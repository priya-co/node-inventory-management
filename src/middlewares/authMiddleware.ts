import { Request, Response, NextFunction } from 'express';
import { AuthUtils } from '../utils/auth';
import { UserRole, IAuthenticatedRequest } from '../types';

export class AuthMiddleware {
  /**
   * Middleware to authenticate JWT token
   */
  static authenticate = (req: IAuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          message: 'Access token required'
        });
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      const decoded = AuthUtils.verifyAccessToken(token);

      // Attach user info to request
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };

      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  };

  /**
   * Middleware to check if user has required role
   */
  static authorize = (requiredRole: UserRole) => {
    return (req: IAuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      if (!AuthUtils.hasRole(req.user.role, requiredRole)) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
        return;
      }

      next();
    };
  };

  /**
   * Middleware to check if user has any of the required roles
   */
  static authorizeAny = (requiredRoles: UserRole[]) => {
    return (req: IAuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      if (!AuthUtils.hasAnyRole(req.user.role, requiredRoles)) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
        return;
      }

      next();
    };
  };

  /**
   * Specific role-based middlewares for convenience
   */
  static requireAdmin = AuthMiddleware.authorize(UserRole.ADMIN);
  static requireManager = AuthMiddleware.authorize(UserRole.MANAGER);
  static requireViewer = AuthMiddleware.authorize(UserRole.VIEWER);

  /**
   * Middleware for manager or admin access
   */
  static requireManagerOrAdmin = AuthMiddleware.authorizeAny([UserRole.MANAGER, UserRole.ADMIN]);

  /**
   * Middleware for viewer or higher access
   */
  static requireViewerOrHigher = AuthMiddleware.authorizeAny([UserRole.VIEWER, UserRole.MANAGER, UserRole.ADMIN]);
}