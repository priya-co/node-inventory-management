import { Request, Response } from 'express';
import Joi from 'joi';
import { mockProductService, mockInventoryLogService, mockWarehouseService } from '../data';
import { IInventoryLog, IApiResponse, IAuthenticatedRequest } from '../types';
import { logger } from '../config/logger';

export class InventoryController {
  // Validation schemas
  private static updateStockSchema = Joi.object({
    stock: Joi.number().min(0).required(),
    reason: Joi.string().optional()
  });

  /**
   * Get inventory status for all products
   */
  static async getInventoryStatus(req: Request, res: Response): Promise<void> {
    try {
      const products = await mockProductService.findAll();
      const warehouses = await mockWarehouseService.findAll();

      const inventoryData = products.map(product => {
        const warehouse = warehouses.find(w => w._id === product.warehouseId);
        return {
          productId: product._id,
          productName: product.name,
          sku: product.sku,
          category: product.category,
          currentStock: product.stock,
          minStock: product.minStock || 0,
          warehouse: warehouse?.name || 'Unknown',
          lastUpdated: product.updatedAt
        };
      });

      const response: IApiResponse = {
        success: true,
        message: 'Inventory status retrieved successfully',
        data: inventoryData
      };

      res.json(response);
    } catch (error) {
      logger.error('Get inventory status error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update product stock (Manager role required)
   */
  static async updateStock(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Validate input
      const { error, value } = this.updateStockSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          error: error.details[0].message
        });
        return;
      }

      const { stock: newStock, reason } = value;

      // Check if product exists
      const product = await mockProductService.findById(id);
      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Product not found'
        });
        return;
      }

      const previousStock = product.stock;

      // Update product stock
      const updatedProduct = await mockProductService.updateStock(id, newStock);
      if (!updatedProduct) {
        res.status(500).json({
          success: false,
          message: 'Failed to update stock'
        });
        return;
      }

      // Create inventory log entry
      await mockInventoryLogService.createStockUpdate(
        id,
        product.warehouseId || '',
        req.user!.id,
        previousStock,
        newStock,
        reason
      );

      // Log stock update
      logger.info('Stock updated', {
        productId: id,
        sku: product.sku,
        previousStock,
        newStock,
        updatedBy: req.user!.id
      });

      const response: IApiResponse = {
        success: true,
        message: 'Stock updated successfully',
        data: {
          productId: id,
          previousStock,
          updatedStock: newStock,
          updatedAt: updatedProduct.updatedAt
        }
      };

      res.json(response);
    } catch (error) {
      logger.error('Update stock error', { error: error instanceof Error ? error.message : String(error), productId: req.params.id });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get inventory logs
   */
  static async getInventoryLogs(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const productId = req.query.productId as string;

      let logs: IInventoryLog[];

      if (productId) {
        logs = await mockInventoryLogService.findByProduct(productId);
      } else {
        logs = await mockInventoryLogService.findAll();
      }

      // Simple pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedLogs = logs.slice(startIndex, endIndex);

      const response: any = {
        success: true,
        message: 'Inventory logs retrieved successfully',
        data: paginatedLogs,
        pagination: {
          page,
          limit,
          total: logs.length,
          totalPages: Math.ceil(logs.length / limit)
        }
      };

      res.json(response);
    } catch (error) {
      logger.error('Get inventory logs error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get inventory summary
   */
  static async getInventorySummary(req: Request, res: Response): Promise<void> {
    try {
      const products = await mockProductService.findAll();
      const logs = await mockInventoryLogService.findAll();

      const summary = {
        totalProducts: products.length,
        totalStockValue: products.reduce((sum, product) => sum + (product.stock * product.price), 0),
        lowStockProducts: products.filter(p => p.stock <= (p.minStock || 0)).length,
        outOfStockProducts: products.filter(p => p.stock === 0).length,
        recentMovements: logs.slice(0, 5), // Last 5 movements
        categoryBreakdown: await mockProductService.countByCategory()
      };

      const response: IApiResponse = {
        success: true,
        message: 'Inventory summary retrieved successfully',
        data: summary
      };

      res.json(response);
    } catch (error) {
      logger.error('Get inventory summary error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}