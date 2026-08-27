import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import institutionAdminService from '../../services/institutionAdminService';

export const VendorManagementScreen = () => {
  // Async states
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatusFilter, setActiveStatusFilter] = useState('All'); // 'All', 'Active', 'Inactive', 'Suspended'
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);
  const [tempPasswordModal, setTempPasswordModal] = useState(null);

  // Add Vendor Form state
  const [formShopName, setFormShopName] = useState('');
  const [formOwnerName, setFormOwnerName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCategory, setFormCategory] = useState('Food');
  const [formDescription, setFormDescription] = useState('');
  const [formLocation, setFormLocation] = useState('Student Union Building');
  const [formHours, setFormHours] = useState('8:00 AM - 9:00 PM');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Import Flow state
  const [importStep, setImportStep] = useState('upload'); // 'upload' | 'preview'
  const [importFile, setImportFile] = useState(null);
  const [validatingImport, setValidatingImport] = useState(false);
  const [importingData, setImportingData] = useState(false);
  const [importReport, setImportReport] = useState(null);

  const fetchVendors = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await institutionAdminService.getVendorsList();
      if (res.success && res.data) {
        setVendors(res.data.vendors || []);
      }
    } catch (err) {
      console.error('Error fetching vendors directory:', err);
      setError('Failed to load campus vendor directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const openAddModal = () => {
    setFormShopName('');
    setFormOwnerName('');
    setFormEmail('');
    setFormPhone('');
    setFormCategory('Food');
    setFormDescription('');
    setFormLocation('Student Union Building');
    setFormHours('8:00 AM - 9:00 PM');
    setFormError(null);
    setAddModalOpen(true);
  };

  const openImportModal = () => {
    setImportStep('upload');
    setImportFile(null);
    setImportReport(null);
    setImportModalOpen(true);
  };

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formShopName.trim()) return setFormError('Shop Name is required.');
    if (!formOwnerName.trim()) return setFormError('Owner Name is required.');
    if (!formEmail.trim()) return setFormError('Owner Email address is required.');

    setSubmitting(true);
    try {
      const res = await institutionAdminService.createVendor({
        shopName: formShopName.trim(),
        ownerName: formOwnerName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        category: formCategory,
        description: formDescription.trim(),
        location: formLocation.trim(),
        operatingHours: formHours.trim(),
      });

      if (res.success) {
        setAddModalOpen(false);
        fetchVendors();

        setTempPasswordModal({
          password: res.data.temporaryPassword,
          count: 1,
          message: `Vendor shop "${formShopName.trim()}" onboarded successfully!`,
        });
      }
    } catch (err) {
      console.error('Error creating vendor:', err);
      const msg = err.response?.data?.message || 'Failed to create vendor shop.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await institutionAdminService.downloadVendorTemplate();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ShopDrop_Vendor_Import_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Vendor Excel Template Downloaded!', { icon: '📥' });
    } catch (err) {
      toast.error('Failed to download template.');
    }
  };

  const handleValidateImportFile = async (e) => {
    e.preventDefault();
    if (!importFile) {
      toast.error('Please select an Excel file to validate.');
      return;
    }

    setValidatingImport(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const res = await institutionAdminService.validateVendorImport(formData);
      if (res.success && res.data) {
        setImportReport(res.data);
        setImportStep('preview');
        toast.success(`Validated ${res.data.totalRows} rows: ${res.data.validCount} Valid, ${res.data.invalidCount} Invalid`);
      }
    } catch (err) {
      console.error('Error validating vendor file:', err);
      const msg = err.response?.data?.message || 'Failed to validate file.';
      toast.error(msg);
    } finally {
      setValidatingImport(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importReport || !importReport.validRows || importReport.validRows.length === 0) {
      toast.error('No valid rows available to import.');
      return;
    }

    setImportingData(true);
    try {
      const res = await institutionAdminService.importVendors(importReport.validRows);
      if (res.success) {
        setImportModalOpen(false);
        fetchVendors();

        setTempPasswordModal({
          password: res.data.temporaryPassword,
          count: res.data.importedCount,
          message: `Successfully imported ${res.data.importedCount} vendor shops into institution directory!`,
        });
      }
    } catch (err) {
      console.error('Error importing vendors:', err);
      const msg = err.response?.data?.message || 'Bulk vendor import failed.';
      toast.error(msg);
    } finally {
      setImportingData(false);
    }
  };

  const handleUpdateStatus = async (vendorObj, newStatus) => {
    setSubmittingId(vendorObj.id);
    try {
      const res = await institutionAdminService.updateVendorStatus(vendorObj.id, newStatus);
      if (res.success) {
        toast.success(`Vendor "${vendorObj.shopName}" set to ${newStatus.toUpperCase()}!`, {
          icon: newStatus === 'active' ? '🟢' : newStatus === 'suspended' ? '🔴' : '🟡',
        });
        setVendors((prev) =>
          prev.map((v) => (v.id === vendorObj.id ? { ...v, status: newStatus } : v))
        );
        if (selectedVendor?.id === vendorObj.id) {
          setSelectedVendor((prev) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      toast.error('Failed to update vendor status.');
    } finally {
      setSubmittingId(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Temporary password copied to clipboard!', { icon: '📋' });
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || 'active';
    switch (s) {
      case 'active':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-[11px] rounded-xl border border-emerald-300">✓ Active</span>;
      case 'pending':
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 font-extrabold text-[11px] rounded-xl border border-amber-300">⏳ Pending</span>;
      case 'inactive':
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 font-extrabold text-[11px] rounded-xl border border-slate-200">○ Inactive</span>;
      case 'suspended':
        return <span className="px-3 py-1 bg-rose-100 text-rose-800 font-extrabold text-[11px] rounded-xl border border-rose-300">✕ Suspended</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 font-bold text-[11px] rounded-xl">{status?.toUpperCase()}</span>;
    }
  };

  const categoriesList = ['All', ...new Set(vendors.map((v) => v.category).filter(Boolean))];

  const filteredVendors = vendors.filter((v) => {
    const s = v.status?.toLowerCase() || 'active';
    if (activeStatusFilter === 'Active' && s !== 'active') return false;
    if (activeStatusFilter === 'Inactive' && s !== 'inactive') return false;
    if (activeStatusFilter === 'Suspended' && s !== 'suspended') return false;

    if (activeCategoryFilter !== 'All' && v.category !== activeCategoryFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchShop = v.shopName?.toLowerCase().includes(q);
      const matchOwner = v.ownerName?.toLowerCase().includes(q);
      const matchCat = v.category?.toLowerCase().includes(q);
      if (!matchShop && !matchOwner && !matchCat) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* SCREEN HEADER BANNER */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 font-extrabold text-xs rounded-lg border border-amber-200">
            <span>🏪</span> Controlled Campus Vendor Governance
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
            Vendor Directory
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Onboard campus vendor shops manually or via Excel import with temporary batch passwords.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={openImportModal}
            className="px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold text-xs rounded-2xl shadow-xs transition-all active:scale-95 flex items-center gap-2"
          >
            <span>📊</span> Bulk Import Vendors
          </button>
          <button
            onClick={openAddModal}
            className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <span>+</span> Add Vendor
          </button>
        </div>
      </div>

      {/* SEARCH & FILTERS TOOLBAR */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendors by shop name, owner, or category..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl text-xs font-medium focus:outline-none"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Status & Category Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Status Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {['All', 'Active', 'Inactive', 'Suspended'].map((status) => {
                const isActive = activeStatusFilter === status;
                return (
                  <button
                    key={status}
                    onClick={() => setActiveStatusFilter(status)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all border ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200/80'
                    }`}
                  >
                    {status}
                  </button>
                );
              })}
            </div>

            {/* Category Dropdown */}
            <select
              value={activeCategoryFilter}
              onChange={(e) => setActiveCategoryFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  Category: {cat}
                </option>
              ))}
            </select>

          </div>

        </div>
      </div>

      {/* VENDOR DIRECTORY TABLE */}
      {loading ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 space-y-4 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/4"></div>
          <div className="h-12 bg-slate-200 rounded-xl"></div>
          <div className="h-12 bg-slate-200 rounded-xl"></div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-3xl text-center space-y-3 max-w-md mx-auto my-8">
          <p className="text-xs font-bold text-rose-800">{error}</p>
          <button
            onClick={fetchVendors}
            className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Retry Loading
          </button>
        </div>
      ) : filteredVendors.length === 0 ? (
        /* EMPTY STATE */
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs text-center space-y-4 max-w-md mx-auto my-8">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-500 text-3xl shadow-inner">
            🏪
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900">No vendors found</h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              No campus vendors match the active filter criteria.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={openImportModal}
              className="px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold text-xs rounded-xl shadow-xs"
            >
              📊 Import Excel
            </button>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-xs"
            >
              + Add Vendor
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] bg-slate-50/50">
                  <th className="p-4">Vendor Shop</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Orders Count</th>
                  <th className="p-4">Total Revenue</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVendors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                    
                    {/* Vendor Shop */}
                    <td className="p-4">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{v.shopName}</h4>
                        <p className="text-[11px] text-slate-500 font-medium">📍 {v.location}</p>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-lg">
                        {v.category}
                      </span>
                    </td>

                    {/* Orders Count */}
                    <td className="p-4 font-bold text-slate-900">
                      {v.ordersCount} orders
                    </td>

                    {/* Total Revenue */}
                    <td className="p-4 font-black text-indigo-600">
                      ₹{v.revenue?.toFixed(2)}
                    </td>

                    {/* Rating */}
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-extrabold text-[10px] rounded border border-amber-200">
                        ★ {v.rating?.toFixed(1)}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="p-4">{getStatusBadge(v.status)}</td>

                    {/* Actions Toolbar */}
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedVendor(v)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                      >
                        View Details
                      </button>

                      {v.status === 'active' ? (
                        <button
                          onClick={() => handleUpdateStatus(v, 'inactive')}
                          disabled={submittingId === v.id}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl transition-colors"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(v, 'active')}
                          disabled={submittingId === v.id}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-colors"
                        >
                          Activate
                        </button>
                      )}

                      {v.status !== 'suspended' && (
                        <button
                          onClick={() => handleUpdateStatus(v, 'suspended')}
                          disabled={submittingId === v.id}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-colors"
                        >
                          Suspend
                        </button>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD VENDOR */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Onboard Campus Vendor</h3>
                <p className="text-xs text-slate-500">Auto-generates vendor shop & batch login password.</p>
              </div>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-xs font-bold text-rose-800">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleCreateVendor} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">Shop Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Campus Bites Canteen"
                  value={formShopName}
                  onChange={(e) => setFormShopName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:bg-white focus:border-indigo-600 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Owner Name *</label>
                  <input
                    type="text"
                    placeholder="John Owner"
                    value={formOwnerName}
                    onChange={(e) => setFormOwnerName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:bg-white"
                  >
                    <option value="Food">Food & Meals</option>
                    <option value="Stationery">Stationery & Books</option>
                    <option value="Printing">Printing Services</option>
                    <option value="Gifts & Accessories">Gifts & Accessories</option>
                    <option value="Essentials">Essentials</option>
                    <option value="Footwear">Footwear</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">Owner Email Address *</label>
                <input
                  type="email"
                  placeholder="owner@campusbites.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-indigo-600 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Phone</label>
                  <input
                    type="text"
                    placeholder="+1 555-0192"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Campus Location</label>
                  <input
                    type="text"
                    placeholder="Student Union Bldg"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">Operating Hours</label>
                <input
                  type="text"
                  placeholder="8:00 AM - 9:00 PM"
                  value={formHours}
                  onChange={(e) => setFormHours(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Onboarding Vendor...' : 'Onboard Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BULK IMPORT VENDORS VIA EXCEL */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 border border-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Bulk Import Vendors (.xlsx)</h3>
                <p className="text-xs text-slate-500">Upload vendor spreadsheet directory with validation reports.</p>
              </div>
              <button onClick={() => setImportModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            {importStep === 'upload' && (
              <div className="space-y-6">
                <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-black text-amber-900">Download Vendor Excel Template</h4>
                    <p className="text-[11px] text-amber-800 font-medium">
                      Columns: Shop Name, Owner Name, Email, Phone, Category, Description, Location, Operating Hours.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadTemplate}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-xs shrink-0 flex items-center gap-2"
                  >
                    <span>📥</span> Download Template
                  </button>
                </div>

                <form onSubmit={handleValidateImportFile} className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 hover:border-amber-500 p-8 rounded-3xl text-center space-y-3 bg-slate-50/50 transition-colors">
                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto text-2xl">
                      🏪
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-800">
                        {importFile ? importFile.name : 'Select Vendor Excel spreadsheet (.xlsx, .xls)'}
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={(e) => setImportFile(e.target.files[0])}
                      className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-amber-600 file:text-white hover:file:bg-amber-700 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setImportModalOpen(false)}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={validatingImport || !importFile}
                      className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md disabled:opacity-50"
                    >
                      {validatingImport ? 'Validating...' : 'Validate File & Preview'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {importStep === 'preview' && importReport && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Rows</span>
                    <span className="text-xl font-black text-slate-900">{importReport.totalRows}</span>
                  </div>
                  <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 text-center">
                    <span className="text-[10px] text-emerald-600 font-bold block uppercase">Valid Rows</span>
                    <span className="text-xl font-black text-emerald-800">{importReport.validCount}</span>
                  </div>
                  <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-200 text-center">
                    <span className="text-[10px] text-rose-600 font-bold block uppercase">Invalid Rows</span>
                    <span className="text-xl font-black text-rose-800">{importReport.invalidCount}</span>
                  </div>
                </div>

                {importReport.invalidCount > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-rose-800">⚠️ Invalid Rows Skipped ({importReport.invalidCount})</h4>
                    <div className="max-h-44 overflow-y-auto border border-rose-200 rounded-2xl bg-rose-50/30">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-rose-100 text-rose-900 font-extrabold uppercase text-[9px]">
                          <tr>
                            <th className="p-2.5">Row #</th>
                            <th className="p-2.5">Shop Name</th>
                            <th className="p-2.5">Email</th>
                            <th className="p-2.5">Errors</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-rose-100">
                          {importReport.invalidRows.map((inv, i) => (
                            <tr key={i}>
                              <td className="p-2.5 font-bold">Row {inv.rowIndex}</td>
                              <td className="p-2.5 font-bold">{inv.shopName || '-'}</td>
                              <td className="p-2.5">{inv.email || '-'}</td>
                              <td className="p-2.5 text-rose-700 font-bold">{inv.errors.join(', ')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="text-xs font-black text-emerald-800">✅ Valid Rows Ready For Import ({importReport.validCount})</h4>
                  <div className="max-h-52 overflow-y-auto border border-emerald-200 rounded-2xl bg-white">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-emerald-50 text-emerald-900 font-extrabold uppercase text-[9px]">
                        <tr>
                          <th className="p-2.5">Row #</th>
                          <th className="p-2.5">Shop Name</th>
                          <th className="p-2.5">Owner Name</th>
                          <th className="p-2.5">Email</th>
                          <th className="p-2.5">Category</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-100">
                        {importReport.validRows.map((v, i) => (
                          <tr key={i}>
                            <td className="p-2.5 font-bold text-slate-700">Row {v.rowIndex}</td>
                            <td className="p-2.5 font-bold text-slate-900">{v.shopName}</td>
                            <td className="p-2.5">{v.ownerName}</td>
                            <td className="p-2.5 text-slate-700">{v.email}</td>
                            <td className="p-2.5 font-bold">{v.category}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setImportStep('upload')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    ← Re-upload File
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    disabled={importingData || importReport.validCount === 0}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md disabled:opacity-50"
                  >
                    {importingData ? 'Importing...' : `Confirm & Import ${importReport.validCount} Vendors`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TEMPORARY PASSWORD DISPLAY MODAL */}
      {tempPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6 border border-slate-100 text-center animate-fade-in">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner">
              🔑
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">Common Temporary Password</h3>
              <p className="text-xs text-slate-500 font-medium">
                {tempPasswordModal.message}
              </p>
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                Batch Password (Shown Once)
              </span>
              <p className="font-mono text-lg font-black text-amber-400 select-all tracking-wider">
                {tempPasswordModal.password}
              </p>
              <button
                onClick={() => copyToClipboard(tempPasswordModal.password)}
                className="mt-1 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5"
              >
                <span>📋</span> Copy Password
              </button>
            </div>

            <button
              onClick={() => setTempPasswordModal(null)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md"
            >
              I Have Saved Password — Close
            </button>
          </div>
        </div>
      )}

      {/* VENDOR DETAILS DRAWER MODAL */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-fade-in border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">{selectedVendor.shopName}</h3>
                <span className="text-[11px] text-slate-500">Joined on {new Date(selectedVendor.joinedDate).toLocaleDateString()}</span>
              </div>
              <button onClick={() => setSelectedVendor(null)} className="text-slate-400 hover:text-slate-600 font-bold text-base">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider block">Total Revenue</span>
                  <p className="text-lg font-black text-indigo-700">₹{selectedVendor.revenue?.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Orders</span>
                  <p className="text-lg font-black text-slate-900">{selectedVendor.ordersCount} orders</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <p className="font-extrabold text-slate-900">Owner & Operating Info</p>
                <p>Owner: {selectedVendor.ownerName}</p>
                <p>Email: {selectedVendor.ownerEmail}</p>
                <p>Phone: {selectedVendor.ownerPhone}</p>
                <p>Hours: {selectedVendor.operatingHours || '8:00 AM - 10:00 PM'}</p>
              </div>

              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 space-y-1 text-amber-950">
                <span className="text-[10px] text-amber-700 font-extrabold uppercase tracking-wider block">Complaint Statistics</span>
                <p className="font-bold">• Total Complaints Received: {selectedVendor.complaintsCount || 0}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              {selectedVendor.status === 'active' ? (
                <button
                  onClick={() => handleUpdateStatus(selectedVendor, 'inactive')}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl"
                >
                  Deactivate Shop
                </button>
              ) : (
                <button
                  onClick={() => handleUpdateStatus(selectedVendor, 'active')}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl"
                >
                  Activate Shop
                </button>
              )}

              {selectedVendor.status !== 'suspended' && (
                <button
                  onClick={() => handleUpdateStatus(selectedVendor, 'suspended')}
                  className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl"
                >
                  Suspend
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default VendorManagementScreen;
