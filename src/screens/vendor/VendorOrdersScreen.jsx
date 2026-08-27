import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import vendorService from '../../services/vendorService';

export const VendorOrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('New');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [rejectModalOrder, setRejectModalOrder] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('Item Out of Stock');

  const fetchOrdersQueue = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const res = await vendorService.getVendorOrders();
      if (res.success && res.data) {
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching vendor orders:', err);
      setError('Failed to load vendor order queue.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersQueue();
    const pollInterval = setInterval(() => {
      fetchOrdersQueue(true);
    }, 10000);
    return () => clearInterval(pollInterval);
  }, []);

  const queueTabs = [
    { id: 'New', label: 'New / Pending' },
    { id: 'Accepted', label: 'Accepted' },
    { id: 'Preparing', label: 'Preparing' },
    { id: 'Ready', label: 'Ready for Pickup' },
    { id: 'Completed', label: 'Completed' },
    { id: 'Rejected', label: 'Rejected / Cancelled' },
  ];

  const isNew = (s) => s?.toLowerCase() === 'placed';
  const isAccepted = (s) => s?.toLowerCase() === 'accepted';
  const isPreparing = (s) => s?.toLowerCase() === 'preparing';
  const isReady = (s) => s?.toLowerCase() === 'ready';
  const isCompleted = (s) => s?.toLowerCase() === 'completed';
  const isRejected = (s) => ['rejected', 'cancelled'].includes(s?.toLowerCase());

  const filteredOrders = orders.filter((ord) => {
    const s = ord.status || 'placed';
    if (activeTab === 'New' && !isNew(s)) return false;
    if (activeTab === 'Accepted' && !isAccepted(s)) return false;
    if (activeTab === 'Preparing' && !isPreparing(s)) return false;
    if (activeTab === 'Ready' && !isReady(s)) return false;
    if (activeTab === 'Completed' && !isCompleted(s)) return false;
    if (activeTab === 'Rejected' && !isRejected(s)) return false;
    return true;
  });

  const handleUpdateStatus = async (orderId, newStatus, reason = undefined) => {
    setActionLoadingId(orderId);
    try {
      const res = await vendorService.updateOrderStatus(orderId, newStatus, reason);
      if (res.success) {
        toast.success(`Order #${orderId} set to ${newStatus.toUpperCase()}`, {
          icon: newStatus === 'rejected' ? '🔴' : '🟢',
        });
        fetchOrdersQueue(true);
        setRejectModalOrder(null);
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
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-xl border border-emerald-300 animate-pulse">● Ready for Pickup</span>;
      case 'preparing':
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 font-extrabold text-xs rounded-xl border border-amber-300">⏳ Preparing</span>;
      case 'accepted':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 font-extrabold text-xs rounded-xl border border-blue-300">✓ Accepted</span>;
      case 'placed':
        return <span className="px-3 py-1 bg-indigo-100 text-indigo-800 font-extrabold text-xs rounded-xl border border-indigo-300">🔔 New Order</span>;
      case 'completed':
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-200">✓ Completed</span>;
      case 'rejected':
      case 'cancelled':
        return <span className="px-3 py-1 bg-rose-100 text-rose-800 font-extrabold text-xs rounded-xl border border-rose-300">✕ Rejected</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl">{status?.toUpperCase()}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* QUEUE STATUS TABS BAR */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-xl font-extrabold text-slate-900">Orders Queue & Fulfillment</h2>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            ● 10s Auto-Sync
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {queueTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const count = orders.filter((o) => {
              const s = o.status || 'placed';
              if (tab.id === 'New') return isNew(s);
              if (tab.id === 'Accepted') return isAccepted(s);
              if (tab.id === 'Preparing') return isPreparing(s);
              if (tab.id === 'Ready') return isReady(s);
              if (tab.id === 'Completed') return isCompleted(s);
              if (tab.id === 'Rejected') return isRejected(s);
              return false;
            }).length;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all border flex items-center gap-2 ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200/80'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ORDERS LIST */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4 animate-pulse">
              <div className="h-6 bg-slate-200 rounded w-1/3"></div>
              <div className="h-16 bg-slate-100 rounded-2xl"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-3xl text-center space-y-3 max-w-md mx-auto my-8">
          <p className="text-xs font-bold text-rose-800">{error}</p>
          <button
            onClick={fetchOrdersQueue}
            className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Retry Loading Queue
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs text-center space-y-4 max-w-md mx-auto my-8">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-500 text-3xl shadow-inner">
            📋
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900">No orders in "{activeTab}" tab</h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              New incoming student orders placed for your shop will appear here automatically.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6 hover:shadow-md transition-shadow"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-extrabold text-slate-900">Order #{ord.id}</span>
                    {getStatusBadge(ord.status)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Placed on {new Date(ord.createdAt).toLocaleString()} • {ord.paymentMethod || 'Campus Wallet'}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {ord.pickupCode && (
                    <div className="bg-slate-900 text-amber-300 px-4 py-2 rounded-2xl text-center font-mono shrink-0 shadow-xs">
                      <span className="text-[9px] text-slate-400 block font-sans">Passcode</span>
                      <span className="text-sm font-bold">{ord.pickupCode}</span>
                    </div>
                  )}
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-semibold block">Vendor Subtotal</span>
                    <span className="text-xl font-black text-indigo-600">
                      ₹{(ord.vendorSubtotal || ord.totalAmount)?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Reference */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Customer Reference</span>
                  <p className="font-extrabold text-slate-900">{ord.User?.name || 'Alex Student'}</p>
                  <p className="text-[11px] text-slate-500">{ord.User?.email}</p>
                </div>

                {ord.deliveryAddress && (
                  <div className="sm:text-right text-slate-600">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Campus Delivery / Pickup Location</span>
                    <p className="font-semibold text-slate-800">
                      {Object.values(ord.deliveryAddress).filter(Boolean).join(' • ')}
                    </p>
                  </div>
                )}
              </div>

              {/* ISOLATED VENDOR ITEMS LIST */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Your Shop Products ({ord.OrderItems?.length || 0})
                </h4>

                <div className="divide-y divide-slate-100 bg-slate-50/50 rounded-2xl border border-slate-200/60 p-4">
                  {ord.OrderItems?.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                      <div>
                        <p className="font-extrabold text-slate-900">{item.productName}</p>
                        <p className="text-[11px] text-slate-500">Qty: {item.quantity} × ₹{item.price?.toFixed(2)}</p>
                      </div>
                      <span className="font-black text-slate-900">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ACTION CONTROLS */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3">
                {isNew(ord.status) && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(ord.id, 'accepted')}
                      disabled={actionLoadingId === ord.id}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <span>✓ Accept Order</span>
                    </button>
                    <button
                      onClick={() => setRejectModalOrder(ord)}
                      disabled={actionLoadingId === ord.id}
                      className="px-5 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs rounded-2xl border border-rose-200 transition-all active:scale-95"
                    >
                      ✕ Reject Order
                    </button>
                  </>
                )}

                {isAccepted(ord.status) && (
                  <button
                    onClick={() => handleUpdateStatus(ord.id, 'preparing')}
                    disabled={actionLoadingId === ord.id}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <span>⏳ Start Preparing Order</span>
                  </button>
                )}

                {isPreparing(ord.status) && (
                  <button
                    onClick={() => handleUpdateStatus(ord.id, 'ready')}
                    disabled={actionLoadingId === ord.id}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <span>🔔 Mark Ready for Pickup</span>
                  </button>
                )}

                {isReady(ord.status) && (
                  <button
                    onClick={() => handleUpdateStatus(ord.id, 'completed')}
                    disabled={actionLoadingId === ord.id}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <span>✓ Mark Picked Up / Completed</span>
                  </button>
                )}

                {isCompleted(ord.status) && (
                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
                    Order Processed & Picked Up ✓
                  </span>
                )}

                {isRejected(ord.status) && (
                  <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-4 py-2 rounded-xl border border-rose-200">
                    Order Rejected ✕
                  </span>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-fade-in border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Reject Order #{rejectModalOrder.id}?
              </h3>
              <button onClick={() => setRejectModalOrder(null)} className="text-slate-400 hover:text-slate-600 font-bold text-base">✕</button>
            </div>

            <p className="text-xs text-slate-500">
              Please specify a rejection reason for the student:
            </p>

            <div className="space-y-2 text-xs">
              {['Item Out of Stock', 'Shop Closing Soon', 'Counter Overloaded', 'Custom Reason'].map((reason) => (
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
                onClick={() => handleUpdateStatus(rejectModalOrder.id, 'rejected', rejectionReason)}
                disabled={actionLoadingId === rejectModalOrder.id}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => setRejectModalOrder(null)}
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

export default VendorOrdersScreen;
