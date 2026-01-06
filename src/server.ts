import app from './app';
import { appConfig } from './config/appConfig';
import { logger } from './config/logger';

const PORT = appConfig.port;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Smart Inventory Management System running on port ${PORT}`);
  logger.info(`📊 Environment: ${appConfig.nodeEnv}`);
  logger.info(`🔗 API Base URL: http://localhost:${PORT}${appConfig.api.prefix}`);
  logger.info(`💚 Health Check: http://localhost:${PORT}/health`);

  // Log available endpoints in development
  if (appConfig.nodeEnv === 'development') {
    logger.info('📋 Available endpoints:');
    logger.info(`   POST ${appConfig.api.prefix}/auth/login`);
    logger.info(`   POST ${appConfig.api.prefix}/auth/register (Admin)`);
    logger.info(`   GET  ${appConfig.api.prefix}/products`);
    logger.info(`   POST ${appConfig.api.prefix}/products (Admin)`);
    logger.info(`   PATCH ${appConfig.api.prefix}/inventory/:id (Manager)`);
    logger.info(`   GET  ${appConfig.api.prefix}/reports/low-stock (Manager)`);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error, promise) => {
  logger.error('Unhandled Promise Rejection:', err.message);
  logger.error('Stack:', err.stack);

  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception:', err.message);
  logger.error('Stack:', err.stack);

  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
  });
});

export default server;