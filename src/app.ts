import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { appConfig } from './config/appConfig';
import { logger } from './config/logger';
import { ErrorHandler } from './middlewares/errorHandler';
import { apiLimiter } from './middlewares/rateLimiter';

// Import routes
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import reportRoutes from './routes/reportRoutes';

const app = express();

// Security middleware
if (appConfig.security.helmet) {
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));
}

// CORS configuration
app.use(cors(appConfig.cors));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => {
      logger.info(message.trim());
    }
  }
}));

// Rate limiting
if (appConfig.security.rateLimiting) {
  app.use('/api/', apiLimiter);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Smart Inventory Management System is running',
    timestamp: new Date().toISOString(),
    environment: appConfig.nodeEnv,
    version: '1.0.0'
  });
});

// API routes
app.use(`${appConfig.api.prefix}/auth`, authRoutes);
app.use(`${appConfig.api.prefix}/products`, productRoutes);
app.use(`${appConfig.api.prefix}/inventory`, inventoryRoutes);
app.use(`${appConfig.api.prefix}/reports`, reportRoutes);

// 404 handler
app.use(ErrorHandler.notFound);

// Global error handler
app.use(ErrorHandler.handle);

export default app;