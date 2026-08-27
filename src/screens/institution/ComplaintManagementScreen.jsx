import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import institutionAdminService from '../../services/institutionAdminService';

export const ComplaintManagementScreen = () => {
  const navigate = useNavigate();

  // Async states
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatusFilter, setActiveStatusFilter] = useState('All'); // 'All', 'Escalated', 'Open', 'Under Review', 'Resolved'

  // Review & Dispute Mediation Modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [resolutionNoteInput, setResolutionNoteInput] = useState('');
  const [submittingId, setSubmittingId] = useState(null);

  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await institutionAdminService.getComplaints();
      if (res.success && res.data) {
        setComplaints(res.data.complaints || []);
      }
    } catch (err) {
      console.error('Error fetching complaints list:', err);
      setError('Failed to load campus disputes & complaints queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleUpdateComplaintStatus = async (complaintId, newStatus) => {
    setSubmittingId(complaintId);
    try {
      const res = await institutionAdminService.updateComplaintStatus(
        complaintId,
        newStatus,
        resolutionNoteInput
      );
      if (res.success) {
        toast.success(`Complaint #${complaintId} dispute status set to ${newStatus.toUpperCase()}!`, {
          icon: newStatus === 'resolved' ? '🟢' : '🔵',
        });
        setComplaints((prev) =>
          prev.map((c) =>
            c.id === complaintId
              ? {
                  ...c,
                  status: newStatus,
                  resolutionNotes: resolutionNoteInput || c.resolutionNotes,
                }
              : c
          )
        );
        if (selectedComplaint?.id === complaintId) {
          setSelectedComplaint((prev) => ({
            ...prev,
            status: newStatus,
            resolutionNotes: resolutionNoteInput || prev.resolutionNotes,
          }));
        }
        setResolutionNoteInput('');
      }
    } catch (err) {
      toast.error('Failed to update complaint status.');
    } finally {
      setSubmittingId(null);
    }
  };

  const getPriorityBadge = (priority) => {
    const p = priority?.toLowerCase() || 'medium';
    switch (p) {
      case 'high':
        return <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 font-extrabold text-[10px] rounded-lg border border-rose-300">🔴 High Priority</span>;
      case 'medium':
        return <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 font-extrabold text-[10px] rounded-lg border border-amber-300">🟡 Medium</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 font-extrabold text-[10px] rounded-lg border border-blue-300">🔵 Low</span>;
    }
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || 'open';
    switch (s) {
      case 'escalated':
        return <span className="px-3 py-1 bg-purple-100 text-purple-800 font-extrabold text-[11px] rounded-xl border border-purple-300">⚠️ Escalated to Admin</span>;
      case 'under review':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 font-extrabold text-[11px] rounded-xl border border-blue-300">🔍 Under Review</span>;
      case 'resolved':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-[11px] rounded-xl border border-emerald-300">✓ Resolved</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 font-bold text-[11px] rounded-xl border border-slate-200">✕ Dispute Rejected</span>;
      default:
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-[11px] rounded-xl border border-amber-300">⏳ Open Complaint</span>;
    }
  };

  // Filter Logic
  const filteredComplaints = complaints.filter((c) => {
    const s = c.status?.toLowerCase() || 'open';
    if (activeStatusFilter === 'Escalated' && s !== 'escalated') return false;
    if (activeStatusFilter === 'Open' && s !== 'open') return false;
    if (activeStatusFilter === 'Under Review' && s !== 'under review') return false;
    if (activeStatusFilter === 'Resolved' && s !== 'resolved') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchId = c.id?.toLowerCase().includes(q);
      const matchStudent = c.studentName?.toLowerCase().includes(q);
      const matchVendor = c.vendorShopName?.toLowerCase().includes(q);
      const matchReason = c.reason?.toLowerCase().includes(q);
      if (!matchId && !matchStudent && !matchVendor && !matchReason) return false;
    }

    return true;
  });

  const escalatedCount = complaints.filter((c) => c.status === 'escalated').length;
  const openCount = complaints.filter((c) => c.status === 'open').length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;

  return (
    <div className="space-y-6">
      
      {/* SEARCH & STATUS FILTER TOOLBAR */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search disputes by complaint ID, student, vendor, or category..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl text-xs font-medium focus:outline-none"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'All', label: `All (${complaints.length})` },
              { id: 'Escalated', label: `Escalated (${escalatedCount})` },
              { id: 'Open', label: `Open (${openCount})` },
              { id: 'Resolved', label: `Resolved (${resolvedCount})` },
            ].map((tab) => {
              const isActive = activeStatusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveStatusFilter(tab.id)}
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

      {/* COMPLAINTS DISPUTES TABLE */}
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
            onClick={fetchComplaints}
            className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Retry Loading
          </button>
        </div>
      ) : filteredComplaints.length === 0 ? (
        /* EMPTY STATE */
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs text-center space-y-4 max-w-md mx-auto my-8">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-500 text-3xl shadow-inner">
            💬
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900">No disputes in "{activeStatusFilter}" tab</h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Student-Vendor dispute escalations will appear here for institution mediation.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] bg-slate-50/50">
                  <th className="p-4">Complaint ID</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Vendor Shop</th>
                  <th className="p-4">Dispute Reason</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredComplaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    
                    {/* Complaint ID & Date */}
                    <td className="p-4">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-xs">#{c.id}</h4>
                        <p className="text-[10px] text-slate-400 font-mono">Order #{c.orderId?.substring(0, 8)}</p>
                      </div>
                    </td>

                    {/* Student Name */}
                    <td className="p-4 font-bold text-slate-900">{c.studentName}</td>

                    {/* Vendor Shop & Past Complaints Counter */}
                    <td className="p-4">
                      <div>
                        <p className="font-bold text-slate-900">{c.vendorShopName}</p>
                        {c.vendorPastComplaints > 0 && (
                          <span className="text-[10px] text-rose-700 font-extrabold">
                            ⚠️ {c.vendorPastComplaints} past complaints
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Dispute Reason */}
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-lg">
                        {c.reason}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="p-4">{getPriorityBadge(c.priority)}</td>

                    {/* Status Badge */}
                    <td className="p-4">{getStatusBadge(c.status)}</td>

                    {/* Actions Toolbar */}
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedComplaint(c);
                          setResolutionNoteInput(c.resolutionNotes || '');
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-colors"
                      >
                        Mediate Dispute
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DISPUTE MEDIATION MODAL */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5 animate-fade-in border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Dispute #{selectedComplaint.id}</h3>
                <span className="text-[11px] text-slate-500">Order #{selectedComplaint.orderId} • {selectedComplaint.reason}</span>
              </div>
              <button onClick={() => setSelectedComplaint(null)} className="text-slate-400 hover:text-slate-600 font-bold text-base">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              
              {/* Recurring Vendor Complaints Counter Box */}
              {selectedComplaint.vendorPastComplaints > 0 && (
                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200/80 text-rose-900 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚠️</span>
                    <h4 className="font-extrabold text-xs">Vendor Warning: Recurring Complaints Offender</h4>
                  </div>
                  <p className="text-[11px] font-medium text-rose-800">
                    Vendor <span className="font-bold">{selectedComplaint.vendorShopName}</span> has received {selectedComplaint.vendorPastComplaints} complaints from students on campus.
                  </p>
                </div>
              )}

              {/* Student Complaint Details */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Student Complaint</span>
                <p className="font-bold text-slate-900">{selectedComplaint.studentName}:</p>
                <p className="font-medium text-slate-700 italic">"{selectedComplaint.description}"</p>
              </div>

              {/* Vendor Response */}
              <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-1 text-indigo-950">
                <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wider block">Vendor Shop Response</span>
                <p className="font-bold">{selectedComplaint.vendorShopName}:</p>
                <p className="font-medium italic">"{selectedComplaint.vendorResponse || 'No response recorded by vendor shop yet.'}"</p>
              </div>

              {/* Admin Mediation Resolution Notes Input */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-extrabold text-slate-900">Institution Admin Resolution Notes</label>
                <textarea
                  rows="2"
                  value={resolutionNoteInput}
                  onChange={(e) => setResolutionNoteInput(e.target.value)}
                  placeholder="Enter official mediation resolution notes or vendor directive..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-2xl text-xs font-medium focus:outline-none"
                ></textarea>
              </div>

            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => handleUpdateComplaintStatus(selectedComplaint.id, 'resolved')}
                disabled={submittingId === selectedComplaint.id}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                ✓ Mark Dispute Resolved
              </button>

              <button
                onClick={() => handleUpdateComplaintStatus(selectedComplaint.id, 'under review')}
                disabled={submittingId === selectedComplaint.id}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Under Review
              </button>

              <button
                onClick={() => handleUpdateComplaintStatus(selectedComplaint.id, 'rejected')}
                disabled={submittingId === selectedComplaint.id}
                className="py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200"
              >
                ✕ Reject
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ComplaintManagementScreen;
