import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import StudentHeader from '../../components/layout/StudentHeader';
import { useAuth } from '../../context/AuthContext';
import studentService from '../../services/studentService';

export const OrderTrackingScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [vendorFulfillments, setVendorFulfillments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Ordered by mistake');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const lifecycleSteps = [
    { key: 'placed', title: 'Order Placed', desc: 'Sent to campus shops' },
    { key: 'accepted', title: 'Vendor Accepted', desc: 'Shop confirmed order' },
    { key: 'preparing', title: 'Preparing & Packing', desc: 'Item being made/packed' },
    { key: 'ready', title: 'Ready for Pickup', desc: 'Passcode ready at counter' },
    { key: 'completed', title: 'Completed', desc: 'Picked up by student' },
  ];

  const fetchOrderTracking = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const res = await studentService.getOrderDetails(id);
      if (res.success && res.data) {
        setOrder(res.data.order);
        setVendorFulfillments(res.data.vendorFulfillments || []);
      }
    } catch (err) {
      console.error('Order tracking fetch error:', err);
      const msg = err.response?.data?.message || 'Failed to load order tracking.';
      setError(msg);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderTracking();

    const pollInterval = setInterval(() => {
      fetchOrderTracking(true);
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [id]);

  const getStepIndex = (statusKey) => {
    switch (statusKey) {
      case 'placed':
        return 0;
      case 'accepted':
        return 1;
      case 'preparing':
        return 2;
      case 'ready':
        return 3;
      case 'completed':
        return 4;
      default:
        return 0;
    }
  };

  const handleCancelOrder = async (e) => {
    e.preventDefault();
    if (!order) return;

    setSubmittingCancel(true);
    try {
      const res = await studentService.cancelOrder(order.id, cancelReason);
      if (res.success && res.data) {
        toast.success(res.message || 'Order cancelled and refund issued!', { icon: '💸', duration: 5000 });
        setOrder((prev) => ({
          ...prev,
          status: 'cancelled',
          paymentStatus: 'refunded',
          refundStatus: res.data.refundStatus || 'partial',
          refundAmount: res.data.refundAmount,
          cancellationFee: res.data.cancellationFee,
          refundTxnId: res.data.refundTxnId,
          cancelledBy: 'student',
          cancelReason,
        }));
        setCancelOpen(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setSubmittingCancel(false);
    }
  };

  const currentStepIdx = order ? getStepIndex(order.status) : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased pb-16 sm:pb-8">
      <StudentHeader
        institutionName="Stanford University"
        searchQuery=""
        setSearchQuery={() => {}}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        
        <div className="flex items-center justify-between">
          <Link
            to="/student/orders"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <span>←</span> Back to Order History
          </Link>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            ● Live Status Polling Active
          </span>
        </div>

        {error ? (
          <div className="bg-white p-8 rounded-3xl border border-rose-200 shadow-sm text-center space-y-4 max-w-lg mx-auto my-12">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500 text-3xl">
              🚫
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Order Access Denied</h2>
            <p className="text-xs text-slate-600 leading-relaxed">{error}</p>
            <button
              onClick={() => navigate('/student/orders')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
            >
              Return to Order History
            </button>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 space-y-6 animate-pulse">
            <div className="h-20 bg-slate-200 rounded-2xl w-full"></div>
            <div className="h-12 bg-slate-200 rounded-xl w-3/4"></div>
            <div className="h-40 bg-slate-200 rounded-2xl"></div>
          </div>
        ) : order && (
          <>
            {/* Top Order Overview Header Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-extrabold text-xs rounded-lg">
                      Order ID: #{order.id}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                      Status: {order.status?.toUpperCase()}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
                    Campus Order Tracker
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Placed on {new Date(order.createdAt).toLocaleString()} • {order.paymentMethod || 'Campus Card Wallet'}
                  </p>
                </div>

                <div className="text-left sm:text-right bg-slate-50 p-4 rounded-2xl border border-slate-200/80 shrink-0">
                  <span className="text-[10px] text-slate-400 font-semibold block">Total Paid</span>
                  <span className="text-2xl font-extrabold text-slate-900">₹{order.totalAmount?.toFixed(2)}</span>
                  <span className="text-[11px] text-indigo-600 font-bold block mt-0.5">
                    {order.vendorCount || 1} Campus {order.vendorCount === 1 ? 'Shop' : 'Shops'}
                  </span>
                </div>
              </div>

              {/* Delivery Address Banner */}
              {order.deliveryAddress && (
                <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 space-y-1 text-xs text-indigo-950">
                  <span className="font-extrabold text-indigo-900 block">📍 Campus Delivery / Pickup Address:</span>
                  <p className="font-medium text-slate-800">
                    {Object.values(order.deliveryAddress).filter(Boolean).join(' • ')}
                  </p>
                </div>
              )}

              {/* Visual Order Lifecycle Status Timeline */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Fulfillment Timeline Progress
                </h3>

                <div className="hidden sm:grid grid-cols-5 gap-2 relative pt-2">
                  {lifecycleSteps.map((step, idx) => {
                    const isPassed = idx < currentStepIdx;
                    const isCurrent = idx === currentStepIdx;

                    return (
                      <div key={step.key} className="flex flex-col items-center text-center space-y-2 relative z-10">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                            isPassed
                              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                              : isCurrent
                              ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-md shadow-indigo-600/30 scale-110 animate-pulse'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                        >
                          {isPassed ? '✓' : idx + 1}
                        </div>

                        <div>
                          <p className={`text-xs font-extrabold ${isCurrent ? 'text-indigo-600' : isPassed ? 'text-slate-900' : 'text-slate-400'}`}>
                            {step.title}
                          </p>
                          <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="sm:hidden space-y-4 pl-2">
                  {lifecycleSteps.map((step, idx) => {
                    const isPassed = idx < currentStepIdx;
                    const isCurrent = idx === currentStepIdx;

                    return (
                      <div key={step.key} className="flex items-start gap-3">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isPassed
                              ? 'bg-emerald-500 text-white'
                              : isCurrent
                              ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 animate-pulse'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                        >
                          {isPassed ? '✓' : idx + 1}
                        </div>
                        <div>
                          <p className={`text-xs font-bold ${isCurrent ? 'text-indigo-600' : isPassed ? 'text-slate-900' : 'text-slate-400'}`}>
                            {step.title}
                          </p>
                          <p className="text-[11px] text-slate-500">{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pickup Passcode & QR Code Card */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
              <div className="sm:col-span-2 space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-extrabold border border-amber-400/30">
                  <span>🔑</span> Express Campus Pickup Passcode
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold font-mono tracking-wider text-amber-300">
                  {order.pickupCode || 'SD-9241'}
                </h2>
                <p className="text-xs text-indigo-200 leading-relaxed">
                  Present this passcode or scan the QR code at your campus shop counter to claim your order.
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-inner flex flex-col items-center justify-center text-center space-y-2 shrink-0">
                <svg className="w-24 h-24 text-slate-900" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h6v6H3V3zm12 0h6v6h-6V3zM3 15h6v6H3v-6zm12 12h3v-3h-3v3zm-3-3h3v-3h-3v3zm6 0h3v-3h-3v3zm0-6h3v-3h-3v3zm-6 0h3v-3h-3v3zm3-3h3V9h-3v3zm-3 0h3V9h-3v3z" />
                </svg>
                <span className="text-[10px] font-mono font-bold text-slate-600">Scan at Shop Counter</span>
              </div>
            </div>

            {/* Multi-Vendor Sectional Fulfillment Status Cards */}
            <div className="space-y-4">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Shop Fulfillment Breakdown
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vendorFulfillments.map((vf) => (
                  <div key={vf.vendorId} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-xs">
                          🏪
                        </span>
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900">{vf.vendorName}</h3>
                          <span className="text-[10px] text-slate-400 font-semibold">{vf.category}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-800 font-extrabold text-[10px] rounded-lg border border-amber-200">
                        {vf.status?.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                      <p><strong>📍 Pickup Location:</strong> {vf.location}</p>
                      <p><strong>⏱️ Est. Pickup Time:</strong> {vf.pickupTime}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* REFUND STATUS BANNER (If Order is Cancelled or Rejected) */}
            {['cancelled', 'rejected'].includes(order.status?.toLowerCase()) && (
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/50 p-6 rounded-3xl border border-emerald-200 text-xs space-y-2 animate-fade-in shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-950 font-black text-sm">
                    <span className="text-lg">💸</span>
                    <span>
                      {order.refundStatus === 'full' || order.cancelledBy === 'vendor'
                        ? `100% Full Refund Issued: ₹${(order.refundAmount || order.totalAmount).toFixed(2)}`
                        : `Refund Processed: ₹${(order.refundAmount || Math.max(0, order.totalAmount - 15)).toFixed(2)}`}
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                    {order.refundStatus === 'full' || order.cancelledBy === 'vendor' ? 'Full Refund' : 'Net Refund'}
                  </span>
                </div>
                <div className="text-xs text-emerald-800 space-y-1">
                  {order.cancelledBy === 'student' && (
                    <p>• Campus convenience / cancellation charge applied: <strong>₹{order.cancellationFee?.toFixed(2) || '15.00'}</strong></p>
                  )}
                  <p>• Refund Destination: <strong>Original Payment Source ({order.paymentMethod || 'UPI / Card'})</strong></p>
                  {order.cancelReason && (
                    <p>• Reason: <em>"{order.cancelReason}"</em></p>
                  )}
                  {order.refundTxnId && (
                    <p className="font-mono text-[11px] text-emerald-700">Refund Reference ID: {order.refundTxnId}</p>
                  )}
                </div>
              </div>
            )}

            {/* Interactive Actions Toolbar */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setReceiptOpen(true)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-colors shadow-2xs"
                >
                  📄 View Receipt
                </button>

                {/* Cancel Order CTA (Available before preparation starts) */}
                {['placed', 'accepted'].includes(order.status?.toLowerCase()) && (
                  <button
                    onClick={() => setCancelOpen(true)}
                    className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5"
                  >
                    <span>✕</span>
                    <span>Cancel Order</span>
                  </button>
                )}

                <button
                  onClick={() => toast('Connecting to campus vendor support Desk...', { icon: '💬' })}
                  className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl transition-colors"
                >
                  💬 Contact Vendor Support
                </button>
              </div>

              {order.status === 'completed' && (
                <button
                  onClick={() => toast('Thank you for rating this campus shop!', { icon: '⭐' })}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors"
                >
                  ⭐ Rate Vendor
                </button>
              )}
            </div>

            {/* Cancel Order Modal */}
            {cancelOpen && (
              <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-fade-in border border-slate-100 text-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-black text-sm">
                        ✕
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">Cancel Campus Order</h3>
                        <p className="text-[11px] text-slate-500 font-medium">Order #{order.id}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setCancelOpen(false)}
                      className="text-slate-400 hover:text-slate-600 font-bold text-base"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Refund Breakdown */}
                  <div className="bg-gradient-to-br from-slate-50 to-indigo-50/40 p-4 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      Campus Refund Calculation Policy
                    </span>

                    <div className="flex justify-between text-slate-600">
                      <span>Original Total Paid:</span>
                      <span className="font-bold text-slate-900">₹{order.totalAmount?.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-rose-600 font-semibold">
                      <span>Campus Cancellation Charge:</span>
                      <span>- ₹15.00</span>
                    </div>

                    <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-black text-emerald-700">
                      <span>Net Refund to Source:</span>
                      <span className="text-base">
                        ₹{Math.max(0, order.totalAmount - 15).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleCancelOrder} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Cancellation Reason <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-500 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none"
                      >
                        <option value="Ordered by mistake">Ordered by mistake</option>
                        <option value="Change of mind">Change of mind / No longer needed</option>
                        <option value="Wrong campus building/room">Entered wrong campus address details</option>
                        <option value="Class schedule conflict">Lecture / Class schedule conflict</option>
                        <option value="Duplicate order">Placed duplicate campus order</option>
                        <option value="Other">Other reason</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={submittingCancel}
                        className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {submittingCancel ? 'Cancelling & Refunding...' : `Confirm & Claim ₹${Math.max(0, order.totalAmount - 15).toFixed(2)} Refund 💸`}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancelOpen(false)}
                        className="py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                      >
                        Keep Order
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Receipt Breakdown Modal */}
            {receiptOpen && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-fade-in border border-slate-100">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-base font-extrabold text-slate-900">Itemized Receipt</h3>
                    <button onClick={() => setReceiptOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-base">✕</button>
                  </div>

                  <div className="space-y-2 text-xs divide-y divide-slate-100 max-h-60 overflow-y-auto">
                    {order.OrderItems?.map((item) => (
                      <div key={item.id} className="pt-2 flex items-center justify-between text-slate-700">
                        <span>{item.productName} × {item.quantity}</span>
                        <span className="font-bold text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs font-semibold">
                    <div className="flex justify-between text-slate-600">
                      <span>Service & Pickup Fee</span>
                      <span>₹{(order.serviceFee || 15.0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1">
                      <span>Total Paid</span>
                      <span className="text-indigo-600">₹{order.totalAmount?.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setReceiptOpen(false)}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl"
                  >
                    Close Receipt
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default OrderTrackingScreen;
