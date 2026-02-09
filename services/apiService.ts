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
  cycleId?: string;
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

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  intent?: any; // New field for AI actions
}

interface ChatSession {
  _id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  lastActivity: string;
  createdAt: string;
}

interface HotDeskBooking {
  _id?: string;
  seatId: string;
  workstationId: string;
  employeeId: string;
  employeeName: string;
  bookingDate: Date;
  timeSlot?: string;
  bookingType: 'TEMPORARY' | 'PERMANENT';
  status: 'Booked' | 'Cancelled' | 'Completed';
  bookedAt?: Date;
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

  // Asset History
  async getAssetHistory(assetId: string): Promise<any[]> {
    return this.request<any[]>(`/assets/${assetId}/history`);
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

  // Audit Report
  async getAuditReport(): Promise<any> {
    return this.request<any>('/reports/audit');
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

  async submitBatchVerification(employeeId: string, cycleId: string, verifications: Array<{ assetId: string; enteredAssetId: string; status: string; notes?: string }>): Promise<any> {
    return this.request<any>('/verifications/batch', {
      method: 'POST',
      body: JSON.stringify({ employeeId, cycleId, verifications }),
    });
  }

  async getVerifications(): Promise<VerificationRecord[]> {
    return this.request<VerificationRecord[]>('/verifications');
  }

  async getVerificationSummary(cycleId?: string): Promise<any[]> {
    const query = cycleId ? `?cycleId=${cycleId}` : '';
    return this.request<any[]>(`/verifications/summary${query}`);
  }

  async getEmployeeVerificationDetail(empId: string, cycleId?: string): Promise<any> {
    const query = cycleId ? `?cycleId=${cycleId}` : '';
    return this.request<any>(`/verifications/employee/${empId}${query}`);
  }

  // Verification Cycle operations
  async getActiveCycle(): Promise<any> {
    return this.request<any>('/verification-cycles/active');
  }

  async getAllCycles(): Promise<any[]> {
    return this.request<any[]>('/verification-cycles');
  }

  async startVerificationCycle(data: { title: string; createdBy: string; notes?: string }): Promise<any> {
    return this.request<any>('/verification-cycles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async closeVerificationCycle(cycleId: string, closedBy: string): Promise<any> {
    return this.request<any>(`/verification-cycles/${cycleId}/close`, {
      method: 'PATCH',
      body: JSON.stringify({ closedBy }),
    });
  }

  async getEmployeeCycleStatus(cycleId: string, empId: string): Promise<{ hasSubmitted: boolean; submissionCount: number }> {
    return this.request<{ hasSubmitted: boolean; submissionCount: number }>(`/verification-cycles/${cycleId}/employee-status/${empId}`);
  }

  async getSubmittedAssetsForCycle(cycleId: string, empId: string): Promise<{ assetIds: string[] }> {
    return this.request<{ assetIds: string[] }>(`/verifications/cycle/${cycleId}/employee/${empId}/submitted`);
  }

  // Asset Category operations
  async getAssetCategories(): Promise<any[]> {
    return this.request<any[]>('/asset-categories');
  }

  async createAssetCategory(data: { name: string; icon?: string }): Promise<any> {
    return this.request<any>('/asset-categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAssetCategory(id: string, data: { name?: string; icon?: string; isActive?: boolean }): Promise<any> {
    return this.request<any>(`/asset-categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAssetCategory(id: string): Promise<any> {
    return this.request<any>(`/asset-categories/${id}`, {
      method: 'DELETE',
    });
  }

  async reassignAndDeleteCategory(id: string, targetCategoryId: string): Promise<any> {
    return this.request<any>(`/asset-categories/${id}/reassign-and-delete`, {
      method: 'POST',
      body: JSON.stringify({ targetCategoryId }),
    });
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

  // Chat operations
  async sendChatMessage(message: string, sessionId?: string): Promise<{ response: string, sessionId: string, history: ChatMessage[], intent?: any }> {
    return this.request<{ response: string, sessionId: string, history: ChatMessage[], intent?: any }>('/chat/send', {
      method: 'POST',
      body: JSON.stringify({ message, sessionId }),
    });
  }

  async executeAction(intent: any): Promise<any> {
    return this.request<any>('/actions/execute', {
      method: 'POST',
      body: JSON.stringify(intent),
    });
  }

  async getChatSessions(): Promise<Partial<ChatSession>[]> {
    return this.request<Partial<ChatSession>[]>('/chat/sessions');
  }

  async getChatSessionHistory(sessionId: string): Promise<ChatSession> {
    return this.request<ChatSession>(`/chat/sessions/${sessionId}`);
  }

  async deleteChatSession(sessionId: string): Promise<void> {
    return this.request<void>(`/chat/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  async createNewChatSession(): Promise<ChatSession> {
    return this.request<ChatSession>('/chat/new-session', {
      method: 'POST',
    });
  }

  // Hot-Desk operations
  async getAvailableSeats(date: string, slot: string, bookingType?: string): Promise<any[]> {
    return this.request<any[]>(`/hotdesk/available-seats?date=${date}&slot=${encodeURIComponent(slot)}&bookingType=${bookingType || 'TEMPORARY'}`);
  }

  async bookHotDesk(bookingData: Omit<HotDeskBooking, '_id' | 'status' | 'bookedAt'>): Promise<HotDeskBooking> {
    return this.request<HotDeskBooking>('/hotdesk/book', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async getMyHotDeskBookings(empId: string): Promise<HotDeskBooking[]> {
    return this.request<HotDeskBooking[]>(`/hotdesk/my-bookings/${empId}`);
  }

  async cancelHotDeskBooking(id: string): Promise<any> {
    return this.request<any>(`/hotdesk/cancel/${id}`, {
      method: 'POST',
    });
  }

  async unassignSeatAdmin(id: string): Promise<any> {
    return this.request<any>(`/hotdesk/admin/unassign/${id}`, {
      method: 'POST',
    });
  }
}

const apiService = new ApiService();

export default apiService;
export const createWorkstation = apiService.createWorkstation.bind(apiService);
export const updateWorkstation = apiService.updateWorkstation.bind(apiService);
export const deleteWorkstation = apiService.deleteWorkstation.bind(apiService);
export type { Asset, License };
