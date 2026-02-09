
import React, { useState } from 'react';
import apiService from '../services/apiService';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssetAdded?: () => void;
  categories?: Array<{ _id: string; name: string; icon: string; isActive: boolean }>;
}

const AddAssetModal: React.FC<AddAssetModalProps> = ({ isOpen, onClose, onAssetAdded, categories }) => {
  const activeCategories = categories && categories.length > 0
    ? categories.filter(c => c.isActive)
    : [{ _id: '1', name: 'Laptop', icon: 'laptop_mac', isActive: true }, { _id: '2', name: 'Monitor', icon: 'desktop_windows', isActive: true }, { _id: '3', name: 'Mouse', icon: 'mouse', isActive: true }, { _id: '4', name: 'Keyboard', icon: 'keyboard', isActive: true }, { _id: '5', name: 'Smartphone', icon: 'smartphone', isActive: true }, { _id: '6', name: 'Tablet', icon: 'tablet_mac', isActive: true }, { _id: '7', name: 'Other', icon: 'devices', isActive: true }];
  const [formData, setFormData] = useState({
    assetName: '',
    assetType: 'Laptop',
    model: '',
    serialNumber: '',
    assetTag: '',
    assignedTo: '',
    warrantyExpiry: '',
    invoiceNumber: '',
    addedBy: '',
    status: 'STORAGE',
    description: '',
    specs: {
      processor: '',
      memory: '',
      storage: '',
      batteryHealth: ''
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('specs.')) {
      const specField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        specs: {
          ...prev.specs,
          [specField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleStatusChange = (status: string) => {
    setFormData(prev => ({
      ...prev,
      status
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiService.createAsset({
        ...formData,
        purchaseDate: formData.warrantyExpiry ? new Date(formData.warrantyExpiry) : undefined,
        warrantyExpiry: formData.warrantyExpiry ? new Date(formData.warrantyExpiry) : undefined
      });

      onAssetAdded?.();
      onClose();
      setFormData({
        assetName: '',
        assetType: 'Laptop',
        model: '',
        serialNumber: '',
        assetTag: '',
        assignedTo: '',
        warrantyExpiry: '',
        invoiceNumber: '',
        addedBy: '',
        status: 'STORAGE',
        description: '',
        specs: {
          processor: '',
          memory: '',
          storage: '',
          batteryHealth: ''
        }
      });
    } catch (error) {
      console.error('Error adding asset:', error);
      alert(`Failed to add asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      
      <div className="relative bg-white dark:bg-[#1a2632] w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Add New Asset</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>

        <form className="p-6 space-y-5 overflow-y-auto no-scrollbar" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Asset Type</label>
              <select
                name="assetType"
                value={formData.assetType}
                onChange={handleInputChange}
                className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              >
                {activeCategories.map(cat => (
                  <option key={cat._id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Asset ID / Tag</label>
              <input
                type="text"
                name="assetTag"
                value={formData.assetTag}
                onChange={handleInputChange}
                placeholder="AST-XXXX"
                className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Asset Name</label>
            <input
              type="text"
              name="assetName"
              value={formData.assetName}
              onChange={handleInputChange}
              placeholder="e.g. MacBook Pro 14 (M3)"
              className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Model Name</label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleInputChange}
              placeholder="e.g. MacBook Pro 14 (M3)"
              className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned To</label>
              <input
                type="text"
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleInputChange}
                placeholder="Employee Name"
                className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Warranty Expiry</label>
              <input
                type="date"
                name="warrantyExpiry"
                value={formData.warrantyExpiry}
                onChange={handleInputChange}
                className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice Number</label>
              <input
                type="text"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleInputChange}
                placeholder="INV-2024-001"
                className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Added By</label>
              <input
                type="text"
                name="addedBy"
                value={formData.addedBy}
                onChange={handleInputChange}
                placeholder="Your Name"
                className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Initial Status</label>
            <div className="flex gap-2">
              {['IN USE', 'STORAGE', 'REPAIR'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleStatusChange(status)}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all ${
                    formData.status === status
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-slate-500'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-3 sticky bottom-0 bg-white dark:bg-[#1a2632]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-gray-700 transition-all"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAssetModal;
