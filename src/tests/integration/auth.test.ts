import request from 'supertest';
import app from '../../app';
import { mockUserService } from '../../data';
import { UserRole } from '../../types';

describe('Authentication API', () => {
  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'manager@example.com',
        password: 'Password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.user.role).toBe(UserRole.MANAGER);
    });

    it('should return 401 for invalid credentials', async () => {
      const loginData = {
        email: 'manager@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 401 for non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 400 for invalid request data', async () => {
      const loginData = {
        email: 'invalid-email',
        password: ''
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully as admin', async () => {
      // First login as admin
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'Admin123!'
        });

      const adminToken = loginResponse.body.data.accessToken;

      const newUserData = {
        email: 'newuser@example.com',
        password: 'NewPassword123',
        name: 'New User',
        role: UserRole.VIEWER
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.email).toBe(newUserData.email);
      expect(response.body.data.name).toBe(newUserData.name);
      expect(response.body.data.role).toBe(newUserData.role);
    });

    it('should return 403 for non-admin user trying to register', async () => {
      // Login as manager
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'manager@example.com',
          password: 'Password123'
        });

      const managerToken = loginResponse.body.data.accessToken;

      const newUserData = {
        email: 'anotheruser@example.com',
        password: 'AnotherPassword123',
        name: 'Another User',
        role: UserRole.VIEWER
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(newUserData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Insufficient permissions');
    });

    it('should return 409 for duplicate email', async () => {
      // First login as admin
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'Admin123!'
        });

      const adminToken = loginResponse.body.data.accessToken;

      const duplicateUserData = {
        email: 'manager@example.com', // Already exists
        password: 'SomePassword123',
        name: 'Duplicate User',
        role: UserRole.VIEWER
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateUserData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User already exists with this email');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      // First login to get tokens
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'manager@example.com',
          password: 'Password123'
        });

      const refreshToken = loginResponse.body.data.refreshToken;

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Token refreshed successfully');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Refresh token required');
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid refresh token');
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    it('should get user profile with valid token', async () => {
      // First login to get token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'manager@example.com',
          password: 'Password123'
        });

      const token = loginResponse.body.data.accessToken;

      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.email).toBe('manager@example.com');
      expect(response.body.data.name).toBe('Warehouse Manager');
      expect(response.body.data.role).toBe(UserRole.MANAGER);
    });

    it('should return 401 for missing token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired token');
    });
  });
});