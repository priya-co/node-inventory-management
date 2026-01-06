import request from 'supertest';
import app from '../../app';
import { UserRole } from '../../types';

describe('Report API', () => {
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

  describe('GET /api/v1/reports/low-stock', () => {
    it('should get low-stock report as manager', async () => {
      const response = await request(app)
        .get('/api/v1/reports/low-stock')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      // Should include low stock products
      response.body.data.forEach((item: any) => {
        expect(item).toHaveProperty('product');
        expect(item).toHaveProperty('sku');
        expect(item).toHaveProperty('stock');
        expect(item).toHaveProperty('warehouse');
        expect(item).toHaveProperty('minStock');
        // Stock should be at or below minimum
        expect(item.stock).toBeLessThanOrEqual(item.minStock || 0);
      });
    });

    it('should return CSV format when requested', async () => {
      const response = await request(app)
        .get('/api/v1/reports/low-stock?format=csv')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment; filename="low-stock-report.csv"');
      expect(typeof response.text).toBe('string');

      // Should contain CSV header
      expect(response.text).toContain('Product Name');
      expect(response.text).toContain('SKU');
      expect(response.text).toContain('Current Stock');
    });

    it('should return PDF format when requested', async () => {
      const response = await request(app)
        .get('/api/v1/reports/low-stock?format=pdf')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment; filename="low-stock-report.pdf"');
      expect(Buffer.isBuffer(response.body)).toBe(true);
    });

    it('should return 403 for viewer trying to access low-stock report', async () => {
      const response = await request(app)
        .get('/api/v1/reports/low-stock')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Insufficient permissions');
    });
  });

  describe('GET /api/v1/reports/inventory', () => {
    it('should get full inventory report as viewer', async () => {
      const response = await request(app)
        .get('/api/v1/reports/inventory')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Check structure of report data
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

    it('should return CSV format when requested', async () => {
      const response = await request(app)
        .get('/api/v1/reports/inventory?format=csv')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment; filename="inventory-report.csv"');
      expect(typeof response.text).toBe('string');

      // Should contain CSV header
      expect(response.text).toContain('Product Name');
      expect(response.text).toContain('SKU');
      expect(response.text).toContain('Category');
      expect(response.text).toContain('Current Stock');
    });

    it('should return PDF format when requested', async () => {
      const response = await request(app)
        .get('/api/v1/reports/inventory?format=pdf')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment; filename="inventory-report.pdf"');
      expect(Buffer.isBuffer(response.body)).toBe(true);
    });
  });

  describe('GET /api/v1/reports/movements', () => {
    it('should get inventory movement report as manager', async () => {
      const response = await request(app)
        .get('/api/v1/reports/movements')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      // Check structure of movement data
      if (response.body.data.length > 0) {
        const firstItem = response.body.data[0];
        expect(firstItem).toHaveProperty('date');
        expect(firstItem).toHaveProperty('product');
        expect(firstItem).toHaveProperty('sku');
        expect(firstItem).toHaveProperty('action');
        expect(firstItem).toHaveProperty('quantity');
        expect(firstItem).toHaveProperty('previousStock');
        expect(firstItem).toHaveProperty('newStock');
        expect(firstItem).toHaveProperty('warehouse');
        expect(firstItem).toHaveProperty('reason');
      }
    });

    it('should filter by days parameter', async () => {
      const days = 7;
      const response = await request(app)
        .get(`/api/v1/reports/movements?days=${days}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // All movements should be within the specified days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      response.body.data.forEach((item: any) => {
        const movementDate = new Date(item.date);
        expect(movementDate.getTime()).toBeGreaterThanOrEqual(cutoffDate.getTime());
      });
    });

    it('should return CSV format when requested', async () => {
      const response = await request(app)
        .get('/api/v1/reports/movements?format=csv')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment; filename="movement-report-30days.csv"');
      expect(typeof response.text).toBe('string');

      // Should contain CSV header
      expect(response.text).toContain('Date');
      expect(response.text).toContain('Product');
      expect(response.text).toContain('Action');
      expect(response.text).toContain('Quantity');
    });

    it('should return PDF format when requested', async () => {
      const response = await request(app)
        .get('/api/v1/reports/movements?format=pdf')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment; filename="movement-report-30days.pdf"');
      expect(Buffer.isBuffer(response.body)).toBe(true);
    });

    it('should return 403 for viewer trying to access movement report', async () => {
      const response = await request(app)
        .get('/api/v1/reports/movements')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Insufficient permissions');
    });

    it('should handle custom days parameter in filename', async () => {
      const customDays = 15;
      const response = await request(app)
        .get(`/api/v1/reports/movements?days=${customDays}&format=csv`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.headers['content-disposition']).toContain(`attachment; filename="movement-report-${customDays}days.csv"`);
    });
  });

  describe('Rate limiting', () => {
    it('should enforce rate limiting for report endpoints', async () => {
      // Make multiple requests quickly to trigger rate limit
      const promises = [];
      for (let i = 0; i < 15; i++) { // More than the 10 per hour limit
        promises.push(
          request(app)
            .get('/api/v1/reports/inventory')
            .set('Authorization', `Bearer ${viewerToken}`)
        );
      }

      const responses = await Promise.all(promises);

      // At least one should be rate limited (429)
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);

      if (rateLimitedResponses.length > 0) {
        const rateLimitedResponse = rateLimitedResponses[0];
        expect(rateLimitedResponse.body.success).toBe(false);
        expect(rateLimitedResponse.body.message).toContain('Too many report requests');
      }
    });
  });
});