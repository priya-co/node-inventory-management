# Smart Inventory Management System (SIMS)

A comprehensive Node.js and TypeScript backend platform for managing warehouse inventory. This system implements modern web development practices including RESTful APIs, JWT authentication, role-based access control, automated reporting, and comprehensive testing.

## Features

### Core Features
- **Authentication & Authorization**: JWT-based authentication with refresh tokens and role-based access control (Admin, Manager, Viewer)
- **Product Management**: Complete CRUD operations for products with SKU validation and categorization
- **Inventory Management**: Real-time stock tracking, low-stock alerts, and inventory change logging
- **Automated Reporting**: Generate PDF/CSV reports for low-stock items, full inventory, and movement history
- **Rate Limiting**: API rate limiting to prevent abuse
- **Comprehensive Logging**: Winston-based logging with configurable levels and file rotation

### Technical Features
- **Type Safety**: Full TypeScript implementation with strict typing
- **Input Validation**: Joi schema validation for all API endpoints
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Security**: Helmet.js security headers, CORS configuration, input sanitization
- **Testing**: Unit tests for utilities, integration tests for API endpoints
- **Mock Data**: Complete mock data services for development and testing (no database required)

## Tech Stack

- **Runtime**: Node.js (ES2020+)
- **Language**: TypeScript 5.3+
- **Framework**: Express.js 4.18+
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: Joi 17.11+
- **Security**: Helmet.js, CORS, Express Rate Limit
- **Logging**: Winston 3.11+
- **Testing**: Jest 29.7+, Supertest 6.3+
- **PDF Generation**: PDFKit 0.14+
- **CSV Generation**: csv-writer 1.6+

## Project Structure

```
smart-inventory-system/
├── src/
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── productController.ts
│   │   ├── inventoryController.ts
│   │   └── reportController.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Product.ts
│   │   ├── Warehouse.ts
│   │   └── InventoryLog.ts
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── productRoutes.ts
│   │   ├── inventoryRoutes.ts
│   │   └── reportRoutes.ts
│   ├── middlewares/
│   │   ├── authMiddleware.ts
│   │   ├── errorHandler.ts
│   │   └── rateLimiter.ts
│   ├── utils/
│   │   ├── reportGenerator.ts
│   │   └── fileHandler.ts
│   ├── config/
│   │   ├── appConfig.ts
│   │   └── logger.ts
│   ├── types/
│   │   └── index.ts
│   ├── tests/
│   │   ├── setup.ts
│   │   ├── integration/
│   │   └── unit/
│   ├── app.ts
│   └── server.ts
├── uploads/
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18.0 or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart-inventory-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env
   ```

4. **Configure Environment Variables**
   Edit `.env` file with your configuration:
   ```env
   # Environment
   NODE_ENV=development
   PORT=3000

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=15m
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
   JWT_REFRESH_EXPIRE=7d

   # Rate Limiting
   RATE_LIMIT_WINDOW=15
   RATE_LIMIT_MAX_REQUESTS=100

   # Logging
   LOG_LEVEL=info
   ```

### Running the Application

```bash
# Development mode (with hot reload)
npm run dev

# Production build
npm run build

# Start production server
npm start
```

### Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests with coverage
npm test -- --coverage
```

## API Endpoints

### Authentication Endpoints
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| `POST` | `/api/v1/auth/login` | User login with email/password | Public |
| `POST` | `/api/v1/auth/register` | Register new user | Admin only |
| `POST` | `/api/v1/auth/refresh` | Refresh access token | Public (with refresh token) |
| `GET` | `/api/v1/auth/profile` | Get current user profile | Authenticated users |

### Product Management
| Method | Endpoint | Description | Access | Parameters |
|--------|----------|-------------|---------|------------|
| `GET` | `/api/v1/products` | Get all products with pagination | Viewer+ | `?page=1&limit=10&category=Electronics` |
| `GET` | `/api/v1/products/low-stock` | Get products with low stock | Viewer+ | - |
| `GET` | `/api/v1/products/:id` | Get product by ID | Viewer+ | - |
| `POST` | `/api/v1/products` | Create new product | Admin | Request body required |
| `PUT` | `/api/v1/products/:id` | Update product | Admin | Request body required |
| `DELETE` | `/api/v1/products/:id` | Delete product | Admin | - |

### Inventory Management
| Method | Endpoint | Description | Access | Parameters |
|--------|----------|-------------|---------|------------|
| `GET` | `/api/v1/inventory` | Get complete inventory status | Viewer+ | - |
| `GET` | `/api/v1/inventory/summary` | Get inventory summary with statistics | Viewer+ | - |
| `PATCH` | `/api/v1/inventory/:id` | Update product stock | Manager+ | Request body: `{stock: number, reason?: string}` |
| `GET` | `/api/v1/inventory/logs` | Get inventory change logs | Viewer+ | `?page=1&limit=20&productId=xxx` |

### Reporting
| Method | Endpoint | Description | Access | Parameters |
|--------|----------|-------------|---------|------------|
| `GET` | `/api/v1/reports/low-stock` | Generate low-stock report | Manager+ | `?format=json/csv/pdf` |
| `GET` | `/api/v1/reports/inventory` | Generate full inventory report | Viewer+ | `?format=json/csv/pdf` |
| `GET` | `/api/v1/reports/movements` | Generate inventory movement report | Manager+ | `?days=30&format=json/csv/pdf` |

### System Endpoints
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| `GET` | `/health` | Health check endpoint | Public |

## Request/Response Examples

## User Roles & Permissions

| Role | Description | Permissions |
|------|-------------|-------------|
| **Admin** | System administrator with full access | • Manage users (create/update/delete)<br>• Manage products (CRUD operations)<br>• Update inventory stock<br>• Generate all reports<br>• Access all endpoints |
| **Manager** | Warehouse manager with operational access | • Update inventory stock levels<br>• Generate reports (low-stock, movements)<br>• View all inventory data<br>• Cannot manage users or products |
| **Viewer** | Read-only access for reporting | • View inventory status and summaries<br>• Generate inventory reports<br>• View product catalog<br>• Cannot modify any data |

## Project Architecture

### Directory Structure
```
src/
├── config/           # Application configuration
│   ├── appConfig.ts  # App settings (CORS, rate limiting, etc.)
│   └── logger.ts     # Winston logger configuration
├── controllers/      # Route handlers
│   ├── authController.ts
│   ├── productController.ts
│   ├── inventoryController.ts
│   └── reportController.ts
├── middlewares/      # Express middlewares
│   ├── authMiddleware.ts    # JWT auth & role validation
│   ├── errorHandler.ts      # Global error handling
│   └── rateLimiter.ts       # API rate limiting
├── routes/           # API route definitions
│   ├── authRoutes.ts
│   ├── productRoutes.ts
│   ├── inventoryRoutes.ts
│   └── reportRoutes.ts
├── types/            # TypeScript type definitions
│   └── index.ts      # Interfaces and enums
├── utils/            # Utility functions
│   ├── auth.ts       # JWT token utilities
│   └── reportGenerator.ts # PDF/CSV report generation
├── data/             # Mock data services (development)
│   ├── mockUsers.ts
│   ├── mockProducts.ts
│   ├── mockWarehouses.ts
│   ├── mockInventoryLogs.ts
│   └── index.ts
├── tests/            # Test files
│   ├── setup.ts      # Test configuration
│   ├── unit/         # Unit tests
│   └── integration/  # API integration tests
├── app.ts            # Express app configuration
└── server.ts         # Server startup
```

### Key Design Patterns

- **MVC Architecture**: Controllers handle business logic, routes define endpoints
- **Middleware Chain**: Authentication, validation, and error handling
- **Service Layer**: Mock data services provide consistent data access
- **Repository Pattern**: Data access abstracted through service interfaces
- **Role-Based Access Control**: Hierarchical permission system
- **Centralized Error Handling**: Consistent error responses across the API

## Mock Data & Testing

The application uses mock data services, so no database setup is required. Pre-configured test accounts:

### Test Users
| Email | Password | Role | Permissions |
|-------|----------|------|-------------|
| `admin@example.com` | `Admin123!` | Admin | Full access to all features |
| `manager@example.com` | `Password123` | Manager | Update inventory, generate reports |
| `viewer@example.com` | `Viewer123` | Viewer | Read-only access |

### Sample Products
The system comes pre-loaded with sample products including laptops, office supplies, furniture, and appliances.

## API Usage Examples

### Authentication

#### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@example.com",
    "password": "Password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "dGhpc2lzdGhlcmVmcmVzaHRva2Vu...",
    "user": {
      "id": "user_manager_001",
      "email": "manager@example.com",
      "name": "Warehouse Manager",
      "role": "manager"
    }
  }
}
```

### Product Management

#### Get All Products
```bash
curl -X GET http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

#### Add New Product (Admin only)
```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wireless Keyboard",
    "sku": "WK-2025",
    "price": 89.99,
    "category": "Electronics",
    "stock": 25,
    "minStock": 5,
    "description": "Ergonomic wireless keyboard"
  }'
```

### Inventory Management

#### Update Stock (Manager+)
```bash
curl -X PATCH http://localhost:3000/api/v1/inventory/prod_001 \
  -H "Authorization: Bearer YOUR_MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stock": 45,
    "reason": "Received new shipment"
  }'
```

#### Get Inventory Summary
```bash
curl -X GET http://localhost:3000/api/v1/inventory/summary \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Reports

#### Generate Low-Stock Report (JSON)
```bash
curl -X GET http://localhost:3000/api/v1/reports/low-stock \
  -H "Authorization: Bearer YOUR_MANAGER_TOKEN"
```

#### Generate Low-Stock Report (CSV)
```bash
curl -X GET "http://localhost:3000/api/v1/reports/low-stock?format=csv" \
  -H "Authorization: Bearer YOUR_MANAGER_TOKEN" \
  -o low-stock-report.csv
```

#### Generate Inventory Movement Report (PDF)
```bash
curl -X GET "http://localhost:3000/api/v1/reports/movements?days=30&format=pdf" \
  -H "Authorization: Bearer YOUR_MANAGER_TOKEN" \
  -o movement-report.pdf
```

## Development & Deployment

### Development Workflow

1. **Code Style**: The project uses ESLint and Prettier for consistent code formatting
2. **Testing**: Run tests before committing changes
3. **Type Checking**: TypeScript strict mode ensures type safety
4. **Logging**: Winston logger provides comprehensive request/response logging

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | No |
| `PORT` | Server port | `3000` | No |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `JWT_EXPIRE` | Access token expiration | `15m` | No |
| `JWT_REFRESH_SECRET` | Refresh token secret | - | Yes |
| `JWT_REFRESH_EXPIRE` | Refresh token expiration | `7d` | No |
| `RATE_LIMIT_WINDOW` | Rate limit window (minutes) | `15` | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` | No |
| `LOG_LEVEL` | Logging level | `info` | No |

### Security Features

- **JWT Authentication**: Stateless authentication with refresh tokens
- **Password Hashing**: bcrypt with salt rounds for secure password storage
- **Rate Limiting**: Prevents API abuse with configurable limits
- **Input Validation**: Joi schemas validate all incoming data
- **Security Headers**: Helmet.js provides essential security headers
- **CORS Configuration**: Configurable cross-origin resource sharing

### Deployment

The application is designed to run on any Node.js hosting platform:

```bash
# Build the application
npm run build

# Start in production mode
npm start
```

For cloud deployment (Azure App Service, Heroku, etc.):
1. Set environment variables in your hosting platform
2. Configure production logging and monitoring
3. Set up proper CORS origins for your frontend
4. Configure rate limiting based on your needs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure all tests pass
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For questions or issues, please check the test files for API usage examples or create an issue in the repository.