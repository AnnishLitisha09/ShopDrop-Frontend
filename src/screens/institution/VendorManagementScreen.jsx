import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import institutionAdminService from '../../services/institutionAdminService';

export const VendorManagementScreen = () => {
  const navigate = useNavigate();

  // Async states
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatusFilter, setActiveStatusFilter] = useState('All'); // 'All', 'Active', 'Inactive', 'Suspended'
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');

  // Details Modal drawer
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);

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

  const handleUpdateStatus = async (vendorObj, newStatus) => {
    setSubmittingId(vendorObj.id);
    try {
      const res = await institutionAdminService.updateVendorStatus(vendorObj.id, newStatus);
      if (res.success) {
        toast.success(`Vendor "${vendorObj.shopName}" status updated to ${newStatus.toUpperCase()}!`, {
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

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || 'active';
    switch (s) {
      case 'active':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-[11px] rounded-xl border border-emerald-300">✓ Active</span>;
      case 'inactive':
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 font-extrabold text-[11px] rounded-xl border border-slate-200">○ Inactive</span>;
      case 'suspended':
        return <span className="px-3 py-1 bg-rose-100 text-rose-800 font-extrabold text-[11px] rounded-xl border border-rose-300">✕ Suspended</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 font-bold text-[11px] rounded-xl">{status?.toUpperCase()}</span>;
    }
  };

  // Filter Logic
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
              No approved vendors match the selected filter criteria.
            </p>
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
                <p className="font-bold">• Unresolved Escalations: {selectedVendor.unresolvedComplaintsCount || 0}</p>
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
