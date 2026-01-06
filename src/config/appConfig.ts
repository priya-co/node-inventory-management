// Application configuration
export const appConfig = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',

  // API configuration
  api: {
    version: 'v1',
    prefix: '/api/v1'
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  },

  // Security
  security: {
    helmet: true,
    rateLimiting: true
  },

  // Pagination defaults
  pagination: {
    defaultLimit: 10,
    maxLimit: 100
  },

  // File upload
  upload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
  }
};