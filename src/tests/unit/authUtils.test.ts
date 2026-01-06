import { AuthUtils } from '../../utils/auth';
import { UserRole } from '../../types';

describe('AuthUtils', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hash = await AuthUtils.hashPassword(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
      expect(hash).not.toBe(password);
    });

    it('should produce different hashes for same password', async () => {
      const password = 'testPassword123';
      const hash1 = await AuthUtils.hashPassword(password);
      const hash2 = await AuthUtils.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'testPassword123';
      const hash = await AuthUtils.hashPassword(password);

      const isValid = await AuthUtils.comparePassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword123';
      const hash = await AuthUtils.hashPassword(password);

      const isValid = await AuthUtils.comparePassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });

  describe('generateAccessToken and verifyAccessToken', () => {
    it('should generate and verify access token', () => {
      const payload = {
        userId: 'user123',
        email: 'test@example.com',
        role: UserRole.MANAGER
      };

      const token = AuthUtils.generateAccessToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = AuthUtils.verifyAccessToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.jwt.token';

      expect(() => {
        AuthUtils.verifyAccessToken(invalidToken);
      }).toThrow('Invalid access token');
    });
  });

  describe('generateRefreshToken and verifyRefreshToken', () => {
    it('should generate and verify refresh token', () => {
      const payload = {
        userId: 'user123',
        email: 'test@example.com',
        role: UserRole.MANAGER
      };

      const token = AuthUtils.generateRefreshToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = AuthUtils.verifyRefreshToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('should throw error for invalid refresh token', () => {
      const invalidToken = 'invalid.jwt.token';

      expect(() => {
        AuthUtils.verifyRefreshToken(invalidToken);
      }).toThrow('Invalid refresh token');
    });
  });

  describe('hasRole', () => {
    it('should return true for same role', () => {
      expect(AuthUtils.hasRole(UserRole.ADMIN, UserRole.ADMIN)).toBe(true);
      expect(AuthUtils.hasRole(UserRole.MANAGER, UserRole.MANAGER)).toBe(true);
      expect(AuthUtils.hasRole(UserRole.VIEWER, UserRole.VIEWER)).toBe(true);
    });

    it('should return true for higher role access', () => {
      expect(AuthUtils.hasRole(UserRole.ADMIN, UserRole.MANAGER)).toBe(true);
      expect(AuthUtils.hasRole(UserRole.ADMIN, UserRole.VIEWER)).toBe(true);
      expect(AuthUtils.hasRole(UserRole.MANAGER, UserRole.VIEWER)).toBe(true);
    });

    it('should return false for lower role access', () => {
      expect(AuthUtils.hasRole(UserRole.VIEWER, UserRole.MANAGER)).toBe(false);
      expect(AuthUtils.hasRole(UserRole.VIEWER, UserRole.ADMIN)).toBe(false);
      expect(AuthUtils.hasRole(UserRole.MANAGER, UserRole.ADMIN)).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true when user has one of the required roles', () => {
      expect(AuthUtils.hasAnyRole(UserRole.ADMIN, [UserRole.MANAGER, UserRole.VIEWER])).toBe(true);
      expect(AuthUtils.hasAnyRole(UserRole.MANAGER, [UserRole.ADMIN, UserRole.MANAGER])).toBe(true);
    });

    it('should return false when user does not have any required role', () => {
      expect(AuthUtils.hasAnyRole(UserRole.VIEWER, [UserRole.ADMIN, UserRole.MANAGER])).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(AuthUtils.isValidEmail('test@example.com')).toBe(true);
      expect(AuthUtils.isValidEmail('user.name+tag@example.co.uk')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(AuthUtils.isValidEmail('invalid-email')).toBe(false);
      expect(AuthUtils.isValidEmail('test@')).toBe(false);
      expect(AuthUtils.isValidEmail('@example.com')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should return true for valid passwords', () => {
      expect(AuthUtils.isValidPassword('Password123')).toBe(true);
      expect(AuthUtils.isValidPassword('MySecurePass1')).toBe(true);
    });

    it('should return false for invalid passwords', () => {
      expect(AuthUtils.isValidPassword('password')).toBe(false); // No uppercase, no number
      expect(AuthUtils.isValidPassword('PASSWORD')).toBe(false); // No lowercase, no number
      expect(AuthUtils.isValidPassword('Password')).toBe(false); // No number
      expect(AuthUtils.isValidPassword('Pass1')).toBe(false); // Too short
    });
  });
});