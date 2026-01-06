import { Request, Response } from 'express';
import Joi from 'joi';
import { mockProductService } from '../data';
import { IProduct, IApiResponse, IPaginatedResponse, IAuthenticatedRequest } from '../types';
import { logger } from '../config/logger';

export class ProductController {
  // Validation schemas
  private static productSchema = Joi.object({
    name: Joi.string().min(1).required(),
    sku: Joi.string().min(1).required(),
    price: Joi.number().min(0).required(),
    category: Joi.string().min(1).required(),
    stock: Joi.number().min(0).required(),
    minStock: Joi.number().min(0).optional(),
    description: Joi.string().optional(),
    warehouseId: Joi.string().optional()
  });

  private static updateProductSchema = Joi.object({
    name: Joi.string().min(1).optional(),
    sku: Joi.string().min(1).optional(),
    price: Joi.number().min(0).optional(),
    category: Joi.string().min(1).optional(),
    stock: Joi.number().min(0).optional(),
    minStock: Joi.number().min(0).optional(),
    description: Joi.string().optional(),
    warehouseId: Joi.string().optional()
  });

  /**
   * Get all products with pagination
   */
  static async getAllProducts(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const category = req.query.category as string;

      let products: IProduct[];

      if (category) {
        products = await mockProductService.findByCategory(category);
      } else {
        products = await mockProductService.findAll();
      }

      // Simple pagination (in real app, this would be more sophisticated)
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedProducts = products.slice(startIndex, endIndex);

      const response: IPaginatedResponse<IProduct> = {
        success: true,
        message: 'Products retrieved successfully',
        data: paginatedProducts,
        pagination: {
          page,
          limit,
          total: products.length,
          totalPages: Math.ceil(products.length / limit)
        }
      };

      res.json(response);
    } catch (error) {
      logger.error('Get products error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get product by ID
   */
  static async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const product = await mockProductService.findById(id);
      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Product not found'
        });
        return;
      }

      const response: IApiResponse<IProduct> = {
        success: true,
        message: 'Product retrieved successfully',
        data: product
      };

      res.json(response);
    } catch (error) {
      logger.error('Get product by ID error', { error: error instanceof Error ? error.message : String(error), productId: req.params.id });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Create new product (Admin only)
   */
  static async createProduct(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Validate input
      const { error, value } = this.productSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          error: error.details[0].message
        });
        return;
      }

      // Check if SKU already exists
      const existingProduct = await mockProductService.findBySku(value.sku);
      if (existingProduct) {
        res.status(409).json({
          success: false,
          message: 'Product with this SKU already exists'
        });
        return;
      }

      // Create product
      const product = await mockProductService.create(value);

      // Log product creation
      logger.info('Product created', {
        productId: product._id,
        sku: product.sku,
        createdBy: req.user?.id
      });

      const response: IApiResponse<IProduct> = {
        success: true,
        message: 'Product created successfully',
        data: product
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Create product error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update product (Admin only)
   */
  static async updateProduct(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Validate input
      const { error, value } = this.updateProductSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          error: error.details[0].message
        });
        return;
      }

      // Check if product exists
      const existingProduct = await mockProductService.findById(id);
      if (!existingProduct) {
        res.status(404).json({
          success: false,
          message: 'Product not found'
        });
        return;
      }

      // Check if new SKU conflicts (if SKU is being updated)
      if (value.sku && value.sku !== existingProduct.sku) {
        const skuConflict = await mockProductService.findBySku(value.sku);
        if (skuConflict) {
          res.status(409).json({
            success: false,
            message: 'Product with this SKU already exists'
          });
          return;
        }
      }

      // Update product
      const updatedProduct = await mockProductService.update(id, value);
      if (!updatedProduct) {
        res.status(500).json({
          success: false,
          message: 'Failed to update product'
        });
        return;
      }

      // Log product update
      logger.info('Product updated', {
        productId: id,
        sku: updatedProduct.sku,
        updatedBy: req.user?.id
      });

      const response: IApiResponse<IProduct> = {
        success: true,
        message: 'Product updated successfully',
        data: updatedProduct
      };

      res.json(response);
    } catch (error) {
      logger.error('Update product error', { error: error instanceof Error ? error.message : String(error), productId: req.params.id });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Delete product (Admin only)
   */
  static async deleteProduct(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if product exists
      const product = await mockProductService.findById(id);
      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Product not found'
        });
        return;
      }

      // Delete product
      const deleted = await mockProductService.delete(id);
      if (!deleted) {
        res.status(500).json({
          success: false,
          message: 'Failed to delete product'
        });
        return;
      }

      // Log product deletion
      logger.info('Product deleted', {
        productId: id,
        sku: product.sku,
        deletedBy: req.user?.id
      });

      const response: IApiResponse = {
        success: true,
        message: 'Product deleted successfully'
      };

      res.json(response);
    } catch (error) {
      logger.error('Delete product error', { error: error instanceof Error ? error.message : String(error), productId: req.params.id });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get low stock products
   */
  static async getLowStockProducts(req: Request, res: Response): Promise<void> {
    try {
      const products = await mockProductService.findLowStock();

      const response: IApiResponse<IProduct[]> = {
        success: true,
        message: 'Low stock products retrieved successfully',
        data: products
      };

      res.json(response);
    } catch (error) {
      logger.error('Get low stock products error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}