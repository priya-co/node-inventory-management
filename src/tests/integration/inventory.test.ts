import request from 'supertest';
import app from '../../app';
import { UserRole } from '../../types';

describe('Inventory API', () => {
  let adminToken: string;
  let managerToken: string;
  let viewerToken: string;

  beforeAll(async () => {
    // Get tokens for different user roles
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Admin123!'
      });
    adminToken = adminLogin.body.data.accessToken;

    const managerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'manager@example.com',
        password: 'Password123'
      });
    managerToken = managerLogin.body.data.accessToken;

    const viewerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'viewer@example.com',
        password: 'Viewer123'
      });
    viewerToken = viewerLogin.body.data.accessToken;
  });

  describe('GET /api/v1/inventory', () => {
    it('should get inventory status as viewer', async () => {
      const response = await request(app)
        .get('/api/v1/inventory')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Check structure of inventory data
      const firstItem = response.body.data[0];
      expect(firstItem).toHaveProperty('productId');
      expect(firstItem).toHaveProperty('productName');
      expect(firstItem).toHaveProperty('sku');
      expect(firstItem).toHaveProperty('category');
      expect(firstItem).toHaveProperty('currentStock');
      expect(firstItem).toHaveProperty('minStock');
      expect(firstItem).toHaveProperty('warehouse');
      expect(firstItem).toHaveProperty('lastUpdated');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/inventory')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });
  });

  describe('GET /api/v1/inventory/summary', () => {
    it('should get inventory summary as viewer', async () => {
      const response = await request(app)
        .get('/api/v1/inventory/summary')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalProducts');
      expect(response.body.data).toHaveProperty('totalStockValue');
      expect(response.body.data).toHaveProperty('lowStockProducts');
      expect(response.body.data).toHaveProperty('outOfStockProducts');
      expect(response.body.data).toHaveProperty('recentMovements');
      expect(response.body.data).toHaveProperty('categoryBreakdown');

      expect(typeof response.body.data.totalProducts).toBe('number');
      expect(typeof response.body.data.totalStockValue).toBe('number');
      expect(typeof response.body.data.lowStockProducts).toBe('number');
      expect(Array.isArray(response.body.data.recentMovements)).toBe(true);
      expect(typeof response.body.data.categoryBreakdown).toBe('object');
    });
  });

  describe('PATCH /api/v1/inventory/:id', () => {
    it('should update stock as manager', async () => {
      // Get first product ID
      const productsResponse = await request(app)
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${managerToken}`);

      const productId = productsResponse.body.data[0]._id;
      const originalStock = productsResponse.body.data[0].stock;
      const newStock = originalStock + 5;

      const updateData = {
        stock: newStock,
        reason: 'Stock adjustment for testing'
      };

      const response = await request(app)
        .patch(`/api/v1/inventory/${productId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Stock updated successfully');
      expect(response.body.data.productId).toBe(productId);
      expect(response.body.data.previousStock).toBe(originalStock);
      expect(response.body.data.updatedStock).toBe(newStock);
      expect(response.body.data).toHaveProperty('updatedAt');
    });

    it('should update stock as admin', async () => {
      // Get second product ID
      const productsResponse = await request(app)
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`);

      const productId = productsResponse.body.data[1]._id;
      const originalStock = productsResponse.body.data[1].stock;
      const newStock = originalStock - 2;

      const updateData = {
        stock: newStock,
        reason: 'Admin stock reduction'
      };

      const response = await request(app)
        .patch(`/api/v1/inventory/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.previousStock).toBe(originalStock);
      expect(response.body.data.updatedStock).toBe(newStock);
    });

    it('should return 403 for viewer trying to update stock', async () => {
      // Get product ID
      const productsResponse = await request(app)
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${viewerToken}`);

      const productId = productsResponse.body.data[0]._id;

      const updateData = {
        stock: 100,
        reason: 'Unauthorized update'
      };

      const response = await request(app)
        .patch(`/api/v1/inventory/${productId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Insufficient permissions');
    });

    it('should return 404 for non-existent product', async () => {
      const updateData = {
        stock: 10,
        reason: 'Test update'
      };

      const response = await request(app)
        .patch('/api/v1/inventory/nonexistent-id')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found');
    });

    it('should return 400 for invalid stock value', async () => {
      // Get product ID
      const productsResponse = await request(app)
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${managerToken}`);

      const productId = productsResponse.body.data[0]._id;

      const updateData = {
        stock: -5, // Invalid negative stock
        reason: 'Invalid stock update'
      };

      const response = await request(app)
        .patch(`/api/v1/inventory/${productId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
      expect(response.body.error).toBeDefined();
    });

    it('should create inventory log entry when stock is updated', async () => {
      // Get product ID
      const productsResponse = await request(app)
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${managerToken}`);

      const productId = productsResponse.body.data[0]._id;
      const originalStock = productsResponse.body.data[0].stock;
      const newStock = originalStock + 3;

      const updateData = {
        stock: newStock,
        reason: 'Testing inventory log creation'
      };

      // Update stock
      await request(app)
        .patch(`/api/v1/inventory/${productId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send(updateData);

      // Check inventory logs
      const logsResponse = await request(app)
        .get('/api/v1/inventory/logs')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(logsResponse.body.success).toBe(true);
      expect(Array.isArray(logsResponse.body.data)).toBe(true);

      // Find the log entry for our product
      const relevantLogs = logsResponse.body.data.filter((log: any) =>
        log.productId === productId && log.newStock === newStock
      );

      expect(relevantLogs.length).toBeGreaterThan(0);
      const logEntry = relevantLogs[0];
      expect(logEntry.previousStock).toBe(originalStock);
      expect(logEntry.newStock).toBe(newStock);
      expect(logEntry.quantity).toBe(newStock - originalStock);
      expect(logEntry.reason).toBe(updateData.reason);
    });
  });

  describe('GET /api/v1/inventory/logs', () => {
    it('should get inventory logs as viewer', async () => {
      const response = await request(app)
        .get('/api/v1/inventory/logs')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('pagination');

      if (response.body.data.length > 0) {
        const logEntry = response.body.data[0];
        expect(logEntry).toHaveProperty('_id');
        expect(logEntry).toHaveProperty('productId');
        expect(logEntry).toHaveProperty('userId');
        expect(logEntry).toHaveProperty('action');
        expect(logEntry).toHaveProperty('previousStock');
        expect(logEntry).toHaveProperty('newStock');
        expect(logEntry).toHaveProperty('quantity');
        expect(logEntry).toHaveProperty('timestamp');
      }
    });

    it('should filter logs by product ID', async () => {
      // Get a product ID that has logs
      const productsResponse = await request(app)
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${viewerToken}`);

      const productId = productsResponse.body.data[0]._id;

      const response = await request(app)
        .get(`/api/v1/inventory/logs?productId=${productId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      // All returned logs should be for the specified product
      response.body.data.forEach((log: any) => {
        expect(log.productId).toBe(productId);
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/inventory/logs?page=1&limit=2')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });
  });
});