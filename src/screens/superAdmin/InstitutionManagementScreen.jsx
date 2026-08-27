import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import superAdminService from '../../services/superAdminService';

export const InstitutionManagementScreen = () => {
  const navigate = useNavigate();

  // Async states
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All'); // 'All', 'Active', 'Inactive', 'Suspended'

  // Modal & Confirmation states
  const [selectedInst, setSelectedInst] = useState(null);
  const [confirmGuard, setConfirmGuard] = useState({ open: false, targetInst: null, targetStatus: '' });
  const [submittingId, setSubmittingId] = useState(null);

  const fetchInstitutions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await superAdminService.getInstitutionsList();
      if (res.success && res.data) {
        setInstitutions(res.data.institutions || []);
      }
    } catch (err) {
      console.error('Error fetching institutions list:', err);
      setError('Failed to load partner institutions directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const handleExecuteStatusUpdate = async () => {
    if (!confirmGuard.targetInst || !confirmGuard.targetStatus) return;
    const { targetInst, targetStatus } = confirmGuard;
    setSubmittingId(targetInst.id);
    try {
      const res = await superAdminService.updateInstitutionStatus(targetInst.id, targetStatus);
      if (res.success) {
        toast.success(`Institution "${targetInst.name}" set to ${targetStatus.toUpperCase()}!`, {
          icon: targetStatus === 'active' ? '🟢' : targetStatus === 'suspended' ? '🔴' : '🟡',
        });
        setInstitutions((prev) =>
          prev.map((inst) => (inst.id === targetInst.id ? { ...inst, status: targetStatus } : inst))
        );
        if (selectedInst?.id === targetInst.id) {
          setSelectedInst((prev) => ({ ...prev, status: targetStatus }));
        }
        setConfirmGuard({ open: false, targetInst: null, targetStatus: '' });
      }
    } catch (err) {
      toast.error('Failed to update institution status.');
    } finally {
      setSubmittingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || 'active';
    switch (s) {
      case 'active':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-[11px] rounded-xl border border-emerald-300">✓ Active Partner</span>;
      case 'inactive':
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 font-extrabold text-[11px] rounded-xl border border-slate-200">○ Inactive</span>;
      case 'suspended':
        return <span className="px-3 py-1 bg-rose-100 text-rose-800 font-extrabold text-[11px] rounded-xl border border-rose-300">✕ Suspended</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 font-bold text-[11px] rounded-xl">{status?.toUpperCase()}</span>;
    }
  };

  // Filter & Search Logic
  const filteredInstitutions = institutions.filter((inst) => {
    const s = inst.status?.toLowerCase() || 'active';
    if (activeFilter === 'Active' && s !== 'active') return false;
    if (activeFilter === 'Inactive' && s !== 'inactive') return false;
    if (activeFilter === 'Suspended' && s !== 'suspended') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = inst.name?.toLowerCase().includes(q);
      const matchCode = inst.code?.toLowerCase().includes(q);
      const matchAdmin = inst.adminEmail?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchAdmin) return false;
    }

    return true;
  });

  const activeCount = institutions.filter((i) => i.status === 'active').length;
  const inactiveCount = institutions.filter((i) => i.status === 'inactive').length;
  const suspendedCount = institutions.filter((i) => i.status === 'suspended').length;

  return (
    <div className="space-y-6">
      
      {/* SEARCH & FILTER BAR */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search institutions by name, code, or campus admin email..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 rounded-xl text-xs font-medium focus:outline-none"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'All', label: `All (${institutions.length})` },
              { id: 'Active', label: `Active (${activeCount})` },
              { id: 'Inactive', label: `Inactive (${inactiveCount})` },
              { id: 'Suspended', label: `Suspended (${suspendedCount})` },
            ].map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all border ${
                    isActive
                      ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
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

      {/* INSTITUTION DIRECTORY TABLE */}
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
            onClick={fetchInstitutions}
            className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Retry Loading
          </button>
        </div>
      ) : filteredInstitutions.length === 0 ? (
        /* EMPTY TAB STATE */
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs text-center space-y-4 max-w-md mx-auto my-8">
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto text-purple-600 text-3xl shadow-inner">
            🏛️
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900">No institutions in "{activeFilter}" tab</h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Registered partner campus institutions will appear here for platform administration.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] bg-slate-50/50">
                  <th className="p-4">Institution Name</th>
                  <th className="p-4">Admin Email</th>
                  <th className="p-4">Vendors</th>
                  <th className="p-4">Students</th>
                  <th className="p-4">Revenue</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInstitutions.map((inst) => (
                  <tr key={inst.id} className="hover:bg-slate-50/60 transition-colors">
                    
                    {/* Institution Name & Code */}
                    <td className="p-4">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{inst.name}</h4>
                        <p className="text-[11px] text-slate-500 font-mono">{inst.code} • {inst.city}</p>
                      </div>
                    </td>

                    {/* Admin Email */}
                    <td className="p-4 font-bold text-slate-900">
                      {inst.adminEmail}
                    </td>

                    {/* Vendors Count */}
                    <td className="p-4 font-bold text-slate-900">
                      {inst.activeVendorsCount || 0} active
                    </td>

                    {/* Students Count */}
                    <td className="p-4 font-semibold text-slate-700">
                      {inst.studentsCount || 0} students
                    </td>

                    {/* Revenue */}
                    <td className="p-4 font-black text-purple-600">
                      ₹{inst.revenue?.toFixed(2)}
                    </td>

                    {/* Status Badge */}
                    <td className="p-4">{getStatusBadge(inst.status)}</td>

                    {/* Actions Toolbar */}
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedInst(inst)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                      >
                        Details
                      </button>

                      {inst.status === 'active' ? (
                        <button
                          onClick={() => setConfirmGuard({ open: true, targetInst: inst, targetStatus: 'inactive' })}
                          disabled={submittingId === inst.id}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl transition-colors"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmGuard({ open: true, targetInst: inst, targetStatus: 'active' })}
                          disabled={submittingId === inst.id}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-colors"
                        >
                          Activate
                        </button>
                      )}

                      {inst.status !== 'suspended' && (
                        <button
                          onClick={() => setConfirmGuard({ open: true, targetInst: inst, targetStatus: 'suspended' })}
                          disabled={submittingId === inst.id}
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

      {/* INSTITUTION PERFORMANCE DETAILS MODAL */}
      {selectedInst && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-fade-in border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">{selectedInst.name}</h3>
                <span className="text-[11px] text-slate-500">{selectedInst.code} • {selectedInst.city}</span>
              </div>
              <button onClick={() => setSelectedInst(null)} className="text-slate-400 hover:text-slate-600 font-bold text-base">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100">
                  <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider block">Total Revenue</span>
                  <p className="text-lg font-black text-purple-700">₹{selectedInst.revenue?.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Orders</span>
                  <p className="text-lg font-black text-slate-900">{selectedInst.ordersCount} orders</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <p className="font-extrabold text-slate-900">Campus Admin & Domain</p>
                <p>Campus Admin: {selectedInst.adminName}</p>
                <p>Admin Email: {selectedInst.adminEmail}</p>
                <p>Domain: {selectedInst.domain}</p>
                <p>Onboarded Date: {new Date(selectedInst.createdDate).toLocaleDateString()}</p>
              </div>

              <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-1 text-indigo-950">
                <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wider block">Custom Address Fields Config</span>
                {selectedInst.addressFieldsConfig && selectedInst.addressFieldsConfig.length > 0 ? (
                  selectedInst.addressFieldsConfig.map((field, idx) => (
                    <p key={idx} className="font-bold">• {field.label} ({field.required ? 'Required' : 'Optional'})</p>
                  ))
                ) : (
                  <p className="italic text-slate-500">Default campus address config active.</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              {selectedInst.status === 'active' ? (
                <button
                  onClick={() => setConfirmGuard({ open: true, targetInst: selectedInst, targetStatus: 'inactive' })}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl"
                >
                  Deactivate Campus
                </button>
              ) : (
                <button
                  onClick={() => setConfirmGuard({ open: true, targetInst: selectedInst, targetStatus: 'active' })}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl"
                >
                  Activate Campus
                </button>
              )}

              {selectedInst.status !== 'suspended' && (
                <button
                  onClick={() => setConfirmGuard({ open: true, targetInst: selectedInst, targetStatus: 'suspended' })}
                  className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl"
                >
                  Suspend
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION GUARD MODAL */}
      {confirmGuard.open && confirmGuard.targetInst && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-fade-in border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-base font-extrabold text-slate-900">
                Confirm Status Change for "{confirmGuard.targetInst.name}"
              </h3>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Are you sure you want to set status to <span className="font-bold uppercase text-slate-900">{confirmGuard.targetStatus}</span>? This operation will affect campus commerce access for this institution.
            </p>

            <div className="flex items-center gap-3 pt-3">
              <button
                onClick={handleExecuteStatusUpdate}
                disabled={submittingId === confirmGuard.targetInst.id}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs disabled:opacity-50"
              >
                Execute Change
              </button>
              <button
                onClick={() => setConfirmGuard({ open: false, targetInst: null, targetStatus: '' })}
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

export default InstitutionManagementScreen;
