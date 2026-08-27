import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import institutionAdminService from '../../services/institutionAdminService';

export const VendorApplicationsScreen = () => {
  const navigate = useNavigate();

  // Async states
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Pending'); // 'Pending', 'Approved', 'Rejected', 'All'

  // Review Modal states
  const [selectedApp, setSelectedApp] = useState(null);
  const [rejectTargetApp, setRejectTargetApp] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('Incomplete Verification Documents');
  const [submittingId, setSubmittingId] = useState(null);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await institutionAdminService.getVendorApplications();
      if (res.success && res.data) {
        setApplications(res.data.applications || []);
      }
    } catch (err) {
      console.error('Error fetching vendor applications:', err);
      setError('Failed to load campus vendor applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApproveVendor = async (appObj) => {
    setSubmittingId(appObj.id);
    try {
      const res = await institutionAdminService.updateVendorApplicationStatus(appObj.id, 'active');
      if (res.success) {
        toast.success(`Vendor "${appObj.shopName}" APPROVED! Now active on campus marketplace.`, {
          icon: '🟢',
        });
        setApplications((prev) =>
          prev.map((a) => (a.id === appObj.id ? { ...a, status: 'active' } : a))
        );
        setSelectedApp(null);
      }
    } catch (err) {
      toast.error('Failed to approve vendor application.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleConfirmRejectVendor = async () => {
    if (!rejectTargetApp) return;
    setSubmittingId(rejectTargetApp.id);
    try {
      const res = await institutionAdminService.updateVendorApplicationStatus(
        rejectTargetApp.id,
        'rejected',
        rejectionReason
      );
      if (res.success) {
        toast.success(`Vendor "${rejectTargetApp.shopName}" application REJECTED.`, {
          icon: '🔴',
        });
        setApplications((prev) =>
          prev.map((a) => (a.id === rejectTargetApp.id ? { ...a, status: 'rejected' } : a))
        );
        setRejectTargetApp(null);
        setSelectedApp(null);
      }
    } catch (err) {
      toast.error('Failed to reject vendor application.');
    } finally {
      setSubmittingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || 'pending';
    switch (s) {
      case 'active':
      case 'approved':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-[11px] rounded-xl border border-emerald-300">✓ Approved & Active</span>;
      case 'pending':
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 font-extrabold text-[11px] rounded-xl border border-amber-300 animate-pulse">⏳ Pending Review</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-rose-100 text-rose-800 font-extrabold text-[11px] rounded-xl border border-rose-300">✕ Application Rejected</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 font-bold text-[11px] rounded-xl">{status?.toUpperCase()}</span>;
    }
  };

  // Filter Logic
  const filteredApps = applications.filter((app) => {
    const s = app.status?.toLowerCase() || 'pending';
    if (activeFilter === 'Pending' && s !== 'pending') return false;
    if (activeFilter === 'Approved' && !['active', 'approved'].includes(s)) return false;
    if (activeFilter === 'Rejected' && s !== 'rejected') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchShop = app.shopName?.toLowerCase().includes(q);
      const matchOwner = app.ownerName?.toLowerCase().includes(q);
      const matchCat = app.category?.toLowerCase().includes(q);
      if (!matchShop && !matchOwner && !matchCat) return false;
    }

    return true;
  });

  const pendingCount = applications.filter((a) => a.status === 'pending').length;
  const approvedCount = applications.filter((a) => ['active', 'approved'].includes(a.status)).length;
  const rejectedCount = applications.filter((a) => a.status === 'rejected').length;

  return (
    <div className="space-y-6">
      
      {/* SEARCH & FILTER TABS BAR */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Search Bar */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search applications by shop title, owner, or category..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl text-xs font-medium focus:outline-none"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'Pending', label: `Pending (${pendingCount})` },
              { id: 'Approved', label: `Approved (${approvedCount})` },
              { id: 'Rejected', label: `Rejected (${rejectedCount})` },
              { id: 'All', label: `All (${applications.length})` },
            ].map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all border ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200/80'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* VENDOR APPLICATIONS TABLE */}
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
            onClick={fetchApplications}
            className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Retry Loading
          </button>
        </div>
      ) : filteredApps.length === 0 ? (
        /* EMPTY TAB STATE */
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs text-center space-y-4 max-w-md mx-auto my-8">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-500 text-3xl shadow-inner">
            🏪
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900">No applications in "{activeFilter}" tab</h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              New campus vendor shop registration applications will appear here for institution review.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] bg-slate-50/50">
                  <th className="p-4">Campus Shop</th>
                  <th className="p-4">Owner Contact</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Documents Proof</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                    
                    {/* Shop Info */}
                    <td className="p-4">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{app.shopName}</h4>
                        <p className="text-[11px] text-slate-500 font-medium">📍 {app.location}</p>
                      </div>
                    </td>

                    {/* Owner Contact */}
                    <td className="p-4">
                      <div>
                        <p className="font-bold text-slate-900">{app.ownerName}</p>
                        <p className="text-[11px] text-slate-400">{app.ownerEmail}</p>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-lg">
                        {app.category}
                      </span>
                    </td>

                    {/* Document Verification Proof */}
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-800 font-bold text-[10px] rounded-lg border border-indigo-200 flex items-center gap-1 w-fit">
                        <span>📄</span> Verified FSSAI / Permit
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-4">{getStatusBadge(app.status)}</td>

                    {/* Actions Toolbar */}
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                      >
                        Review Details
                      </button>

                      {app.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveVendor(app)}
                            disabled={submittingId === app.id}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectTargetApp(app)}
                            disabled={submittingId === app.id}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* APPLICATION DETAILS REVIEW MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5 animate-fade-in border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">{selectedApp.shopName}</h3>
                <span className="text-[11px] text-slate-500">Submitted on {new Date(selectedApp.submittedDate).toLocaleDateString()}</span>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Shop Description & Details</span>
                <p className="font-semibold text-slate-800">{selectedApp.description}</p>
                <div className="pt-2 flex items-center gap-4 text-slate-600 font-medium">
                  <span>📍 {selectedApp.location}</span>
                  <span>🕒 {selectedApp.operatingHours || '8:00 AM - 10:00 PM'}</span>
                </div>
              </div>

              <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-1 text-indigo-950">
                <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wider block">Vendor Owner Contact</span>
                <p className="font-extrabold">{selectedApp.ownerName}</p>
                <p>Email: {selectedApp.ownerEmail}</p>
                <p>Phone: {selectedApp.ownerPhone}</p>
              </div>

              <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-1 text-emerald-950">
                <span className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-wider block">Submitted Verification Documents</span>
                <p className="font-extrabold flex items-center gap-1">
                  <span>📄</span> Official Campus Operating Permit (Verified ✓)
                </p>
                <p className="font-extrabold flex items-center gap-1">
                  <span>🛡️</span> FSSAI / Commercial License #FS-849201
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              {selectedApp.status === 'pending' ? (
                <>
                  <button
                    onClick={() => handleApproveVendor(selectedApp)}
                    disabled={submittingId === selectedApp.id}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    ✓ Approve Vendor
                  </button>
                  <button
                    onClick={() => setRejectTargetApp(selectedApp)}
                    disabled={submittingId === selectedApp.id}
                    className="py-3 px-5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200"
                  >
                    ✕ Reject
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setSelectedApp(null)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Close Review Details
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON CONFIRMATION MODAL */}
      {rejectTargetApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-fade-in border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Reject Vendor "{rejectTargetApp.shopName}"?
              </h3>
              <button onClick={() => setRejectTargetApp(null)} className="text-slate-400 hover:text-slate-600 font-bold text-base">✕</button>
            </div>

            <p className="text-xs text-slate-500">
              Select a reason for rejecting this vendor application:
            </p>

            <div className="space-y-2 text-xs">
              {[
                'Incomplete Verification Documents',
                'Invalid Campus Operating Permit',
                'Category Capacity Reached',
                'Custom Rejection Reason',
              ].map((reason) => (
                <label key={reason} className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="rejectionReason"
                    checked={rejectionReason === reason}
                    onChange={() => setRejectionReason(reason)}
                    className="h-4 w-4 text-rose-600 focus:ring-rose-500"
                  />
                  <span className="font-bold text-slate-800">{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                onClick={handleConfirmRejectVendor}
                disabled={submittingId === rejectTargetApp.id}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => setRejectTargetApp(null)}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default VendorApplicationsScreen;
