import { Router } from 'express';
import { InventoryController } from '../controllers/inventoryController';
import { AuthMiddleware } from '../middlewares/authMiddleware';
import { ErrorHandler } from '../middlewares/errorHandler';

const router = Router();

/**
 * @route GET /api/v1/inventory
 * @desc Get inventory status for all products
 * @access Private (Viewer+)
 */
router.get(
  '/',
  AuthMiddleware.authenticate,
  AuthMiddleware.requireViewerOrHigher,
  ErrorHandler.asyncHandler(InventoryController.getInventoryStatus)
);

/**
 * @route GET /api/v1/inventory/summary
 * @desc Get inventory summary with statistics
 * @access Private (Viewer+)
 */
router.get(
  '/summary',
  AuthMiddleware.authenticate,
  AuthMiddleware.requireViewerOrHigher,
  ErrorHandler.asyncHandler(InventoryController.getInventorySummary)
);

/**
 * @route PATCH /api/v1/inventory/:id
 * @desc Update product stock
 * @access Private (Manager+)
 */
router.patch(
  '/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.requireManagerOrAdmin,
  ErrorHandler.asyncHandler(InventoryController.updateStock)
);

/**
 * @route GET /api/v1/inventory/logs
 * @desc Get inventory change logs
 * @access Private (Viewer+)
 */
router.get(
  '/logs',
  AuthMiddleware.authenticate,
  AuthMiddleware.requireViewerOrHigher,
  ErrorHandler.asyncHandler(InventoryController.getInventoryLogs)
);

export default router;