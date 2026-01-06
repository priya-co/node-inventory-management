import { IInventoryLog } from '../types';

class MockInventoryLogService {
  private logs: IInventoryLog[] = [
    {
      _id: 'log_001',
      productId: 'prod_001',
      warehouseId: 'wh_main',
      userId: 'user_manager_001',
      action: 'update',
      previousStock: 50,
      newStock: 45,
      quantity: -5,
      reason: 'Sold to customer',
      timestamp: new Date('2024-01-15T10:00:00Z')
    },
    {
      _id: 'log_002',
      productId: 'prod_002',
      warehouseId: 'wh_main',
      userId: 'user_manager_001',
      action: 'update',
      previousStock: 20,
      newStock: 15,
      quantity: -5,
      reason: 'Inventory adjustment',
      timestamp: new Date('2024-01-14T14:30:00Z')
    },
    {
      _id: 'log_003',
      productId: 'prod_003',
      warehouseId: 'wh_main',
      userId: 'user_admin_001',
      action: 'add',
      previousStock: 0,
      newStock: 25,
      quantity: 25,
      reason: 'Initial stock',
      timestamp: new Date('2024-01-10T09:00:00Z')
    },
    {
      _id: 'log_004',
      productId: 'prod_001',
      warehouseId: 'wh_main',
      userId: 'user_manager_001',
      action: 'update',
      previousStock: 45,
      newStock: 5,
      quantity: -40,
      reason: 'Bulk sale',
      timestamp: new Date('2024-01-20T16:45:00Z')
    }
  ];

  async findAll(): Promise<IInventoryLog[]> {
    return this.logs.map(log => ({ ...log })).sort((a, b) =>
      new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime()
    );
  }

  async findById(id: string): Promise<IInventoryLog | null> {
    const log = this.logs.find(l => l._id === id);
    return log ? { ...log } : null;
  }

  async findByProduct(productId: string): Promise<IInventoryLog[]> {
    return this.logs
      .filter(log => log.productId === productId)
      .map(log => ({ ...log }))
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());
  }

  async findByWarehouse(warehouseId: string): Promise<IInventoryLog[]> {
    return this.logs
      .filter(log => log.warehouseId === warehouseId)
      .map(log => ({ ...log }))
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());
  }

  async findByUser(userId: string): Promise<IInventoryLog[]> {
    return this.logs
      .filter(log => log.userId === userId)
      .map(log => ({ ...log }))
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());
  }

  async findRecent(limit: number = 10): Promise<IInventoryLog[]> {
    return this.logs
      .map(log => ({ ...log }))
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())
      .slice(0, limit);
  }

  async create(logData: Omit<IInventoryLog, '_id' | 'timestamp'>): Promise<IInventoryLog> {
    const newLog: IInventoryLog = {
      _id: `log_${Date.now()}`,
      ...logData,
      timestamp: new Date()
    };
    this.logs.push(newLog);
    return { ...newLog };
  }

  async createStockUpdate(
    productId: string,
    warehouseId: string,
    userId: string,
    previousStock: number,
    newStock: number,
    reason?: string
  ): Promise<IInventoryLog> {
    const quantity = newStock - previousStock;
    const action = quantity > 0 ? 'add' : quantity < 0 ? 'update' : 'update';

    return this.create({
      productId,
      warehouseId,
      userId,
      action,
      previousStock,
      newStock,
      quantity,
      reason: reason || 'Stock update'
    });
  }

  // Utility methods
  async count(): Promise<number> {
    return this.logs.length;
  }

  async getStockMovements(productId: string, days: number = 30): Promise<IInventoryLog[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.logs
      .filter(log =>
        log.productId === productId &&
        new Date(log.timestamp!) >= cutoffDate
      )
      .map(log => ({ ...log }))
      .sort((a, b) => new Date(a.timestamp!).getTime() - new Date(b.timestamp!).getTime());
  }

  async getTotalMovementsByAction(): Promise<Record<string, number>> {
    const actionCount: Record<string, number> = {};
    this.logs.forEach(log => {
      actionCount[log.action] = (actionCount[log.action] || 0) + 1;
    });
    return actionCount;
  }
}

export const mockInventoryLogService = new MockInventoryLogService();