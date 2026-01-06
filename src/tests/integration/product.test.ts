import request from 'supertest';
import app from '../../app';
import { UserRole } from '../../types';

describe('Product API', () => {
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

  describe('GET /api/v1/products', () => {
    it('should get all products as viewer', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body).toHaveProperty('pagination');
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get('/api/v1/products?category=Electronics')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      response.body.data.forEach((product: any) => {
        expect(product.category).toBe('Electronics');
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/products?page=1&limit=2')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('totalPages');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });
  });

  describe('GET /api/v1/products/low-stock', () => {
    it('should get low stock products as viewer', async () => {
      const response = await request(app)
        .get('/api/v1/products/low-stock')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      // Should include products with stock <= minStock
      response.body.data.forEach((product: any) => {
        expect(product.stock).toBeLessThanOrEqual(product.minStock || 0);
      });
    });
  });

  describe('GET /api/v1/products/:id', () => {
    it('should get product by ID as viewer', async () => {
      // First get all products to get an ID
      const productsResponse = await request(app)
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${viewerToken}`);

      const productId = productsResponse.body.data[0]._id;

      const response = await request(app)
        .get(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(productId);
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('sku');
      expect(response.body.data).toHaveProperty('price');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/v1/products/nonexistent-id')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found');
    });
  });

  describe('POST /api/v1/products', () => {
    it('should create product as admin', async () => {
      const newProduct = {
        name: 'Test Product',
        sku: 'TEST-001',
        price: 99.99,
        category: 'Test Category',
        stock: 10,
        minStock: 5,
        description: 'Test product description'
      };

      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newProduct)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product created successfully');
      expect(response.body.data.name).toBe(newProduct.name);
      expect(response.body.data.sku).toBe(newProduct.sku);
      expect(response.body.data.price).toBe(newProduct.price);
      expect(response.body.data).toHaveProperty('_id');
    });

    it('should return 403 for manager trying to create product', async () => {
      const newProduct = {
        name: 'Unauthorized Product',
        sku: 'UNAUTH-001',
        price: 49.99,
        category: 'Test',
        stock: 5
      };

      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(newProduct)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Insufficient permissions');
    });

    it('should return 409 for duplicate SKU', async () => {
      const duplicateProduct = {
        name: 'Duplicate Product',
        sku: 'DX15-2025', // Already exists
        price: 199.99,
        category: 'Electronics',
        stock: 5
      };

      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateProduct)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product with this SKU already exists');
    });

    it('should return 400 for invalid data', async () => {
      const invalidProduct = {
        name: '',
        sku: 'INVALID',
        price: -10,
        category: '',
        stock: -5
      };

      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidProduct)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
      expect(response.body.error).toBeDefined();
    });
  });

  describe('PUT /api/v1/products/:id', () => {
    let testProductId: string;

    beforeAll(async () => {
      // Create a test product for updating
      const newProduct = {
        name: 'Update Test Product',
        sku: 'UPDATE-001',
        price: 79.99,
        category: 'Test',
        stock: 8,
        minStock: 3
      };

      const createResponse = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newProduct);

      testProductId = createResponse.body.data._id;
    });

    it('should update product as admin', async () => {
      const updateData = {
        name: 'Updated Test Product',
        price: 89.99,
        stock: 12
      };

      const response = await request(app)
        .put(`/api/v1/products/${testProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product updated successfully');
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.price).toBe(updateData.price);
      expect(response.body.data.stock).toBe(updateData.stock);
    });

    it('should return 403 for manager trying to update product', async () => {
      const updateData = {
        name: 'Unauthorized Update'
      };

      const response = await request(app)
        .put(`/api/v1/products/${testProductId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Insufficient permissions');
    });
  });

  describe('DELETE /api/v1/products/:id', () => {
    let deleteProductId: string;

    beforeAll(async () => {
      // Create a test product for deleting
      const newProduct = {
        name: 'Delete Test Product',
        sku: 'DELETE-001',
        price: 59.99,
        category: 'Test',
        stock: 6
      };

      const createResponse = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newProduct);

      deleteProductId = createResponse.body.data._id;
    });

    it('should delete product as admin', async () => {
      const response = await request(app)
        .delete(`/api/v1/products/${deleteProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product deleted successfully');

      // Verify product is deleted
      const getResponse = await request(app)
        .get(`/api/v1/products/${deleteProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(getResponse.body.success).toBe(false);
      expect(getResponse.body.message).toBe('Product not found');
    });

    it('should return 403 for manager trying to delete product', async () => {
      // Create another product for this test
      const newProduct = {
        name: 'Delete Test Product 2',
        sku: 'DELETE-002',
        price: 69.99,
        category: 'Test',
        stock: 7
      };

      const createResponse = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newProduct);

      const productId = createResponse.body.data._id;

      const response = await request(app)
        .delete(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Insufficient permissions');
    });
  });
});