import { IWarehouse } from '../types';

class MockWarehouseService {
  private warehouses: IWarehouse[] = [
    {
      _id: 'wh_main',
      name: 'Main Warehouse',
      location: '123 Industrial Ave, City, State 12345',
      capacity: 10000,
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      _id: 'wh_storage',
      name: 'Storage Facility',
      location: '456 Storage Blvd, City, State 12346',
      capacity: 5000,
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      _id: 'wh_backup',
      name: 'Backup Warehouse',
      location: '789 Reserve St, City, State 12347',
      capacity: 3000,
      isActive: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }
  ];

  async findAll(): Promise<IWarehouse[]> {
    return this.warehouses.map(warehouse => ({ ...warehouse }));
  }

  async findById(id: string): Promise<IWarehouse | null> {
    const warehouse = this.warehouses.find(w => w._id === id);
    return warehouse ? { ...warehouse } : null;
  }

  async findActive(): Promise<IWarehouse[]> {
    return this.warehouses
      .filter(warehouse => warehouse.isActive)
      .map(warehouse => ({ ...warehouse }));
  }

  async create(warehouseData: Omit<IWarehouse, '_id' | 'createdAt' | 'updatedAt'>): Promise<IWarehouse> {
    const newWarehouse: IWarehouse = {
      _id: `wh_${Date.now()}`,
      ...warehouseData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.warehouses.push(newWarehouse);
    return { ...newWarehouse };
  }

  async update(id: string, updateData: Partial<IWarehouse>): Promise<IWarehouse | null> {
    const index = this.warehouses.findIndex(w => w._id === id);
    if (index === -1) return null;

    this.warehouses[index] = {
      ...this.warehouses[index],
      ...updateData,
      updatedAt: new Date()
    };
    return { ...this.warehouses[index] };
  }

  async delete(id: string): Promise<boolean> {
    const index = this.warehouses.findIndex(w => w._id === id);
    if (index === -1) return false;

    this.warehouses.splice(index, 1);
    return true;
  }

  // Utility methods
  async count(): Promise<number> {
    return this.warehouses.length;
  }

  async getTotalCapacity(): Promise<number> {
    return this.warehouses
      .filter(w => w.isActive)
      .reduce((total, warehouse) => total + warehouse.capacity, 0);
  }
}

export const mockWarehouseService = new MockWarehouseService();