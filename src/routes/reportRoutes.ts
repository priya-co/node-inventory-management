import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { AuthMiddleware } from '../middlewares/authMiddleware';
import { reportLimiter } from '../middlewares/rateLimiter';
import { ErrorHandler } from '../middlewares/errorHandler';

const router = Router();

// Apply rate limiting to report routes
router.use(reportLimiter);

/**
 * @route GET /api/v1/reports/low-stock
 * @desc Generate low-stock report
 * @query format: json|csv|pdf (default: json)
 * @access Private (Manager+)
 */
router.get(
  '/low-stock',
  AuthMiddleware.authenticate,
  AuthMiddleware.requireManagerOrAdmin,
  ErrorHandler.asyncHandler(ReportController.getLowStockReport)
);

/**
 * @route GET /api/v1/reports/inventory
 * @desc Generate full inventory report
 * @query format: json|csv|pdf (default: json)
 * @access Private (Viewer+)
 */
router.get(
  '/inventory',
  AuthMiddleware.authenticate,
  AuthMiddleware.requireViewerOrHigher,
  ErrorHandler.asyncHandler(ReportController.getInventoryReport)
);

/**
 * @route GET /api/v1/reports/movements
 * @desc Generate inventory movement report
 * @query days: number of days to look back (default: 30)
 * @query format: json|csv|pdf (default: json)
 * @access Private (Manager+)
 */
router.get(
  '/movements',
  AuthMiddleware.authenticate,
  AuthMiddleware.requireManagerOrAdmin,
  ErrorHandler.asyncHandler(ReportController.getMovementReport)
);

export default router;