
export enum AssetStatus {
  IN_USE = 'IN USE',
  IN_REPAIR = 'IN REPAIR',
  STORAGE = 'STORAGE',
  DECOMMISSIONED = 'DECOMMISSIONED'
}

export interface Asset {
  _id: string; // Mongoose ID
  assetName: string;
  assetType: string;
  model: string;
  make: string;
  description: string;
  assignedTo: string; // Legacy field, kept for compatibility if needed
  status: AssetStatus;
  statusColor?: string; // Frontend helper
  serialNumber: string;
  assetTag: string;
  condition: string;
  reasonNotAvailable: string;
  assignmentDate: string; // ISO date string
  vendorName: string;
  purchaseOrderNumber: string; // PO
  invoiceNumber: string;
  addedBy: string;
  purchaseDate: string; // ISO date string
  warrantyExpiry: string; // ISO date string
  employee: {
    number: string;
    name: string;
    department: string;
    subDepartment: string;
  };
  specs: {
    processor: string;
    memory: string;
    storage: string;
    batteryHealth: string;
    batteryLevel?: number;
    storageUsage?: number;
    memoryUsage?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Software {
  name: string;
  version: string;
  utilization: string;
  percentage: number;
  status: string;
  statusColor: string;
}

export interface Desk {
  _id?: string;
  workstationId: string;
  block: string;
  empId?: string;
  userName?: string;
  project?: string;
  manager?: string;
  status: 'Available' | 'Occupied';
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QuikrLog {
  id: string;
  assetId: string;
  modification: string;
  modifiedBy: string;
  timestamp: string;
}

export type UserRole = 'Admin' | 'Employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  workstationId?: string;
}



export interface Employee {
  _id?: string;
  empId: string;
  fullName: string;
  userName?: string;
  email?: string;
  department?: string;
  role?: 'Admin' | 'Employee';
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
