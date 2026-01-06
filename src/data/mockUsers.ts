import bcrypt from 'bcryptjs';
import { IUser, UserRole } from '../types';

class MockUserService {
  private users: IUser[] = [
    {
      _id: 'user_admin_001',
      email: 'admin@example.com',
      password: bcrypt.hashSync('Admin123!', 10),
      name: 'System Admin',
      role: UserRole.ADMIN,
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      _id: 'user_manager_001',
      email: 'manager@example.com',
      password: bcrypt.hashSync('Password123', 10),
      name: 'Warehouse Manager',
      role: UserRole.MANAGER,
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      _id: 'user_viewer_001',
      email: 'viewer@example.com',
      password: bcrypt.hashSync('Viewer123', 10),
      name: 'Inventory Viewer',
      role: UserRole.VIEWER,
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }
  ];

  async findAll(): Promise<IUser[]> {
    return this.users.map(user => ({ ...user })); // Return copies
  }

  async findById(id: string): Promise<IUser | null> {
    const user = this.users.find(u => u._id === id);
    return user ? { ...user } : null;
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const user = this.users.find(u => u.email === email);
    return user ? { ...user } : null;
  }

  async create(userData: Omit<IUser, '_id' | 'createdAt' | 'updatedAt'>): Promise<IUser> {
    const newUser: IUser = {
      _id: `user_${Date.now()}`,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(newUser);
    return { ...newUser };
  }

  async update(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    const index = this.users.findIndex(u => u._id === id);
    if (index === -1) return null;

    this.users[index] = {
      ...this.users[index],
      ...updateData,
      updatedAt: new Date()
    };
    return { ...this.users[index] };
  }

  async delete(id: string): Promise<boolean> {
    const index = this.users.findIndex(u => u._id === id);
    if (index === -1) return false;

    this.users.splice(index, 1);
    return true;
  }

  // Utility method to get user count
  async count(): Promise<number> {
    return this.users.length;
  }
}

export const mockUserService = new MockUserService();