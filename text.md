Capstone Project 5: Smart Inventory 
Management System (SIMS)
Overview
This case study demonstrates a full-stack Node.js platform for managing warehouse inventory. It 
focuses on backend development with Node.js, RESTful APIs, authentication & authorization, 
stock management, low-stock alerts, database integration with MongoDB, reporting, and 
deployment to Azure. The goal is to create a scalable, secure, and automated inventory system.
1. Features Covered
Node.js Core Concepts
• Event Loop: Handle multiple concurrent inventory updates without blocking.
• Non-blocking I/O: Read/write inventory logs and database updates asynchronously.
• Streams: Generate PDF or CSV stock reports efficiently.
• HTTP: Raw server for API testing.
• Utilities: fs for logs, crypto for secure order IDs, path for file paths.
• Modules: Organize inventory, product, and report logic into separate modules.
Express.js API
• Routing: RESTful endpoints for products, inventory, users, and reports.
• Middleware:
◦ Global: CORS, morgan, rate limiting.
◦ Custom: JWT verification, role validation.
• Advanced Routing:
◦ Route parameters: /products/:id
◦ Query strings: /inventory?status=low
◦ Nested routes: /warehouse/:id/inventory
• API Versioning & Documentation: /api/v1/ with Swagger/OpenAPI docs.
MongoDB + Mongoose
• Schema Design: Product, Warehouse, User, InventoryLog schemas with validation.
• Population: Link inventory changes to products and users.
• Aggregation: Generate low-stock reports, total stock per warehouse.
• Validation & Sanitization: Ensure only valid stock numbers and prices.
Authentication & Authorization
• JWT Authentication: Access & refresh tokens.
• RBAC:
◦ Admin: Manage products, warehouses, users.
◦ Warehouse Manager: Update stock and generate reports.
◦ Viewer: Read-only access to reports.
• Secure Password Storage: bcrypt.
• Security Features: Input validation, rate limiting, CSRF/XSS protection.
Error Handling
• Centralized error handling with proper status codes and JSON error messages.
Logging & Monitoring
• Logging: Winston for stock changes, morgan for API logs.
• Monitoring: Azure Application Insights for performance tracking.
Caching
• Frequently accessed product data cached in memory.
• Redis-ready hooks for high-volume stock queries.
Streams
• Generate real-time low-stock reports and stream as PDF/CSV.
Testing
• Unit Tests: Validate product schema, inventory update logic.
• Integration Tests: Supertest for API endpoints (stock update, report generation).
Deployment
• Deploy backend on Azure App Service (No Docker).
• Configure environment variables.
• Enable Application Insights for monitoring.
Project Structure
smart-inventory-system/
│
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── inventoryController.js
│   │   └── reportController.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Warehouse.js
│   │   └── InventoryLog.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── inventoryRoutes.js
│   │   └── reportRoutes.js
│   │
│   ├── middlewares/
│   │   ├── authMiddleware.js
│   │   ├── errorHandler.js
│   │   └── rateLimiter.js
│   │
│   ├── utils/
│   │   ├── reportGenerator.js
│   │   └── fileHandler.js
│   │
│   ├── config/
│   │   ├── db.js
│   │   ├── appConfig.js
│   │   └── logger.js
│   │
│   ├── tests/
│   │   ├── integration/
│   │   └── unit/
│   │
│   ├── app.js
│   └── server.js
│
├── uploads/                  # Uploaded reports
├── package.json
├── .env
├── .gitignore
└── README.md
Sample Execution & Outputs
1. User Login (Warehouse Manager)
Request
POST /api/v1/auth/login
Content-Type: application/json
{
}
  "email": "manager@example.com",
  "password": "Password123"
Response
{
}
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "dGhpc2lzdGhlcmVmcmVzaHRva2Vu..."
  }
2. Add New Product (Admin Role)
Request
POST /api/v1/products
Authorization: Bearer <Admin_Access_Token>
Content-Type: application/json
{
  "name": "Laptop Dell XPS 15",
  "sku": "DX15-2025",
  "price": 1200.99,
  "category": "Electronics",
  "stock": 50
}
Response
{
}
  "success": true,
  "message": "Product added successfully",
  "data": {
    "_id": "6460a4c1a5f8e23a1c90001",
    "name": "Laptop Dell XPS 15",
    "sku": "DX15-2025",
    "price": 1200.99,
    "category": "Electronics",
    "stock": 50,
    "createdAt": "2025-11-23T17:00:12.000Z"
  }
3. Update Inventory Stock (Warehouse Manager Role)
Request
PATCH /api/v1/inventory/6460a4c1a5f8e23a1c90001
Authorization: Bearer <Manager_Access_Token>
Content-Type: application/json
{
}
  "stock": 45
Response
{
  "success": true,
  "message": "Stock updated successfully",
  "data": {
    "productId": "6460a4c1a5f8e23a1c90001",
    "previousStock": 50,
    "updatedStock": 45,
    "updatedAt": "2025-11-23T17:15:12.000Z"
  }
}
4. Generate Low-Stock Report
Request
GET /api/v1/reports/low-stock
Authorization: Bearer <Manager_Access_Token>
Response
{
}
  "success": true,
  "data": [
    {
      "product": "Laptop Dell XPS 15",
      "sku": "DX15-2025",
      "stock": 5,
      "warehouse": "Main Warehouse"
    },
    {
      "product": "Wireless Mouse",
      "sku": "WM-2025",
      "stock": 3,
      "warehouse": "Main Warehouse"
    }
  ]
5. Sample Testing Outputs
Unit Test: Product Schema Validation
describe('Product Model Validation', () => {
  it('should require name, sku, price, and stock', async () 
=> {
    const product = new Product({});
    const error = product.validateSync();
    expect(error.errors['name']).toBeDefined();
    expect(error.errors['sku']).toBeDefined();
    expect(error.errors['price']).toBeDefined();
    expect(error.errors['stock']).toBeDefined();
  });
});
Output
PASS  src/tests/unit/productModel.test.js
  Product Model Validation
✓ should require name, sku, price, and stock (3 ms)
Integration Test: Update Stock API
const request = require('supertest');
const app = require('../../src/app');
describe('PATCH /api/v1/inventory/:id', () => {
  it('should update stock successfully', async () => {
    const res = await request(app)
      .patch('/api/v1/inventory/6460a4c1a5f8e23a1c90001')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ stock: 45 });
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.updatedStock).toEqual(45);
  });
});
Output
PASS  src/tests/integration/inventoryAPI.test.js
  PATCH /api/v1/inventory/:id
✓ should update stock successfully (25 ms)
✅ Summary
• Inventory Management: Products added, stock updated, low-stock alerts generated.
• Authentication & Authorization: Admins, Managers, Viewers roles.
• Reporting: Real-time reports for low-stock products.
• Testing: Unit tests for schema, integration tests for APIs.
• Deployment: Azure App Service with Application Insights monitoring