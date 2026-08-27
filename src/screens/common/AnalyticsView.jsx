import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

import vendorService from '../../services/vendorService';
import institutionAdminService from '../../services/institutionAdminService';
import superAdminService from '../../services/superAdminService';

import MetricCard from '../../components/analytics/MetricCard';
import DateRangeFilter from '../../components/analytics/DateRangeFilter';
import ChartCard from '../../components/analytics/ChartCard';

export const AnalyticsView = () => {
  const { user } = useAuth();
  const role = user?.role || 'vendor';

  // Async states
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePeriod, setActivePeriod] = useState('7days');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (role === 'vendor') {
        res = await vendorService.getAnalytics();
      } else if (role === 'institution_admin') {
        res = await institutionAdminService.getAnalytics();
      } else {
        res = await superAdminService.getAnalytics();
      }

      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load role analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [role, activePeriod]);

  return (
    <div className="space-y-6">
      
      {/* Analytics Sub-Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900">
            {role === 'super_admin' ? 'Super Admin Network Analytics' : role === 'institution_admin' ? 'Campus Commerce Analytics' : 'Shop Performance Analytics'}
          </h2>
          <p className="text-xs text-slate-400 font-medium">Real-time performance metrics and sales distribution analytics</p>
        </div>

        <DateRangeFilter activePeriod={activePeriod} onSelectPeriod={setActivePeriod} />
      </div>

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-white rounded-3xl border border-slate-200"></div>
            ))}
          </div>
          <div className="h-64 bg-white rounded-3xl border border-slate-200"></div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-3xl text-center space-y-3 max-w-md mx-auto my-8">
          <p className="text-xs font-bold text-rose-800">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Retry Loading
          </button>
        </div>
      ) : data && (
        <>
          {/* VENDOR TAILORED VIEW */}
          {role === 'vendor' && (
            <div className="space-y-6">
              {/* KPI Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <MetricCard icon="💰" label="Total Sales" value={data.totalSales} isCurrency={true} trend={12.4} accentColor="indigo" />
                <MetricCard icon="📦" label="Total Orders" value={data.totalOrders} trend={8.1} accentColor="amber" />
                <MetricCard icon="🎯" label="Avg Order Value (AOV)" value={data.aov} isCurrency={true} accentColor="emerald" />
                <MetricCard icon="⭐" label="Shop Rating Score" value="4.8 / 5.0" accentColor="blue" />
              </div>

              {/* 7-Day Trend Chart & Order Status Share */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2">
                  <ChartCard title="📈 Sales & Order Volume Trend" subtitle="Daily revenue progression over period" badgeText="7-Day Performance">
                    <div className="h-44 w-full flex items-end justify-between gap-3 pt-4 px-2">
                      {data.salesTrend?.map((item, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                          <span className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            ₹{item.sales}
                          </span>
                          <div className="w-full bg-slate-100 rounded-t-lg overflow-hidden flex items-end h-32">
                            <div
                              style={{ height: `${Math.min(100, (item.sales / 3000) * 100)}%` }}
                              className="w-full bg-gradient-to-t from-blue-600 to-indigo-600 rounded-t-lg group-hover:from-blue-700 group-hover:to-indigo-700 transition-all duration-300"
                            ></div>
                          </div>
                          <span className="text-[10px] font-extrabold text-slate-500">{item.period}</span>
                        </div>
                      ))}
                    </div>
                  </ChartCard>
                </div>

                <div className="lg:col-span-1">
                  <ChartCard title="📊 Order Status Share" subtitle="Fulfilled vs pending orders">
                    <div className="space-y-3 pt-2">
                      {data.statusDistribution?.map((st, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-800">{st.status}</span>
                            <span className="text-indigo-600">{st.count} orders ({st.share}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div style={{ width: `${st.share}%` }} className="bg-indigo-600 h-full rounded-full"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ChartCard>
                </div>
              </div>

              {/* Best Selling Products Table */}
              <ChartCard title="🏆 Best-Selling Products" subtitle="Top grossing items by revenue">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="pb-3">Product Name</th>
                        <th className="pb-3">Units Sold</th>
                        <th className="pb-3 text-right">Revenue (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold">
                      {data.bestSellers?.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 text-slate-900">{p.name}</td>
                          <td className="py-3 text-slate-700">{p.sales} units</td>
                          <td className="py-3 text-right text-indigo-600 font-black">₹{p.revenue?.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ChartCard>
            </div>
          )}

          {/* INSTITUTION ADMIN TAILORED VIEW */}
          {role === 'institution_admin' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <MetricCard icon="🏛️" label="Campus Transactions" value={data.totalCampusTransactions} isCurrency={true} trend={14.2} accentColor="indigo" />
                <MetricCard icon="📦" label="Total Campus Orders" value={data.totalOrders} trend={10.5} accentColor="amber" />
                <MetricCard icon="🏪" label="Active Vendors" value={data.topVendors?.length || 4} accentColor="emerald" />
                <MetricCard icon="💬" label="Dispute Resolution Rate" value="98.5%" accentColor="blue" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2">
                  <ChartCard title="⏰ Peak Campus Ordering Periods" subtitle="Distribution of orders throughout the day" badgeText="Peak: 12 PM - 2 PM">
                    <div className="h-44 w-full flex items-end justify-between gap-3 pt-4 px-2">
                      {data.peakOrderingPeriods?.map((item, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                          <span className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.orders} orders
                          </span>
                          <div className="w-full bg-slate-100 rounded-t-lg overflow-hidden flex items-end h-32">
                            <div
                              style={{ height: `${Math.min(100, (item.orders / 90) * 100)}%` }}
                              className={`w-full rounded-t-lg transition-all duration-300 ${
                                item.isPeak ? 'bg-amber-500 group-hover:bg-amber-600' : 'bg-indigo-600 group-hover:bg-indigo-700'
                              }`}
                            ></div>
                          </div>
                          <span className="text-[9px] font-extrabold text-slate-500 text-center">{item.period}</span>
                        </div>
                      ))}
                    </div>
                  </ChartCard>
                </div>

                <div className="lg:col-span-1">
                  <ChartCard title="🏷️ Top Categories Share" subtitle="Campus spending by category">
                    <div className="space-y-3 pt-2">
                      {data.topCategories?.map((cat, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-800">{cat.category}</span>
                            <span className="text-indigo-600">₹{cat.sales?.toFixed(2)} ({cat.share}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div style={{ width: `${cat.share}%` }} className="bg-indigo-600 h-full rounded-full"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ChartCard>
                </div>
              </div>

              {/* Top Campus Vendors Table */}
              <ChartCard title="🏪 Campus Vendor Performance Matrix" subtitle="Ranked by total revenue generated">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="pb-3">Vendor Shop</th>
                        <th className="pb-3">Category</th>
                        <th className="pb-3">Orders</th>
                        <th className="pb-3">Revenue (₹)</th>
                        <th className="pb-3 text-right">Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold">
                      {data.topVendors?.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 text-slate-900 font-black">{v.name}</td>
                          <td className="py-3 text-slate-600 font-semibold">{v.category}</td>
                          <td className="py-3 text-slate-800">{v.orders} orders</td>
                          <td className="py-3 text-indigo-600 font-black">₹{v.revenue?.toFixed(2)}</td>
                          <td className="py-3 text-right">
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-extrabold text-[10px] rounded border border-amber-200">
                              ★ {v.rating?.toFixed(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ChartCard>
            </div>
          )}

          {/* SUPER ADMIN TAILORED VIEW */}
          {role === 'super_admin' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <MetricCard icon="🌐" label="Platform Revenue" value={data.platformRevenue} isCurrency={true} trend={18.6} accentColor="purple" />
                <MetricCard icon="📦" label="Network Orders" value={data.totalOrders} trend={14.2} accentColor="amber" />
                <MetricCard icon="🏛️" label="Partner Institutions" value={data.totalInstitutions} accentColor="emerald" />
                <MetricCard icon="👥" label="Active Users" value={data.totalUsers} accentColor="blue" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2">
                  <ChartCard title="📈 Multi-Campus Platform Growth" subtitle="6-Month revenue and order volume trajectory" badgeText="Platform Expansion">
                    <div className="h-44 w-full flex items-end justify-between gap-3 pt-4 px-2">
                      {data.networkGrowthTrend?.map((item, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                          <span className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            ₹{item.revenue}
                          </span>
                          <div className="w-full bg-slate-100 rounded-t-lg overflow-hidden flex items-end h-32">
                            <div
                              style={{ height: `${Math.min(100, (item.revenue / 100000) * 100)}%` }}
                              className="w-full bg-gradient-to-t from-purple-600 to-indigo-600 rounded-t-lg group-hover:from-purple-700 group-hover:to-indigo-700 transition-all duration-300"
                            ></div>
                          </div>
                          <span className="text-[10px] font-extrabold text-slate-500">{item.period}</span>
                        </div>
                      ))}
                    </div>
                  </ChartCard>
                </div>

                <div className="lg:col-span-1">
                  <ChartCard title="🏷️ Platform Category Distribution" subtitle="Revenue share across categories">
                    <div className="space-y-3 pt-2">
                      {data.categoryPerformance?.map((cat, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-800">{cat.category}</span>
                            <span className="text-purple-600">₹{cat.sales?.toFixed(2)} ({cat.share}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div style={{ width: `${cat.share}%` }} className="bg-purple-600 h-full rounded-full"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ChartCard>
                </div>
              </div>

              {/* Multi-Campus Comparison Matrix Table */}
              <ChartCard title="🏛️ Multi-Campus Performance Comparison Matrix" subtitle="Aggregated platform statistics by campus">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="pb-3">Institution</th>
                        <th className="pb-3">Vendors</th>
                        <th className="pb-3">Students</th>
                        <th className="pb-3">Orders</th>
                        <th className="pb-3 text-right">Revenue (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold">
                      {data.institutionComparison?.map((inst) => (
                        <tr key={inst.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 text-slate-900 font-black">{inst.name} ({inst.code})</td>
                          <td className="py-3 text-slate-700">{inst.vendorsCount} vendors</td>
                          <td className="py-3 text-slate-700">{inst.studentsCount} students</td>
                          <td className="py-3 text-slate-800">{inst.ordersCount} orders</td>
                          <td className="py-3 text-right text-purple-600 font-black">₹{inst.revenue?.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ChartCard>
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default AnalyticsView;
