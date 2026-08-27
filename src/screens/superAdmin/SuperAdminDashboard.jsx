import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import superAdminService from '../../services/superAdminService';

export const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal drawers & forms
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formDomain, setFormDomain] = useState('');
  const [formAdminName, setFormAdminName] = useState('');
  const [formAdminEmail, setFormAdminEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (outletContext?.data) {
      setData(outletContext.data);
      setLoading(outletContext.loading);
      setError(outletContext.error);
    }
  }, [outletContext]);

  const handleExecuteStatusChange = (instObj, targetStatus) => {
    setSubmittingId(instObj.id);
    setTimeout(() => {
      toast.success(`Institution "${instObj.name}" set to ${targetStatus.toUpperCase()}!`, {
        icon: targetStatus === 'active' ? '🟢' : '🔴',
      });
      setData((prev) => ({
        ...prev,
        institutions: prev.institutions.map((i) => (i.id === instObj.id ? { ...i, status: targetStatus } : i)),
      }));
      setConfirmGuard({ open: false, instId: null, action: '' });
      setSelectedInst(null);
      setSubmittingId(null);
    }, 400);
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || 'active';
    switch (s) {
      case 'active':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded-lg border border-emerald-300">✓ Active Partner</span>;
      case 'inactive':
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-extrabold text-[10px] rounded-lg border border-slate-200">○ Inactive</span>;
      case 'suspended':
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 font-extrabold text-[10px] rounded-lg border border-rose-300">✕ Suspended</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-lg">{status?.toUpperCase()}</span>;
    }
  };

  const maxRevenue = data?.growthTrend?.length ? Math.max(...data.growthTrend.map((g) => g.revenue), 100000) : 100000;

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-28 bg-white rounded-3xl border border-slate-200"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200"></div>
            ))}
          </div>
          <div className="h-64 bg-white rounded-3xl border border-slate-200"></div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-3xl text-center space-y-3 max-w-md mx-auto my-8">
          <p className="text-xs font-bold text-rose-800">{error}</p>
          <button
            onClick={() => outletContext?.fetchDashboardStats?.()}
            className="px-5 py-2.5 bg-purple-600 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Retry Loading
          </button>
        </div>
      ) : data && (
        <>
          {/* HEADER BANNER */}
          <div className="bg-gradient-to-r from-slate-950 via-purple-950 to-slate-900 rounded-3xl text-white p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden ring-1 ring-purple-900/40">
            <div className="space-y-2 relative z-10">
              <span className="text-[10px] font-extrabold text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-400/30 uppercase tracking-widest">
                Platform SaaS Administration
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight pt-1">
                Shop Drop Network Command 🌐
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                Multi-campus network performance, institution growth, and cross-campus transactions.
              </p>
            </div>

            <div className="bg-slate-900/90 p-3.5 px-4 rounded-2xl border border-slate-800 text-xs font-bold text-slate-300 shrink-0 self-start sm:self-center backdrop-blur-md">
              <span className="text-purple-400">⚡ Live Network Health: 100%</span>
            </div>

            <div className="absolute right-0 bottom-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -z-0"></div>
          </div>

          {/* REAL PLATFORM KPI METRICS GRID */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            {/* Total Institutions */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1 hover:shadow-md transition-shadow">
              <span className="text-2xl">🏛️</span>
              <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">Partner Institutions</span>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-black text-slate-900">{data.kpi.totalInstitutionsCount}</p>
                <span className="text-[11px] font-bold text-emerald-600">{data.kpi.activeInstitutionsCount} Active</span>
              </div>
            </div>

            {/* Total Vendors */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1 hover:shadow-md transition-shadow">
              <span className="text-2xl">🏪</span>
              <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">Platform Vendors</span>
              <p className="text-2xl font-black text-purple-600">{data.kpi.totalVendorsCount}</p>
            </div>

            {/* Total Users */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1 hover:shadow-md transition-shadow">
              <span className="text-2xl">👥</span>
              <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">Active Students</span>
              <p className="text-2xl font-black text-amber-600">{data.kpi.totalUsersCount}</p>
            </div>

            {/* Platform Revenue */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1 hover:shadow-md transition-shadow">
              <span className="text-2xl">💰</span>
              <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">Platform Revenue</span>
              <p className="text-2xl font-black text-slate-900">₹{data.kpi.platformRevenueAmount?.toFixed(2)}</p>
            </div>

          </div>

          {/* QUICK ACTIONS TOOLBAR */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
            <span className="text-slate-400 uppercase tracking-wider text-[10px]">Super Admin Actions:</span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  setFormName('');
                  setFormCode('');
                  setFormCity('');
                  setFormDomain('');
                  setFormAdminName('');
                  setFormAdminEmail('');
                  setFormError(null);
                  setAddModalOpen(true);
                }}
                className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-2xs transition-all"
              >
                + Add Institution
              </button>
              <button
                onClick={() => navigate('/super-admin/institutions')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
              >
                Manage Institutions
              </button>
              <button
                onClick={() => navigate('/super-admin/analytics')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
              >
                Platform Analytics
              </button>
            </div>
          </div>

          {/* INSTITUTION PERFORMANCE TABLE & CATEGORY PERFORMANCE GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Institution Performance Table (2 Cols) */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>🏆</span> Partner Institutions Ranking
                </h3>
                <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md">
                  Sorted by Volume
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="pb-3">Institution Name</th>
                      <th className="pb-3">Vendors</th>
                      <th className="pb-3">Students</th>
                      <th className="pb-3">Orders</th>
                      <th className="pb-3">Revenue (₹)</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.institutions?.map((inst) => (
                      <tr key={inst.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5">
                          <div>
                            <p className="font-extrabold text-slate-900">{inst.name}</p>
                            <p className="text-[10px] text-slate-400">{inst.code} • {inst.city}</p>
                          </div>
                        </td>
                        <td className="py-3.5 font-bold text-slate-800">{inst.activeVendorsCount} vendors</td>
                        <td className="py-3.5 font-bold text-slate-800">{inst.studentsCount} students</td>
                        <td className="py-3.5 font-bold text-slate-900">{inst.ordersCount} orders</td>
                        <td className="py-3.5 font-black text-purple-600">₹{inst.revenue?.toFixed(2)}</td>
                        <td className="py-3.5 text-right">{getStatusBadge(inst.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category Performance Share */}
            <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>🏷️</span> Platform Category Performance
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Cross-campus category revenue distribution</p>
              </div>

              <div className="space-y-4">
                {data.categoryPerformance?.map((cat, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-800">{cat.category}</span>
                      <span className="text-purple-600">₹{cat.sales?.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${cat.percentage}%` }}
                        className="bg-purple-600 h-full rounded-full"
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* PLATFORM GROWTH CHART & RECENT NETWORK ACTIVITY */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* 6-Month Platform Growth Trend Chart */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <span>📈</span> 6-Month Platform Revenue & User Trajectory
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">SaaS expansion analytics across onboarded partner campuses</p>
                </div>
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
                  Network Growth
                </span>
              </div>

              <div className="h-44 w-full flex items-end justify-between gap-3 pt-4 px-2">
                {data.growthTrend?.map((item, idx) => {
                  const heightPercent = Math.max(15, Math.min(100, (item.revenue / maxRevenue) * 100));

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                      <span className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        ₹{item.revenue}
                      </span>
                      <div className="w-full bg-slate-100 rounded-t-lg overflow-hidden flex items-end h-32">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full bg-gradient-to-t from-purple-600 via-indigo-600 to-purple-500 rounded-t-lg group-hover:from-purple-700 group-hover:to-indigo-700 transition-all duration-300"
                        ></div>
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-500">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Network Activity Feed */}
            <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <span>⚡</span> Recent Network Events
              </h3>

              <div className="space-y-3">
                {data.recentActivity?.map((act) => (
                  <div key={act.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-3 text-xs">
                    <span className="text-base">{act.icon || '📌'}</span>
                    <div>
                      <h4 className="font-extrabold text-slate-900">{act.title}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">{act.description}</p>
                      <span className="text-[10px] text-purple-600 font-bold block pt-0.5">{act.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* MODAL: ADD INSTITUTION */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Onboard Partner Institution</h3>
                <p className="text-xs text-slate-500">Create new campus instance & institution admin user.</p>
              </div>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-xs font-bold text-rose-800">
                ⚠️ {formError}
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setFormError(null);

                if (!formName.trim()) return setFormError('Institution Name is required.');
                if (!formCode.trim()) return setFormError('Institution Code is required.');
                if (!formAdminEmail.trim()) return setFormError('Campus Admin Email is required.');

                setSubmitting(true);
                try {
                  const res = await superAdminService.createInstitution({
                    name: formName.trim(),
                    code: formCode.trim(),
                    city: formCity.trim(),
                    domain: formDomain.trim(),
                    adminName: formAdminName.trim(),
                    adminEmail: formAdminEmail.trim(),
                  });

                  if (res.success) {
                    toast.success(`Institution "${formName.trim()}" onboarded!`, { icon: '🏛️' });
                    setAddModalOpen(false);
                    if (outletContext?.fetchDashboardStats) {
                      outletContext.fetchDashboardStats();
                    }
                  }
                } catch (err) {
                  console.error('Error creating institution:', err);
                  const msg = err.response?.data?.message || 'Failed to onboard institution.';
                  setFormError(msg);
                } finally {
                  setSubmitting(false);
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">Institution Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Harvard University"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-extrabold text-slate-900 focus:bg-white focus:border-purple-600 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Campus Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. HARVARD"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-extrabold text-purple-700 focus:bg-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Cambridge, MA"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">Official Email Domain</label>
                <input
                  type="text"
                  placeholder="harvard.edu"
                  value={formDomain}
                  onChange={(e) => setFormDomain(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium"
                />
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-3">
                <h4 className="text-xs font-extrabold text-purple-800 uppercase tracking-wider">
                  Campus Admin Credentials
                </h4>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Admin Name</label>
                  <input
                    type="text"
                    placeholder="Harvard Admin"
                    value={formAdminName}
                    onChange={(e) => setFormAdminName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Admin Email Address *</label>
                  <input
                    type="email"
                    placeholder="admin@harvard.edu"
                    value={formAdminEmail}
                    onChange={(e) => setFormAdminEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-purple-600 focus:outline-none"
                    required
                  />
                </div>
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
                  className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Onboarding...' : 'Onboard Campus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
