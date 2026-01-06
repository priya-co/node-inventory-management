import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { IJwtPayload, UserRole } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '15m';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-here';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';

export class AuthUtils {
  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare a password with its hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate access token
   */
  static generateAccessToken(payload: IJwtPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE } as any);
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(payload: IJwtPayload): string {
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRE } as any);
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): IJwtPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as IJwtPayload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): IJwtPayload {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET) as IJwtPayload;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Generate both access and refresh tokens
   */
  static generateTokens(payload: IJwtPayload): { accessToken: string; refreshToken: string } {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return { accessToken, refreshToken };
  }

  /**
   * Check if user has required role
   */
  static hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
    const roleHierarchy = {
      [UserRole.VIEWER]: 1,
      [UserRole.MANAGER]: 2,
      [UserRole.ADMIN]: 3
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  /**
   * Check if user has any of the required roles
   */
  static hasAnyRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
    return requiredRoles.some(role => this.hasRole(userRole, role));
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  static isValidPassword(password: string): boolean {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }
}