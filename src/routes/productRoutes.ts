import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { AuthMiddleware } from '../middlewares/authMiddleware';
import { ErrorHandler } from '../middlewares/errorHandler';

const router = Router();

/**
 * @route GET /api/v1/products
 * @desc Get all products with pagination and filtering
 * @access Private (Viewer+)
 */
router.get(
  '/',
  AuthMiddleware.authenticate,
  AuthMiddleware.requireViewerOrHigher,
  ErrorHandler.asyncHandler(ProductController.getAllProducts)
);

/**
 * @route GET /api/v1/products/low-stock
 * @desc Get low stock products
 * @access Private (Viewer+)
 */
router.get(
  '/low-stock',
  AuthMiddleware.authenticate,
  AuthMiddleware.requireViewerOrHigher,
  ErrorHandler.asyncHandler(ProductController.getLowStockProducts)
);

/**
 * @route GET /api/v1/products/:id
 * @desc Get product by ID
 * @access Private (Viewer+)
 */
router.get(
  '/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.requireViewerOrHigher,
  ErrorHandler.asyncHandler(ProductController.getProductById)
);

/**
 * @route POST /api/v1/products
 * @desc Create new product
 * @access Private (Admin)
 */
router.post(
  '/',
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  ErrorHandler.asyncHandler(ProductController.createProduct)
);

/**
 * @route PUT /api/v1/products/:id
 * @desc Update product
 * @access Private (Admin)
 */
router.put(
  '/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  ErrorHandler.asyncHandler(ProductController.updateProduct)
);

/**
 * @route DELETE /api/v1/products/:id
 * @desc Delete product
 * @access Private (Admin)
 */
router.delete(
  '/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  ErrorHandler.asyncHandler(ProductController.deleteProduct)
);

export default router;