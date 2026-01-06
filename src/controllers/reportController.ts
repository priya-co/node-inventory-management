import { Request, Response } from 'express';
import { mockProductService, mockWarehouseService, mockInventoryLogService } from '../data';
import { ILowStockReport, IInventoryReport, IApiResponse } from '../types';
import { logger } from '../config/logger';
import { ReportGenerator } from '../utils/reportGenerator';

export class ReportController {
  /**
   * Generate low-stock report
   */
  static async getLowStockReport(req: Request, res: Response): Promise<void> {
    try {
      const format = req.query.format as 'json' | 'csv' | 'pdf' || 'json';

      const lowStockProducts = await mockProductService.findLowStock();
      const warehouses = await mockWarehouseService.findAll();

      const reportData: ILowStockReport[] = lowStockProducts.map(product => {
        const warehouse = warehouses.find(w => w._id === product.warehouseId);
        return {
          product: product.name,
          sku: product.sku,
          stock: product.stock,
          warehouse: warehouse?.name || 'Unknown',
          minStock: product.minStock || 0
        };
      });

      if (format === 'csv') {
        const csvContent = ReportGenerator.generateCSV(reportData, [
          { key: 'product', header: 'Product Name' },
          { key: 'sku', header: 'SKU' },
          { key: 'stock', header: 'Current Stock' },
          { key: 'warehouse', header: 'Warehouse' },
          { key: 'minStock', header: 'Minimum Stock' }
        ]);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="low-stock-report.csv"');
        res.send(csvContent);
        return;
      }

      if (format === 'pdf') {
        const pdfBuffer = await ReportGenerator.generatePDF(
          reportData,
          'Low Stock Report',
          ['Product Name', 'SKU', 'Current Stock', 'Warehouse', 'Minimum Stock']
        );

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="low-stock-report.pdf"');
        res.send(pdfBuffer);
        return;
      }

      // Default JSON response
      const response: IApiResponse<ILowStockReport[]> = {
        success: true,
        message: 'Low stock report generated successfully',
        data: reportData
      };

      res.json(response);
    } catch (error) {
      logger.error('Generate low stock report error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Generate full inventory report
   */
  static async getInventoryReport(req: Request, res: Response): Promise<void> {
    try {
      const format = req.query.format as 'json' | 'csv' | 'pdf' || 'json';

      const products = await mockProductService.findAll();
      const warehouses = await mockWarehouseService.findAll();

      const reportData: IInventoryReport[] = products.map(product => {
        const warehouse = warehouses.find(w => w._id === product.warehouseId);
        return {
          productId: product._id!,
          productName: product.name,
          sku: product.sku,
          category: product.category,
          currentStock: product.stock,
          minStock: product.minStock || 0,
          warehouse: warehouse?.name || 'Unknown',
          lastUpdated: product.updatedAt!
        };
      });

      if (format === 'csv') {
        const csvContent = ReportGenerator.generateCSV(reportData, [
          { key: 'productName', header: 'Product Name' },
          { key: 'sku', header: 'SKU' },
          { key: 'category', header: 'Category' },
          { key: 'currentStock', header: 'Current Stock' },
          { key: 'minStock', header: 'Minimum Stock' },
          { key: 'warehouse', header: 'Warehouse' },
          { key: 'lastUpdated', header: 'Last Updated' }
        ]);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="inventory-report.csv"');
        res.send(csvContent);
        return;
      }

      if (format === 'pdf') {
        const pdfBuffer = await ReportGenerator.generatePDF(
          reportData,
          'Inventory Report',
          ['Product Name', 'SKU', 'Category', 'Current Stock', 'Minimum Stock', 'Warehouse', 'Last Updated']
        );

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="inventory-report.pdf"');
        res.send(pdfBuffer);
        return;
      }

      // Default JSON response
      const response: IApiResponse<IInventoryReport[]> = {
        success: true,
        message: 'Inventory report generated successfully',
        data: reportData
      };

      res.json(response);
    } catch (error) {
      logger.error('Generate inventory report error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Generate inventory movement report
   */
  static async getMovementReport(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const format = req.query.format as 'json' | 'csv' | 'pdf' || 'json';

      const logs = await mockInventoryLogService.findAll();
      const products = await mockProductService.findAll();
      const warehouses = await mockWarehouseService.findAll();

      // Filter logs by date range
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const recentLogs = logs.filter(log =>
        new Date(log.timestamp!) >= cutoffDate
      );

      const reportData = recentLogs.map(log => {
        const product = products.find(p => p._id === log.productId);
        const warehouse = warehouses.find(w => w._id === log.warehouseId);
        return {
          date: log.timestamp,
          product: product?.name || 'Unknown',
          sku: product?.sku || 'Unknown',
          action: log.action,
          quantity: log.quantity,
          previousStock: log.previousStock,
          newStock: log.newStock,
          warehouse: warehouse?.name || 'Unknown',
          reason: log.reason || 'N/A'
        };
      });

      if (format === 'csv') {
        const csvContent = ReportGenerator.generateCSV(reportData, [
          { key: 'date', header: 'Date' },
          { key: 'product', header: 'Product' },
          { key: 'sku', header: 'SKU' },
          { key: 'action', header: 'Action' },
          { key: 'quantity', header: 'Quantity' },
          { key: 'previousStock', header: 'Previous Stock' },
          { key: 'newStock', header: 'New Stock' },
          { key: 'warehouse', header: 'Warehouse' },
          { key: 'reason', header: 'Reason' }
        ]);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="movement-report-${days}days.csv"`);
        res.send(csvContent);
        return;
      }

      if (format === 'pdf') {
        const pdfBuffer = await ReportGenerator.generatePDF(
          reportData,
          `Inventory Movement Report (${days} days)`,
          ['Date', 'Product', 'SKU', 'Action', 'Quantity', 'Previous Stock', 'New Stock', 'Warehouse', 'Reason']
        );

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="movement-report-${days}days.pdf"`);
        res.send(pdfBuffer);
        return;
      }

      // Default JSON response
      const response: IApiResponse = {
        success: true,
        message: 'Movement report generated successfully',
        data: reportData
      };

      res.json(response);
    } catch (error) {
      logger.error('Generate movement report error', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}