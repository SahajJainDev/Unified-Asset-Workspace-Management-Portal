const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface Asset {
  _id?: string;
  assetName: string;
  assetType: string;
  model?: string;
  serialNumber?: string;
  assetTag?: string;
  assignedTo?: string;
  purchaseDate?: Date;
  warrantyExpiry?: Date;
  invoiceNumber?: string;
  addedBy?: string;
  status: string;
  description?: string;
  specs: {
    processor?: string;
    memory?: string;
    storage?: string;
    batteryHealth?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

interface License {
  _id?: string;
  softwareName: string;
  version?: string;
  invoiceNumber?: string;
  addedBy?: string;
  startDate?: Date;
  expiryDate?: Date;
  seatsLimit?: number;
  licenseKey?: string;
  assignedSystem?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface Software {
  _id?: string;
  name: string;
  version?: string;
  totalSeats: number;
  usedSeats: number;
  utilizationPercentage: number;
  status: string;
  statusColor: string;
  icon: string;
  utilization?: string;
  percentage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DashboardStats {
  totalAssets: number;
  assetDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  assetStatusCounts: Array<{
    _id: string;
    count: number;
  }>;
  expiringLicenses: number;
  deskStatus: {
    occupied: number;
    available: number;
    reserved: number;
    total: number;
  };
  verificationStats: {
    verified: number;
    pending: number;
    flagged: number;
  };
  recentActivities: Array<{
    title: string;
    user: string;
    time: string;
    icon: string;
    color: string;
  }>;
}

interface Report {
  _id?: string;
  title: string;
  description: string;
  icon: string;
  status: string;
  color: string;
  category: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface VerificationRecord {
  id: string; // MongoDB _id
  assetTag: string; // Real Asset Tag from DB
  enteredAssetId: string; // What the user typed
  assetName: string;
  employeeName: string;
  employeeId: string;
  date: string;
  time: string;
  status: string;
  statusColor: string;
}

interface VerificationPost {
  assetId: string; // MongoDB _id
  enteredAssetId: string;
  employeeId: string;
  status: 'Verified' | 'Pending' | 'Flagged';
  notes?: string;
}

interface Floor {
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

interface Room {
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

interface Attachment {
  _id: string;
  assetId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
}

interface Workstation {
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

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const responseData = await response.json();
      if (!response.ok) {
        const errorMessage = responseData.success === false ? responseData.message : (responseData.message || `HTTP ${response.status}: ${response.statusText}`);
        throw new Error(errorMessage);
      }
      return responseData;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Asset CRUD operations
  async getAssets(): Promise<Asset[]> {
    return this.request<Asset[]>('/assets');
  }

  async getAsset(id: string): Promise<Asset> {
    return this.request<Asset>(`/assets/${id}`);
  }

  async createAsset(asset: Omit<Asset, '_id' | 'createdAt' | 'updatedAt'>): Promise<Asset> {
    return this.request<Asset>('/assets', {
      method: 'POST',
      body: JSON.stringify(asset),
    });
  }

  async updateAsset(id: string, asset: Partial<Asset>): Promise<Asset> {
    return this.request<Asset>(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(asset),
    });
  }

  async deleteAsset(id: string): Promise<void> {
    return this.request<void>(`/assets/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteBatchAssets(ids: string[]): Promise<void> {
    return this.request<void>('/assets/delete-batch', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  async deleteAllAssets(): Promise<void> {
    return this.request<void>('/assets/all-assets', {
      method: 'DELETE',
    });
  }

  // License CRUD operations
  async getLicenses(): Promise<License[]> {
    return this.request<License[]>('/licenses');
  }

  async getLicense(id: string): Promise<License> {
    return this.request<License>(`/licenses/${id}`);
  }

  async createLicense(license: Omit<License, '_id' | 'createdAt' | 'updatedAt'>): Promise<License> {
    const response = await this.request<{ success: boolean; message: string; data: License }>('/licenses', {
      method: 'POST',
      body: JSON.stringify(license),
    });
    return response.data;
  }

  async updateLicense(id: string, license: Partial<License>): Promise<License> {
    return this.request<License>(`/licenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(license),
    });
  }

  async deleteLicense(id: string): Promise<void> {
    return this.request<void>(`/licenses/${id}`, {
      method: 'DELETE',
    });
  }

  // Software Stats
  async getSoftwareStats(): Promise<any[]> {
    return this.request<any[]>('/dashboard/software-stats');
  }

  // Software CRUD operations
  async getSoftware(): Promise<Software[]> {
    return this.request<Software[]>('/software');
  }

  async getSoftwareById(id: string): Promise<Software> {
    return this.request<Software>(`/software/${id}`);
  }

  async createSoftware(software: Omit<Software, '_id' | 'createdAt' | 'updatedAt'>): Promise<Software> {
    return this.request<Software>('/software', {
      method: 'POST',
      body: JSON.stringify(software),
    });
  }

  async updateSoftware(id: string, software: Partial<Software>): Promise<Software> {
    return this.request<Software>(`/software/${id}`, {
      method: 'PUT',
      body: JSON.stringify(software),
    });
  }

  async deleteSoftware(id: string): Promise<void> {
    return this.request<void>(`/software/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard operations
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/dashboard/stats');
  }

  // Reports CRUD operations
  async getReports(): Promise<Report[]> {
    return this.request<Report[]>('/reports');
  }

  async getReport(id: string): Promise<Report> {
    return this.request<Report>(`/reports/${id}`);
  }

  async createReport(report: Omit<Report, '_id' | 'createdAt' | 'updatedAt'>): Promise<Report> {
    return this.request<Report>('/reports', {
      method: 'POST',
      body: JSON.stringify(report),
    });
  }

  async updateReport(id: string, report: Partial<Report>): Promise<Report> {
    return this.request<Report>(`/reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(report),
    });
  }

  async deleteReport(id: string): Promise<void> {
    return this.request<void>(`/reports/${id}`, {
      method: 'DELETE',
    });
  }

  // Floor CRUD operations
  async getFloors(): Promise<Floor[]> {
    return this.request<Floor[]>('/floors');
  }

  async getFloor(id: string): Promise<Floor> {
    return this.request<Floor>(`/floors/${id}`);
  }

  async createFloor(floor: Omit<Floor, '_id' | 'createdAt' | 'updatedAt'>): Promise<Floor> {
    return this.request<Floor>('/floors', {
      method: 'POST',
      body: JSON.stringify(floor),
    });
  }

  async updateFloor(id: string, floor: Partial<Floor>): Promise<Floor> {
    return this.request<Floor>(`/floors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(floor),
    });
  }

  async deleteFloor(id: string): Promise<void> {
    return this.request<void>(`/floors/${id}`, {
      method: 'DELETE',
    });
  }

  // Workstation CRUD operations
  async createWorkstation(workstation: Omit<Workstation, '_id' | 'createdAt' | 'updatedAt'>): Promise<Workstation> {
    return this.request<Workstation>('/floors/workstations', {
      method: 'POST',
      body: JSON.stringify(workstation),
    });
  }

  async updateWorkstation(id: string, workstation: Partial<Workstation>): Promise<Workstation> {
    return this.request<Workstation>(`/floors/workstations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(workstation),
    });
  }

  async deleteWorkstation(id: string): Promise<void> {
    return this.request<void>(`/floors/workstations/${id}`, {
      method: 'DELETE',
    });
  }

  // Verification operations
  async submitVerification(verification: VerificationPost): Promise<any> {
    return this.request<any>('/verifications', {
      method: 'POST',
      body: JSON.stringify(verification),
    });
  }

  async getVerifications(): Promise<VerificationRecord[]> {
    return this.request<VerificationRecord[]>('/verifications');
  }

  // Global Search
  async searchGlobal(query: string): Promise<{ assets: any[], software: any[], licenses: any[] }> {
    return this.request<{ assets: any[], software: any[], licenses: any[] }>(`/dashboard/search?q=${encodeURIComponent(query)}`);
  }

  // Software Bulk Upload
  async uploadSoftwareBatch(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${API_BASE_URL}/software/bulk-upload`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const responseData = await response.json();
    if (!response.ok) {
      throw new Error(responseData.message || 'Bulk upload failed');
    }
    return responseData;
  }
  // Forecasting
  async getForecast(assetType: string): Promise<any> {
    return this.request<any>(`/forecast/${assetType}`);
  }

  // Employee operations
  async getEmployees(): Promise<any[]> {
    return this.request<any[]>('/employees');
  }

  async getEmployee(id: string): Promise<any> {
    return this.request<any>(`/employees/${id}`);
  }

  async getAssetsByEmployee(employeeId: string): Promise<Asset[]> {
    return this.request<Asset[]>(`/assets?assignedTo=${employeeId}`);
  }

  async getDeskByEmployee(employeeId: string): Promise<any> {
    return this.request<any>(`/desks/employee/${employeeId}`);
  }

  // Attachment operations
  async uploadAttachments(assetId: string, files: File[]): Promise<Attachment[]> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const url = `${API_BASE_URL}/attachments/assets/${assetId}`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const responseData = await response.json();
    if (!response.ok) {
      throw new Error(responseData.message || 'Upload failed');
    }
    return responseData;
  }

  async getAttachments(assetId: string): Promise<Attachment[]> {
    return this.request<Attachment[]>(`/attachments/assets/${assetId}`);
  }

  async deleteAttachment(id: string): Promise<void> {
    return this.request<void>(`/attachments/${id}`, {
      method: 'DELETE',
    });
  }

  getDownloadUrl(id: string): string {
    return `${API_BASE_URL}/attachments/download/${id}`;
  }
}

const apiService = new ApiService();

export default apiService;
export const createWorkstation = apiService.createWorkstation.bind(apiService);
export const updateWorkstation = apiService.updateWorkstation.bind(apiService);
export const deleteWorkstation = apiService.deleteWorkstation.bind(apiService);
export type { Asset, License };
