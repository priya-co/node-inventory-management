import { Request } from 'express';

// User roles enum
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  VIEWER = 'viewer'
}

// User interface
export interface IUser {
  _id?: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Product interface
export interface IProduct {
  _id?: string;
  name: string;
  sku: string;
  price: number;
  category: string;
  stock: number;
  minStock?: number;
  description?: string;
  warehouseId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Warehouse interface
export interface IWarehouse {
  _id?: string;
  name: string;
  location: string;
  capacity: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Inventory Log interface
export interface IInventoryLog {
  _id?: string;
  productId: string;
  warehouseId?: string;
  userId: string;
  action: 'add' | 'update' | 'remove';
  previousStock: number;
  newStock: number;
  quantity: number;
  reason?: string;
  timestamp?: Date;
}

// Authentication interfaces
export interface ILoginRequest {
  email: string;
  password: string;
}

export interface ILoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
    };
  };
}

export interface IRegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

// API Response interface
export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Pagination interface
export interface IPaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IPaginatedResponse<T> extends IApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Report interfaces
export interface ILowStockReport {
  product: string;
  sku: string;
  stock: number;
  warehouse: string;
  minStock: number;
}

export interface IInventoryReport {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  currentStock: number;
  minStock: number;
  warehouse: string;
  lastUpdated: Date;
}

// JWT payload interface
export interface IJwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Request with user info (after auth middleware)
export interface IAuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}