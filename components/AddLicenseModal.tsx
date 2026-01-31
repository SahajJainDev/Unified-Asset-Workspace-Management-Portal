
import React, { useState } from 'react';
import apiService, { License } from '../services/apiService';

interface AddLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newLicense: License) => void;
  editLicense?: License | null;
}

const AddLicenseModal: React.FC<AddLicenseModalProps> = ({ isOpen, onClose, onSuccess, editLicense }) => {
  const [formData, setFormData] = useState({
    softwareName: '',
    version: '',
    invoiceNumber: '',
    addedBy: '',
    startDate: '',
    expiryDate: '',
    seatsLimit: 1,
    licenseKey: '',
    assignedSystem: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Effect to populate form when editLicense changes
  React.useEffect(() => {
    if (editLicense) {
      setFormData({
        softwareName: editLicense.softwareName || '',
        version: editLicense.version || '',
        invoiceNumber: editLicense.invoiceNumber || '',
        addedBy: editLicense.addedBy || '',
        startDate: editLicense.startDate ? new Date(editLicense.startDate).toISOString().split('T')[0] : '',
        expiryDate: editLicense.expiryDate ? new Date(editLicense.expiryDate).toISOString().split('T')[0] : '',
        seatsLimit: editLicense.seatsLimit || 1,
        licenseKey: editLicense.licenseKey || '',
        assignedSystem: editLicense.assignedSystem || ''
      });
    } else {
      setFormData({ softwareName: '', version: '', invoiceNumber: '', addedBy: '', startDate: '', expiryDate: '', seatsLimit: 1, licenseKey: '', assignedSystem: '' });
    }
  }, [editLicense, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const licenseData = {
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
        seatsLimit: parseInt(formData.seatsLimit.toString()) || 1
      };

      let result;
      if (editLicense && editLicense._id) {
        result = await apiService.updateLicense(editLicense._id, licenseData);
      } else {
        result = await apiService.createLicense(licenseData);
      }

      setSuccess(true);
      if (onSuccess) onSuccess(result);
      onClose(); // Close modal
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save license');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-[#1a2632] w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {editLicense ? 'Edit License' : 'Add New License'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <span className="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>

        <form className="p-6 space-y-5 overflow-y-auto no-scrollbar" onSubmit={handleSubmit}>
          {success && (
            <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              License {editLicense ? 'updated' : 'added'} successfully!
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">License Name *</label>
              <input
                type="text"
                name="softwareName"
                value={formData.softwareName}
                onChange={handleInputChange}
                readOnly={!!editLicense}
                placeholder="e.g. Adobe Photoshop"
                className={`w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none ${editLicense ? 'opacity-70 cursor-not-allowed' : ''}`}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Version</label>
              <input
                type="text"
                name="version"
                value={formData.version}
                onChange={handleInputChange}
                placeholder="e.g. 2024.1"
                className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
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
                placeholder="e.g. LIC-INV-001"
                className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Added By</label>
              <input
                type="text"
                name="addedBy"
                value={formData.addedBy}
                onChange={handleInputChange}
                placeholder="e.g. Admin Name"
                className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expiry Date</label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleInputChange}
                className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Seats / Limit</label>
              <input
                type="number"
                name="seatsLimit"
                value={formData.seatsLimit}
                onChange={handleInputChange}
                placeholder="e.g. 50"
                min="1"
                className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">License Key</label>
              <input
                type="text"
                name="licenseKey"
                value={formData.licenseKey}
                onChange={handleInputChange}
                placeholder="e.g. ABC123-DEF456-GHI789"
                className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned System</label>
            <input
              type="text"
              name="assignedSystem"
              value={formData.assignedSystem}
              onChange={handleInputChange}
              placeholder="e.g. Workstation-001"
              className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          <div className="pt-4 flex gap-3 sticky bottom-0 bg-white dark:bg-[#1a2632]">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-gray-700 transition-all">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50">
              {loading ? 'Saving...' : (editLicense ? 'Update License' : 'Save License')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLicenseModal;
