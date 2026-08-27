import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import vendorService from '../../services/vendorService';

export const VendorDashboard = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext() || {};

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchVendorDashboard = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const res = await vendorService.getDashboardStats();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error loading vendor dashboard:', err);
      const msg = err.response?.data?.message || 'Failed to load vendor dashboard.';
      setError(msg);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorDashboard();
  }, []);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setActionLoadingId(orderId);
    try {
      const res = await vendorService.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        toast.success(`Order #${orderId} set to ${newStatus.toUpperCase()}`);
        fetchVendorDashboard(true);
      }
    } catch (err) {
      toast.error('Failed to update order status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || 'placed';
    switch (s) {
      case 'ready':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded-lg border border-emerald-300 animate-pulse">● Ready for Pickup</span>;
      case 'preparing':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-extrabold text-[10px] rounded-lg border border-amber-300">⏳ Preparing</span>;
      case 'placed':
      case 'accepted':
        return <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 font-extrabold text-[10px] rounded-lg border border-indigo-300">🕒 Pending</span>;
      case 'completed':
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-extrabold text-[10px] rounded-lg border border-slate-200">✓ Completed</span>;
      case 'cancelled':
      case 'rejected':
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 font-extrabold text-[10px] rounded-lg border border-rose-300">✕ Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-lg">{status?.toUpperCase()}</span>;
    }
  };

  const maxSales = data?.analytics?.length ? Math.max(...data.analytics.map((a) => a.sales), 100) : 100;

  return (
    <div className="space-y-6">
      {loading ? (
        /* Loading Skeleton */
        <div className="space-y-6 animate-pulse">
          <div className="h-28 bg-white rounded-3xl border border-slate-200"></div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200"></div>
            ))}
          </div>
          <div className="h-64 bg-white rounded-3xl border border-slate-200"></div>
        </div>
      ) : error ? (
        /* Error Banner */
        <div className="bg-white p-8 rounded-3xl border border-rose-200 text-center space-y-4 max-w-md mx-auto my-8">
          <p className="text-xs font-bold text-rose-800">{error}</p>
          <button
            onClick={() => fetchVendorDashboard()}
            className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Retry Loading Dashboard
          </button>
        </div>
      ) : data && (
        <>
          {/* DASHBOARD GREETING BANNER */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl text-white p-6 sm:p-8 shadow-xl shadow-indigo-950/10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-2 relative z-10">
              <span className="text-[10px] font-extrabold text-amber-300 bg-amber-400/20 px-3 py-1 rounded-full border border-amber-300/30 uppercase tracking-wider">
                Stanford Campus Store
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Good morning, {data.vendor.name || 'Vendor Admin'} 👋
              </h2>
              <p className="text-xs text-indigo-200 font-medium">
                {data.vendor.shopName} • {data.vendor.location}
              </p>
            </div>

            <div className="flex items-center gap-2 relative z-10 self-start sm:self-center">
              <button
                onClick={() => navigate('/vendor/products')}
                className="px-4 py-2.5 bg-white text-indigo-900 font-extrabold text-xs rounded-2xl shadow-md transition-all active:scale-95 hover:bg-slate-50"
              >
                + Add Product
              </button>
              <button
                onClick={() => navigate('/vendor/orders')}
                className="px-4 py-2.5 bg-indigo-600/80 hover:bg-indigo-600 text-white border border-indigo-400/40 font-extrabold text-xs rounded-2xl transition-all"
              >
                View Orders Queue
              </button>
            </div>

            {/* Decorative background glow */}
            <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -z-0"></div>
          </div>

          {/* KPI METRICS CARDS GRID */}
          {(() => {
            const kpi = data.kpi || data.metrics || {};
            const todaySales = kpi.todaySalesAmount ?? kpi.todaySales ?? 0;
            return (
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
                <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1 hover:shadow-md transition-shadow">
                  <span className="text-xl sm:text-2xl">📦</span>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Today's Orders</span>
                  <p className="text-xl sm:text-2xl font-black text-slate-900">{kpi.todayOrdersCount ?? 0}</p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1 hover:shadow-md transition-shadow">
                  <span className="text-xl sm:text-2xl">💰</span>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Today's Revenue</span>
                  <p className="text-xl sm:text-2xl font-black text-indigo-600">₹{todaySales.toFixed(2)}</p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1 hover:shadow-md transition-shadow">
                  <span className="text-xl sm:text-2xl">⏳</span>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Pending Orders</span>
                  <p className="text-xl sm:text-2xl font-black text-amber-600">{kpi.pendingOrdersCount ?? 0}</p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1 hover:shadow-md transition-shadow">
                  <span className="text-xl sm:text-2xl">🛍️</span>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total Products</span>
                  <p className="text-xl sm:text-2xl font-black text-slate-900">{kpi.totalProductsCount ?? kpi.totalProducts ?? 0}</p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1 hover:shadow-md transition-shadow">
                  <span className="text-xl sm:text-2xl">⚡</span>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Low Stock (≤5)</span>
                  <p className="text-xl sm:text-2xl font-black text-amber-600">{kpi.lowStockCount ?? 0}</p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1 hover:shadow-md transition-shadow">
                  <span className="text-xl sm:text-2xl">🚫</span>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Out of Stock</span>
                  <p className="text-xl sm:text-2xl font-black text-rose-600">{kpi.outOfStockCount ?? 0}</p>
                </div>
              </div>
            );
          })()}

          {/* ORDERS OVERVIEW TABLE & SALES CHART GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Recent Orders Queue Table (2 Cols) */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>📋</span> Recent Orders Queue ({data.recentOrders?.length || 0})
                </h3>
                <button
                  onClick={() => navigate('/vendor/orders')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Manage All →
                </button>
              </div>

              {(() => {
                const recentOrders = data.recentOrders || data.orders || [];
                if (recentOrders.length === 0) {
                  return (
                    <div className="p-8 text-center text-xs text-slate-500 font-medium">
                      No recent orders placed for this vendor.
                    </div>
                  );
                }
                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="pb-3">Order ID</th>
                          <th className="pb-3">Customer</th>
                          <th className="pb-3">Items</th>
                          <th className="pb-3">Amount</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recentOrders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 font-extrabold text-indigo-600">#{ord.id}</td>
                            <td className="py-3.5 font-bold text-slate-900">{ord.studentName || ord.User?.name || 'Campus Student'}</td>
                            <td className="py-3.5 text-slate-600">{(ord.items || ord.OrderItems)?.length || 1} items</td>
                            <td className="py-3.5 font-black text-slate-900">₹{ord.totalAmount?.toFixed(2)}</td>
                            <td className="py-3.5">{getStatusBadge(ord.status)}</td>
                            <td className="py-3.5 text-right space-x-1">
                              {ord.status === 'placed' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(ord.id, 'preparing')}
                                  disabled={actionLoadingId === ord.id}
                                  className="px-2.5 py-1 bg-indigo-600 text-white font-bold text-[10px] rounded-lg shadow-2xs hover:bg-indigo-700"
                                >
                                  Accept Order
                                </button>
                              )}
                              {ord.status === 'preparing' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(ord.id, 'ready')}
                                  disabled={actionLoadingId === ord.id}
                                  className="px-2.5 py-1 bg-amber-500 text-white font-bold text-[10px] rounded-lg shadow-2xs hover:bg-amber-600"
                                >
                                  Mark Ready
                                </button>
                              )}
                              {ord.status === 'ready' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(ord.id, 'completed')}
                                  disabled={actionLoadingId === ord.id}
                                  className="px-2.5 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded-lg shadow-2xs hover:bg-emerald-700"
                                >
                                  Complete
                                </button>
                              )}
                              {ord.status === 'completed' && (
                                <span className="text-[10px] text-slate-400 font-semibold">Done ✓</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* 7-Day Analytics SVG Bar Chart */}
            <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>📈</span> 7-Day Revenue Analytics
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Revenue trends in Rupees (₹)</p>
              </div>

              <div className="h-44 w-full flex items-end justify-between gap-2 pt-4 px-2">
                {data.analytics?.map((item, idx) => {
                  const heightPercent = Math.max(15, Math.min(100, (item.sales / maxSales) * 100));

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                      <span className="text-[9px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        ₹{item.sales}
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

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Average Daily Orders:</span>
                <span className="font-extrabold text-slate-900">~6 Orders/day</span>
              </div>
            </div>

          </div>

          {/* BEST SELLERS & LOW STOCK ALERTS */}
          {(() => {
            const topProducts = data.topProducts || data.bestSellers || [];
            const lowStockProducts = data.lowStockProducts || [];
            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <span>🔥</span> Best-Selling Products
                  </h3>

                  <div className="divide-y divide-slate-100">
                    {topProducts.map((prod) => (
                      <div key={prod.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <img src={prod.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'} alt={prod.name} className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-200" />
                          <div>
                            <h4 className="font-extrabold text-slate-900">{prod.name}</h4>
                            <span className="text-[10px] text-slate-400 font-semibold">{prod.category}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-black text-slate-900 block">₹{(prod.revenue || 0).toFixed(2)}</span>
                          <span className="text-[10px] text-indigo-600 font-bold">{prod.unitsSold || prod.salesCount || 0} units sold</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <span>⚠️</span> Low Stock & Out of Stock Alerts ({lowStockProducts.length})
                  </h3>

                  {lowStockProducts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-emerald-700 bg-emerald-50 rounded-2xl border border-emerald-200 font-bold">
                      ✓ All inventory products are well stocked!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {lowStockProducts.map((p) => (
                        <div key={p.id} className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-200/80 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <h4 className="font-bold text-slate-900">{p.name}</h4>
                            <span className="text-[10px] text-rose-600 font-extrabold">Stock: {p.stock} remaining</span>
                          </div>

                          <button
                            onClick={() => navigate('/vendor/products')}
                            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors"
                          >
                            Restock Item
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            );
          })()}
        </>
      )}
    </div>
  );
};

export default VendorDashboard;
