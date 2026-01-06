import { IProduct } from '../types';

class MockProductService {
  private products: IProduct[] = [
    {
      _id: 'prod_001',
      name: 'Laptop Dell XPS 15',
      sku: 'DX15-2025',
      price: 1200.99,
      category: 'Electronics',
      stock: 5, // Low stock
      minStock: 10,
      description: 'High-performance laptop for professionals',
      warehouseId: 'wh_main',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      _id: 'prod_002',
      name: 'Wireless Mouse',
      sku: 'WM-2025',
      price: 25.99,
      category: 'Electronics',
      stock: 3, // Low stock
      minStock: 15,
      description: 'Ergonomic wireless mouse',
      warehouseId: 'wh_main',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      _id: 'prod_003',
      name: 'Office Chair',
      sku: 'OC-2025',
      price: 199.99,
      category: 'Furniture',
      stock: 25,
      minStock: 5,
      description: 'Comfortable ergonomic office chair',
      warehouseId: 'wh_main',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      _id: 'prod_004',
      name: 'Printer Paper A4',
      sku: 'PP-A4-500',
      price: 8.99,
      category: 'Office Supplies',
      stock: 150,
      minStock: 20,
      description: '500 sheets of premium A4 printer paper',
      warehouseId: 'wh_storage',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      _id: 'prod_005',
      name: 'Coffee Maker',
      sku: 'CM-DELUXE',
      price: 89.99,
      category: 'Appliances',
      stock: 12,
      minStock: 8,
      description: '12-cup programmable coffee maker',
      warehouseId: 'wh_main',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }
  ];

  async findAll(): Promise<IProduct[]> {
    return this.products.map(product => ({ ...product }));
  }

  async findById(id: string): Promise<IProduct | null> {
    const product = this.products.find(p => p._id === id);
    return product ? { ...product } : null;
  }

  async findBySku(sku: string): Promise<IProduct | null> {
    const product = this.products.find(p => p.sku === sku);
    return product ? { ...product } : null;
  }

  async findLowStock(): Promise<IProduct[]> {
    return this.products
      .filter(product => product.stock <= (product.minStock || 0))
      .map(product => ({ ...product }));
  }

  async findByCategory(category: string): Promise<IProduct[]> {
    return this.products
      .filter(product => product.category.toLowerCase() === category.toLowerCase())
      .map(product => ({ ...product }));
  }

  async create(productData: Omit<IProduct, '_id' | 'createdAt' | 'updatedAt'>): Promise<IProduct> {
    const newProduct: IProduct = {
      _id: `prod_${Date.now()}`,
      ...productData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.products.push(newProduct);
    return { ...newProduct };
  }

  async update(id: string, updateData: Partial<IProduct>): Promise<IProduct | null> {
    const index = this.products.findIndex(p => p._id === id);
    if (index === -1) return null;

    this.products[index] = {
      ...this.products[index],
      ...updateData,
      updatedAt: new Date()
    };
    return { ...this.products[index] };
  }

  async updateStock(id: string, newStock: number): Promise<IProduct | null> {
    const index = this.products.findIndex(p => p._id === id);
    if (index === -1) return null;

    this.products[index].stock = newStock;
    this.products[index].updatedAt = new Date();
    return { ...this.products[index] };
  }

  async delete(id: string): Promise<boolean> {
    const index = this.products.findIndex(p => p._id === id);
    if (index === -1) return false;

    this.products.splice(index, 1);
    return true;
  }

  // Utility methods
  async count(): Promise<number> {
    return this.products.length;
  }

  async countByCategory(): Promise<Record<string, number>> {
    const categoryCount: Record<string, number> = {};
    this.products.forEach(product => {
      categoryCount[product.category] = (categoryCount[product.category] || 0) + 1;
    });
    return categoryCount;
  }
}

export const mockProductService = new MockProductService();