
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
  id: string;
  isOccupied: boolean;
  occupant?: {
    name: string;
    role: string;
    avatar: string;
  };
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

export interface Floor {
  _id: string;
  name: string;
  description?: string;
  building: string;
  level: number;
  rooms?: Room[];
  workstations?: Workstation[];
  layout?: any;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Room {
  _id: string;
  name: string;
  type: string;
  floor: string;
  capacity: number;
  location: string;
  workstations?: Workstation[];
  amenities?: string[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Workstation {
  _id?: string;
  workstationId: string;
  seatNumber: string;
  floorType: string;
  status: 'Available' | 'Occupied';
  floor?: string;
  room?: string;
  assignedEmployeeId?: string;
  position?: { x: number; y: number };
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
