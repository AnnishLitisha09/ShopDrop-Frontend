import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';

export const InstitutionAdminDashboard = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (outletContext?.data) {
      setData(outletContext.data);
      setLoading(outletContext.loading);
      setError(outletContext.error);
    }
  }, [outletContext]);

  const getRatingBadge = (rating) => {
    return (
      <span className="px-2.5 py-1 bg-amber-50 text-amber-800 font-extrabold text-[10px] rounded-lg border border-amber-200/80 flex items-center gap-1">
        <span>★</span> {rating?.toFixed(1) || '4.8'}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || 'active';
    if (s === 'active') {
      return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded-lg border border-emerald-300">✓ Active</span>;
    }
    return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-extrabold text-[10px] rounded-lg border border-amber-300">⏳ Pending Approval</span>;
  };

  const maxOrders = data?.orderActivity?.length ? Math.max(...data.orderActivity.map((a) => a.orders), 50) : 50;

  return (
    <div className="space-y-6">
      {loading ? (
        /* Loading Skeletons */
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
            className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Retry Loading
          </button>
        </div>
      ) : data && (
        <>
          {/* HEADER BANNER */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl text-white p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-2 relative z-10">
              <span className="text-[10px] font-extrabold text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-400/30 uppercase tracking-wider">
                {data.institution?.name || 'Stanford University'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight pt-1">
                Campus Commerce Overview 🏛️
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                Comprehensive multi-vendor commerce and student purchasing analytics.
              </p>
            </div>

            <div className="bg-slate-800/80 p-3 px-4 rounded-2xl border border-slate-700/60 text-xs font-bold text-slate-300 shrink-0 self-start sm:self-center">
              <span>📅 Period: Today / Last 30 Days</span>
            </div>

            <div className="absolute right-0 bottom-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-0"></div>
          </div>

          {/* REAL KPI METRICS CARDS GRID */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            {/* Total Vendors */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1 hover:shadow-md transition-shadow">
              <span className="text-2xl">🏪</span>
              <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">Campus Vendors</span>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-black text-slate-900">{data.kpi.totalVendorsCount}</p>
                <span className="text-[11px] font-bold text-emerald-600">{data.kpi.activeVendorsCount} Active</span>
              </div>
            </div>

            {/* Total Students */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1 hover:shadow-md transition-shadow">
              <span className="text-2xl">🎓</span>
              <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">Enrolled Students</span>
              <p className="text-2xl font-black text-indigo-600">{data.kpi.totalStudentsCount}</p>
            </div>

            {/* Today's Orders */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1 hover:shadow-md transition-shadow">
              <span className="text-2xl">📦</span>
              <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">Today's Orders</span>
              <p className="text-2xl font-black text-amber-600">{data.kpi.todayOrdersCount}</p>
            </div>

            {/* Campus Revenue */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1 hover:shadow-md transition-shadow">
              <span className="text-2xl">💰</span>
              <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">Campus Revenue</span>
              <p className="text-2xl font-black text-slate-900">₹{data.kpi.campusRevenueAmount?.toFixed(2)}</p>
            </div>

          </div>

          {/* QUICK ACTIONS TOOLBAR */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
            <span className="text-slate-400 uppercase tracking-wider text-[10px]">Institution Quick Actions:</span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => navigate('/institution-admin/vendor-applications')}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-2xs transition-colors"
              >
                + Approve Vendor
              </button>
              <button
                onClick={() => navigate('/institution-admin/vendors')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
              >
                Manage Vendors
              </button>
              <button
                onClick={() => navigate('/institution-admin/analytics')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
              >
                View Analytics
              </button>
              <button
                onClick={() => navigate('/institution-admin/complaints')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
              >
                View Complaints ({data.kpi.openComplaintsCount})
              </button>
            </div>
          </div>

          {/* TOP VENDORS TABLE & CATEGORY BREAKDOWN CHART GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Top Vendors Performance Table (2 Cols) */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>🏆</span> Top Campus Vendors Performance
                </h3>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                  Ranked by Revenue
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="pb-3">Vendor Shop</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Orders</th>
                      <th className="pb-3">Revenue (₹)</th>
                      <th className="pb-3">Rating</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.topVendors?.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5">
                          <div>
                            <p className="font-extrabold text-slate-900">{v.shopName}</p>
                            <p className="text-[10px] text-slate-400">{v.location}</p>
                          </div>
                        </td>
                        <td className="py-3.5 font-semibold text-slate-600">{v.category}</td>
                        <td className="py-3.5 font-bold text-slate-900">{v.ordersCount} orders</td>
                        <td className="py-3.5 font-black text-indigo-600">₹{v.revenue?.toFixed(2)}</td>
                        <td className="py-3.5">{getRatingBadge(v.rating)}</td>
                        <td className="py-3.5 text-right">{getStatusBadge(v.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category Sales Breakdown Chart */}
            <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>🏷️</span> Category Sales Breakdown
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Distribution by product category</p>
              </div>

              <div className="space-y-4">
                {data.categoryBreakdown?.map((cat, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-800">{cat.category}</span>
                      <span className="text-indigo-600">₹{cat.sales?.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, (cat.sales / 15000) * 100)}%` }}
                        className="bg-indigo-600 h-full rounded-full"
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* PEAK ORDER ACTIVITY CHART & PENDING ACTIONS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* 7-Day Peak Ordering Activity Chart (2 Cols) */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <span>📈</span> Peak Campus Ordering Periods
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">Daily order volume insights over the last 7 days</p>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                  Peak: 12 PM - 2 PM
                </span>
              </div>

              <div className="h-44 w-full flex items-end justify-between gap-3 pt-4 px-2">
                {data.orderActivity?.map((item, idx) => {
                  const heightPercent = Math.max(15, Math.min(100, (item.orders / maxOrders) * 100));

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                      <span className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.orders} orders
                      </span>
                      <div className="w-full bg-slate-100 rounded-t-lg overflow-hidden flex items-end h-32">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full bg-gradient-to-t from-indigo-600 to-indigo-500 rounded-t-lg group-hover:from-indigo-700 group-hover:to-indigo-600 transition-all duration-300"
                        ></div>
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-500">{item.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pending Actions & Risk Alerts Section */}
            <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <span>⚡</span> Pending Actions & Alerts
              </h3>

              <div className="space-y-3">
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <h4 className="font-bold text-amber-950">Pending Vendor Registrations</h4>
                    <span className="text-[10px] text-amber-800 font-medium">Requires campus approval</span>
                  </div>
                  <button
                    onClick={() => navigate('/institution-admin/vendor-applications')}
                    className="px-3 py-1.5 bg-amber-600 text-white font-bold text-xs rounded-xl shadow-2xs"
                  >
                    Review ({data.kpi.pendingVendorsCount})
                  </button>
                </div>

                <div className="p-3.5 bg-indigo-50 rounded-2xl border border-indigo-200/80 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <h4 className="font-bold text-indigo-950">Open Student Complaints</h4>
                    <span className="text-[10px] text-indigo-800 font-medium">Pending support review</span>
                  </div>
                  <button
                    onClick={() => navigate('/institution-admin/complaints')}
                    className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-2xs"
                  >
                    View ({data.kpi.openComplaintsCount})
                  </button>
                </div>
              </div>
            </div>

          </div>

        </>
      )}
    </div>
  );
};

export default InstitutionAdminDashboard;
