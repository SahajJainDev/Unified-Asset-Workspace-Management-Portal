
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AIChatBot from '../components/AIChatBot';
import apiService from '../services/apiService';

const AssetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [asset, setAsset] = React.useState<any>(null); // Using any for flexibility during transition, ideally matches Asset interface
  const [loading, setLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState<any>({});
  const [softwareData, setSoftwareData] = React.useState<any>(null);
  const [softwareLoading, setSoftwareLoading] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [attachments, setAttachments] = React.useState<any[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const itemsPerPage = 10;
  const [isAssignModalOpen, setIsAssignModalOpen] = React.useState(false);
  const [employees, setEmployees] = React.useState<any[]>([]);
  const [searchEmployee, setSearchEmployee] = React.useState('');
  const [selectedEmployee, setSelectedEmployee] = React.useState<any>(null);

  React.useEffect(() => {
    fetchAsset();
    fetchInstalledSoftware();
    fetchAttachments();
  }, [id]);

  React.useEffect(() => {
    if (isAssignModalOpen) {
      fetchEmployees();
    }
  }, [isAssignModalOpen]);

  const fetchAsset = async () => {
    try {
      // Assuming backend uses _id for fetching, but if URL has assetTag, we might need a search. 
      // For now, let's try assuming the ID in URL is the DB ID.
      // If the URL passes 'Asset-042' which is not a MongoID, this might fail unless backend handles lookup by tag.
      // The previous code had `id || 'Asset-042'`, implying id might be undefined or just a placeholder.
      if (!id) return;

      const res = await fetch(`http://localhost:5000/api/assets/${id}`);
      if (res.ok) {
        const data = await res.json();
        setAsset(data);
        setFormData(data);
      } else {
        console.error('Failed to fetch asset');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstalledSoftware = async () => {
    try {
      if (!id) return;
      setSoftwareLoading(true);
      const res = await fetch(`http://localhost:5000/api/software-verification/asset/${id}/latest`);
      if (res.ok) {
        const data = await res.json();
        setSoftwareData(data);
      } else {
        console.log('No software verification data found for this asset');
      }
    } catch (err) {
      console.error('Error fetching software data:', err);
    } finally {
      setSoftwareLoading(false);
    }
  };

  const fetchAttachments = async () => {
    try {
      if (!id) return;
      setAttachmentsLoading(true);
      const data = await apiService.getAttachments(id);
      setAttachments(data);
    } catch (err) {
      console.error('Error fetching attachments:', err);
    } finally {
      setAttachmentsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;
    if (!id) return;

    // Filter by size (10MB)
    const validFiles = files.filter((f: File) => f.size <= 10 * 1024 * 1024);
    if (validFiles.length !== files.length) {
      alert('Some files exceed the 10MB limit and will be skipped.');
    }
    if (validFiles.length === 0) return;

    try {
      setIsUploading(true);
      await apiService.uploadAttachments(id, validFiles);
      await fetchAttachments();
    } catch (err: any) {
      alert(err.message || 'Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) return;
    try {
      await apiService.deleteAttachment(attachmentId);
      setAttachments(prev => prev.filter(a => a._id !== attachmentId));
    } catch (err) {
      alert('Failed to delete attachment');
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/employees');
      if (res.ok) {
        const data = await res.json();
        // Ensure data is an array
        if (Array.isArray(data)) {
          setEmployees(data);
        } else {
          console.error('Employee data is not an array:', data);
          setEmployees([]);
        }
      } else {
        console.error('Failed to fetch employees');
        setEmployees([]);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      setEmployees([]);
    }
  };

  const handleAssignAsset = async () => {
    if (!selectedEmployee) {
      alert('Please select an employee');
      return;
    }

    try {
      const updatedAsset = {
        ...asset,
        status: 'Assigned',
        assignedTo: selectedEmployee.empId, // Store employee ID in assignedTo field
        employee: {
          number: selectedEmployee.empId,
          name: selectedEmployee.fullName,
          department: selectedEmployee.department,
          subDepartment: selectedEmployee.subDepartment
        },
        assignmentDate: new Date().toISOString()
      };

      const res = await fetch(`http://localhost:5000/api/assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAsset)
      });

      if (res.ok) {
        const updated = await res.json();
        setAsset(updated);
        setFormData(updated);
        setIsAssignModalOpen(false);
        setSelectedEmployee(null);
        setSearchEmployee('');
        alert('Asset assigned successfully!');
      } else {
        alert('Failed to assign asset');
      }
    } catch (error) {
      console.error('Error assigning asset:', error);
      alert('Error assigning asset');
    }
  };

  const filteredEmployees = Array.isArray(employees) ? employees.filter(emp => 
    emp.fullName?.toLowerCase().includes(searchEmployee.toLowerCase()) ||
    emp.empId?.toString().includes(searchEmployee) ||
    emp.department?.toLowerCase().includes(searchEmployee.toLowerCase())
  ) : [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Handle nested employee fields
    if (name.startsWith('employee.')) {
      const field = name.split('.')[1];
      setFormData((prev: any) => {
        const updatedEmployee = { ...prev.employee, [field]: value };
        // Auto-update status to Assigned if employee number is provided
        const shouldAutoAssign = field === 'number' && value && value.trim() !== '';
        return {
          ...prev,
          employee: updatedEmployee,
          status: shouldAutoAssign ? 'Assigned' : prev.status
        };
      });
    } else if (name.startsWith('specs.')) {
      const field = name.split('.')[1];
      setFormData((prev: any) => ({
        ...prev,
        specs: { ...prev.specs, [field]: value }
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const updated = await res.json();
        setAsset(updated);
        setIsEditing(false);
        // Optional: show toast
      } else {
        alert('Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error saving changes');
    }
  };

  // Calculate pagination for software list
  const installedSoftwareList = softwareData?.installedSoftware || [];
  const totalPages = Math.ceil(installedSoftwareList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSoftware = installedSoftwareList.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const handleFirstPage = () => setCurrentPage(1);
  const handleLastPage = () => setCurrentPage(totalPages);

  // Integrated history items
  const historyItems = [
    { date: 'Mar 20, 2024', event: 'Quikr Modification', desc: 'Battery health reported as 94% via Quikr auto-scan.', icon: 'bolt', color: 'bg-primary/10 text-primary' },
    { date: 'Oct 12, 2023', event: 'Asset Assigned', desc: 'Assigned to Sarah Jenkins for Product Design role.', icon: 'person_add', color: 'bg-blue-100 text-blue-600' },
    // using asset data creation if available
    { date: asset?.createdAt ? new Date(asset.createdAt).toLocaleDateString() : 'Sep 25, 2023', event: 'Purchased', desc: 'Added to system.', icon: 'shopping_cart', color: 'bg-gray-100 text-gray-600' },
  ];

  if (loading) return <div className="p-10">Loading...</div>;
  if (!asset && !loading) return <div className="p-10">Asset not found</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar activeTab="assets" />
      <main className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
        <Header />
        <div className="max-w-[1280px] w-full mx-auto px-4 md:px-10 py-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="flex flex-wrap gap-2 items-center mb-4">
            <Link className="text-[#617589] text-sm font-medium hover:text-primary transition-colors" to="/assets">Assets</Link>
            <span className="text-[#617589] text-sm">/</span>
            <span className="text-primary text-sm font-semibold">{asset.assetTag}</span>
          </div>

          <div className="bg-white dark:bg-[#1a2632] rounded-xl p-6 border border-[#dbe0e6] dark:border-gray-800 mb-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-xl min-h-32 w-32 border border-gray-100 dark:border-gray-800 shadow-inner"
                  style={{ backgroundImage: 'url("https://picsum.photos/seed/macbook/200/200")' }}
                ></div>
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-[#111418] dark:text-white text-2xl font-bold leading-tight">{asset.assetName} - {asset.assetTag}</h1>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-primary text-xs font-bold uppercase tracking-wider">{asset.status}</span>
                  </div>
                  <p className="text-[#617589] text-base font-normal">
                    Assigned to <span className="text-[#111418] dark:text-white font-medium">{asset.employee?.name || 'Unassigned'}</span>
                    {asset.employee?.number && <span className="text-[#617589]"> ({asset.employee.number})</span>}
                    {asset.employee?.department && ` (${asset.employee.department})`}
                  </p>
                  <p className="text-[#617589] text-sm font-normal mt-1">Serial: {asset.serialNumber} | Tag: {asset.assetTag}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {isEditing ? (
                  <>
                    <button onClick={() => setIsEditing(false)} className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-gray-200 text-gray-700 text-sm font-bold">
                      Cancel
                    </button>
                    <button onClick={handleSave} className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-green-600 text-white text-sm font-bold hover:bg-green-700">
                      <span className="material-symbols-outlined">save</span>
                      <span>Save Changes</span>
                    </button>
                  </>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-[#f0f2f4] dark:bg-slate-800 text-[#111418] dark:text-white text-sm font-bold border border-transparent hover:border-gray-300 transition-all">
                    <span className="material-symbols-outlined">edit</span>
                    <span>Edit</span>
                  </button>
                )}
                <button 
                  onClick={() => setIsAssignModalOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                >
                  <span className="material-symbols-outlined">{asset.employee?.number ? 'swap_horiz' : 'person_add'}</span>
                  <span>{asset.employee?.number ? 'Reassign' : 'Assign'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-[#1a2632] rounded-xl p-5 border border-[#dbe0e6] dark:border-gray-800">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Procurement Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#617589]">Invoice Number</span>
                  <span className="font-bold text-primary">{asset.invoiceNumber || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#617589]">Added By</span>
                  <span className="font-bold">{asset.addedBy || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#617589]">Purchased On</span>
                  <span className="font-medium">{asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#617589]">Vendor</span>
                  <span className="font-medium">{asset.vendorName || '-'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a2632] rounded-xl p-5 border border-[#dbe0e6] dark:border-gray-800">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">System Specs</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#617589]">Processor</span>
                  <span className="font-medium">{asset.specs?.processor || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#617589]">Memory</span>
                  <span className="font-medium">{asset.specs?.memory || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#617589]">Battery Health</span>
                  <span className="font-bold text-green-500">{asset.specs?.batteryHealth || '-'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a2632] rounded-xl p-5 border border-[#dbe0e6] dark:border-gray-800">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Location Info</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#617589]">Description / Loc</span>
                  <span className="font-medium">{asset.description || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#617589]">Last Seen</span>
                  <span className="font-medium">Today</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Installed Software Section */}
              <div className="bg-white dark:bg-[#1a2632] rounded-xl p-6 border border-[#dbe0e6] dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold">Installed Software</h3>
                    {softwareData?.verification && (
                      <p className="text-xs text-[#617589] mt-1">
                        Last scanned: {new Date(softwareData.verification.scannedAt).toLocaleString()} •
                        Total: {installedSoftwareList.length} applications •
                        Scanned by: {softwareData.verification.employeeId?.name || 'Unknown'}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={fetchInstalledSoftware}
                    className="text-xs font-bold text-primary px-3 py-1 bg-primary/5 rounded-lg border border-primary/20 hover:bg-primary/10 transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    Refresh
                  </button>
                </div>

                {softwareLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : installedSoftwareList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-700 mb-4">inventory_2</span>
                    <p className="text-sm font-semibold text-[#617589]">No software scan data available</p>
                    <p className="text-xs text-[#617589] mt-1">Employee needs to run verification scan from their portal</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-100 dark:border-gray-800 text-[10px] font-bold text-[#617589] uppercase tracking-wider">
                            <th className="pb-3 px-2">Software Name</th>
                            <th className="pb-3 px-2">Version</th>
                            <th className="pb-3 px-2">Publisher</th>
                            <th className="pb-3 px-2">Install Date</th>
                            <th className="pb-3 px-2 text-right">Source</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                          {paginatedSoftware.map((sw: any, i: number) => (
                            <tr key={i} className="group hover:bg-gray-50 dark:hover:bg-gray-800/20">
                              <td className="py-3 px-2 text-sm font-bold max-w-xs truncate">{sw.softwareName}</td>
                              <td className="py-3 px-2 text-xs text-[#617589] font-mono">{sw.version || '-'}</td>
                              <td className="py-3 px-2 text-xs text-[#617589] max-w-xs truncate">{sw.publisher || '-'}</td>
                              <td className="py-3 px-2 text-xs text-[#617589]">{sw.installDate ? new Date(sw.installDate).toLocaleDateString() : '-'}</td>
                              <td className="py-3 px-2 text-right">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${sw.source === 'Registry' ? 'bg-blue-100 text-blue-700' :
                                  sw.source === 'WMI' ? 'bg-green-100 text-green-700' :
                                    sw.source === 'PackageManager' ? 'bg-purple-100 text-purple-700' :
                                      'bg-gray-100 text-gray-700'
                                  }`}>
                                  {sw.source || 'Unknown'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <div className="text-sm text-[#617589]">
                          Showing {startIndex + 1} to {Math.min(endIndex, installedSoftwareList.length)} of {installedSoftwareList.length} applications
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleFirstPage}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            <span className="material-symbols-outlined text-xl">first_page</span>
                          </button>
                          <button
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            <span className="material-symbols-outlined text-xl">chevron_left</span>
                          </button>
                          <span className="px-4 py-2 text-sm font-semibold">
                            Page {currentPage} of {totalPages}
                          </span>
                          <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            <span className="material-symbols-outlined text-xl">chevron_right</span>
                          </button>
                          <button
                            onClick={handleLastPage}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            <span className="material-symbols-outlined text-xl">last_page</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* NEW SECTION: Asset Details */}
              <div className="bg-white dark:bg-[#1a2632] rounded-xl p-6 border border-[#dbe0e6] dark:border-gray-800 shadow-sm">
                <h3 className="text-lg font-bold mb-6">Asset Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { label: 'Asset Id', name: 'assetTag', value: asset.assetTag, type: 'text' },
                    { label: 'Asset Name', name: 'assetName', value: asset.assetName, type: 'text' },
                    { label: 'Description / Location', name: 'description', value: asset.description, type: 'text' },
                    { label: 'Warranty Expires On', name: 'warrantyExpiry', value: asset.warrantyExpiry, type: 'date' },
                    { label: 'Asset Condition', name: 'condition', value: asset.condition, type: 'select', options: ['New', 'Good', 'Fair', 'Poor', 'Damaged'] },
                    { label: 'Asset Status', name: 'status', value: asset.status, type: 'select', options: ['IN USE', 'STORAGE', 'REPAIR', 'Available', 'Assigned', 'Not Available', 'Damaged'] },
                    { label: 'Reason (if N/A)', name: 'reasonNotAvailable', value: asset.reasonNotAvailable, type: 'text' },
                    { label: 'Employee #', name: 'employee.number', value: asset.employee?.number, type: 'text' },
                    { label: 'Employee Name', name: 'employee.name', value: asset.employee?.name, type: 'text' },
                    { label: 'Department', name: 'employee.department', value: asset.employee?.department, type: 'text' },
                    { label: 'Sub-Department', name: 'employee.subDepartment', value: asset.employee?.subDepartment, type: 'text' },
                    { label: 'Assignment Date', name: 'assignmentDate', value: asset.assignmentDate, type: 'date' },
                    { label: 'Invoice No', name: 'invoiceNumber', value: asset.invoiceNumber, type: 'text' },
                    { label: 'Vendor Name', name: 'vendorName', value: asset.vendorName, type: 'text' },
                    { label: 'PO', name: 'purchaseOrderNumber', value: asset.purchaseOrderNumber, type: 'text' },
                    { label: 'Asset Serial/Tag', name: 'serialNumber', value: asset.serialNumber, type: 'text' },
                    { label: 'RAM', name: 'specs.memory', value: asset.specs?.memory, type: 'text' },
                    { label: 'Processor', name: 'specs.processor', value: asset.specs?.processor, type: 'text' },
                    { label: 'HDD', name: 'specs.storage', value: asset.specs?.storage, type: 'text' },
                    { label: 'Asset Model', name: 'model', value: asset.model, type: 'text' },
                    { label: 'Make', name: 'make', value: asset.make, type: 'text' },
                  ].map((field, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-[#617589] uppercase tracking-tight">{field.label}</label>
                      {isEditing ? (
                        field.type === 'select' ? (
                          <select
                            name={field.name}
                            value={field.name.includes('.') ? field.name.split('.').reduce((a: any, b: any) => a?.[b], formData) : formData[field.name] || ''}
                            onChange={handleChange}
                            className="border border-gray-300 rounded p-1.5 text-sm bg-gray-50"
                          >
                            <option value="">Select...</option>
                            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : (
                          <input
                            type={field.type}
                            name={field.name}
                            value={field.name.includes('.') ? field.name.split('.').reduce((a: any, b: any) => a?.[b], formData) || '' : formData[field.name] || ''}
                            onChange={handleChange}
                            className="border border-gray-300 rounded p-1.5 text-sm bg-gray-50 focus:ring-1 focus:ring-primary outline-none"
                          />
                        )
                      ) : (
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 min-h-[20px]">
                          {field.value ? (field.type === 'date' ? new Date(field.value).toLocaleDateString() : field.value) : '-'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-[#1a2632] rounded-xl p-6 border border-[#dbe0e6] dark:border-gray-800 shadow-sm">
                <h3 className="text-lg font-bold mb-4">Lifecycle History</h3>
                <div className="space-y-6">
                  {historyItems.map((step, i) => (
                    <div key={i} className="flex gap-4 relative">
                      {i !== historyItems.length - 1 && <div className="absolute left-5 top-10 w-0.5 h-full bg-gray-100 dark:bg-gray-800 -z-0"></div>}
                      <div className={`size-10 rounded-full flex items-center justify-center shrink-0 z-10 ${step.color}`}>
                        <span className="material-symbols-outlined text-[20px]">{step.icon}</span>
                      </div>
                      <div className="pb-2">
                        <p className="text-xs font-semibold text-[#617589]">{step.date}</p>
                        <p className="text-sm font-bold">{step.event}</p>
                        <p className="text-xs text-[#617589] mt-1">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-[#1a2632] rounded-xl p-6 border border-[#dbe0e6] dark:border-gray-800">
                <h3 className="text-lg font-bold mb-4">Asset Tag QR</h3>
                <div className="aspect-square bg-white dark:bg-gray-100 rounded-lg flex items-center justify-center p-6 border border-gray-200 dark:border-gray-800 overflow-hidden">
                  {/* Mock QR placeholder */}
                  <div className="size-full border-4 border-black dark:border-slate-800 border-double opacity-20 flex items-center justify-center relative">
                    <span className="material-symbols-outlined text-6xl">qr_code_2</span>
                  </div>
                </div>
                <button className="w-full mt-4 py-2 text-slate-500 font-bold text-xs bg-slate-50 dark:bg-gray-800 rounded-lg hover:bg-slate-100 transition-colors">Download QR Tag</button>
              </div>

              <div className="bg-white dark:bg-[#1a2632] rounded-xl p-6 border border-[#dbe0e6] dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Attachments</h3>
                  {attachments.length > 0 && (
                    <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {attachments.length}
                    </span>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  {attachmentsLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    </div>
                  ) : attachments.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                      <span className="material-symbols-outlined text-gray-300 dark:text-gray-700 text-4xl mb-2">upload_file</span>
                      <p className="text-xs font-semibold text-[#617589]">No attachments uploaded</p>
                    </div>
                  ) : (
                    attachments.map((file) => (
                      <div key={file._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`p-2 rounded-lg shrink-0 ${file.fileType.includes('pdf') ? 'bg-red-100 text-red-600' :
                            file.fileType.includes('image') ? 'bg-blue-100 text-blue-600' :
                              'bg-primary/10 text-primary'
                            }`}>
                            <span className="material-symbols-outlined text-[20px]">
                              {file.fileType.includes('pdf') ? 'description' :
                                file.fileType.includes('image') ? 'image' : 'draft'}
                            </span>
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold truncate pr-2">{file.fileName}</p>
                            <p className="text-[10px] text-[#617589]">
                              {(file.fileSize / 1024 / 1024).toFixed(2)} MB • {new Date(file.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a
                            href={apiService.getDownloadUrl(file._id)}
                            download
                            className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-primary transition-colors"
                            title="Download"
                          >
                            <span className="material-symbols-outlined text-[18px]">download</span>
                          </a>
                          <button
                            onClick={() => handleDeleteAttachment(file._id)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-red-500 transition-colors"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="relative">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    disabled={isUploading}
                  />
                  <button className={`w-full py-2.5 border border-dashed border-gray-300 dark:border-gray-700 text-slate-500 font-bold text-[10px] uppercase rounded-lg transition-all flex items-center justify-center gap-2 ${isUploading ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-primary hover:text-primary hover:bg-primary/5'
                    }`}>
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">cloud_upload</span>
                        Add Attachments
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[9px] text-center text-[#617589] mt-3 italic">Max size: 10MB per file. Formats: PDF, JPG, PNG, DOCX</p>
              </div>
            </div>
          </div>
        </div>
        <AIChatBot />
      </main>

      {/* Assign/Reassign Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1a2632] rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#111418] dark:text-white">
                  {asset.employee?.number ? 'Reassign Asset' : 'Assign Asset'}
                </h2>
                <button 
                  onClick={() => {
                    setIsAssignModalOpen(false);
                    setSelectedEmployee(null);
                    setSearchEmployee('');
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              {asset.employee?.number && (
                <p className="text-sm text-[#617589] mt-2">
                  Currently assigned to: <span className="font-semibold">{asset.employee.name}</span> ({asset.employee.number})
                </p>
              )}
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-[#111418] dark:text-white mb-2">
                  Search Employee
                </label>
                <input
                  type="text"
                  placeholder="Search by name, ID, or department..."
                  value={searchEmployee}
                  onChange={(e) => setSearchEmployee(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[#111418] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredEmployees.length === 0 ? (
                  <p className="text-center text-[#617589] py-8">No employees found</p>
                ) : (
                  filteredEmployees.map((emp) => (
                    <div
                      key={emp._id}
                      onClick={() => setSelectedEmployee(emp)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedEmployee?._id === emp._id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 dark:border-gray-800 hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-[#111418] dark:text-white">{emp.fullName}</p>
                          <p className="text-sm text-[#617589]">
                            ID: {emp.empId} • {emp.department}
                            {emp.subDepartment && ` - ${emp.subDepartment}`}
                          </p>
                          <p className="text-xs text-[#617589] mt-1">
                            {emp.email} • {emp.mobile}
                          </p>
                        </div>
                        {selectedEmployee?._id === emp._id && (
                          <span className="material-symbols-outlined text-primary">check_circle</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              <button
                onClick={() => {
                  setIsAssignModalOpen(false);
                  setSelectedEmployee(null);
                  setSearchEmployee('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-semibold text-[#111418] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignAsset}
                disabled={!selectedEmployee}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {asset.employee?.number ? 'Reassign Asset' : 'Assign Asset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetDetailPage;
