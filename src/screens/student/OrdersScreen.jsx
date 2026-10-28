import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import StudentHeader from '../../components/layout/StudentHeader';
import { useAuth } from '../../context/AuthContext';
import studentService from '../../services/studentService';

export const OrdersScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Async & Filter states
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('All'); // 'All', 'Active', 'Completed', 'Cancelled'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);

  // Review Modal states
  const [reviewOrderTarget, setReviewOrderTarget] = useState(null);
  const [ratingInput, setRatingInput] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [commentInput, setCommentInput] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Cancellation Modal states
  const [cancelOrderTarget, setCancelOrderTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('Ordered by mistake');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // Complaint Modal states
  const [complaintOrderTarget, setComplaintOrderTarget] = useState(null);
  const [complaintReason, setComplaintReason] = useState('Wrong item');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentService.getOrders();
      if (res.success && res.data) {
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load order history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Status Tabs Definition
  const tabs = [
    { id: 'All', label: 'All Orders' },
    { id: 'Active', label: 'Active' },
    { id: 'Completed', label: 'Completed' },
    { id: 'Cancelled', label: 'Cancelled' },
  ];

  // Helper to categorize status
  const isOrderActive = (status) => ['placed', 'accepted', 'preparing', 'ready'].includes(status?.toLowerCase());
  const isOrderCompleted = (status) => status?.toLowerCase() === 'completed';
  const isOrderCancelled = (status) => ['cancelled', 'rejected'].includes(status?.toLowerCase());

  // Filter & Search Logic
  const filteredOrders = orders.filter((ord) => {
    const status = ord.status || 'placed';

    if (activeTab === 'Active' && !isOrderActive(status)) return false;
    if (activeTab === 'Completed' && !isOrderCompleted(status)) return false;
    if (activeTab === 'Cancelled' && !isOrderCancelled(status)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchId = ord.id?.toLowerCase().includes(q);
      const matchCode = ord.pickupCode?.toLowerCase().includes(q);
      const matchItems = ord.OrderItems?.some((item) => item.productName?.toLowerCase().includes(q));

      if (!matchId && !matchCode && !matchItems) return false;
    }

    return true;
  });

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || 'placed';
    switch (s) {
      case 'ready':
        return (
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded-lg border border-emerald-300 animate-pulse flex items-center gap-1">
            <span>●</span> Ready for Pickup
          </span>
        );
      case 'preparing':
        return (
          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-extrabold text-[10px] rounded-lg border border-amber-300">
            ⏳ Preparing Order
          </span>
        );
      case 'placed':
      case 'accepted':
        return (
          <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 font-extrabold text-[10px] rounded-lg border border-indigo-300">
            🕒 Order Placed
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-extrabold text-[10px] rounded-lg border border-slate-200">
            ✓ Picked Up
          </span>
        );
      case 'rejected':
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 bg-rose-100 text-rose-800 font-extrabold text-[10px] rounded-lg border border-rose-200">
            ✕ Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-lg">
            {status?.toUpperCase()}
          </span>
        );
    }
  };

  // Handle Rating Submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewOrderTarget || ratingInput < 1) {
      toast.error('Please select a star rating between 1 and 5.');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await studentService.submitReview({
        orderId: reviewOrderTarget.id,
        rating: ratingInput,
        comment: commentInput.trim(),
      });

      if (res.success) {
        toast.success('Thank you for rating your campus order experience!', { icon: '⭐' });
        
        setOrders((prev) =>
          prev.map((o) =>
            o.id === reviewOrderTarget.id
              ? { ...o, isReviewed: true, userRating: ratingInput }
              : o
          )
        );

        setReviewOrderTarget(null);
        setRatingInput(0);
        setCommentInput('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Handle Complaint Submission
  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!complaintOrderTarget || !complaintDescription.trim()) {
      toast.error('Please provide a detailed description of your issue.');
      return;
    }

    setSubmittingComplaint(true);
    try {
      const res = await studentService.submitComplaint({
        orderId: complaintOrderTarget.id,
        reason: complaintReason,
        description: complaintDescription.trim(),
      });

      if (res.success) {
        toast.success('Dispute complaint ticket created successfully. Campus admin will mediate.', { icon: '🛡️' });
        setComplaintOrderTarget(null);
        setComplaintDescription('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit complaint.');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  // Handle Order Cancellation with Fee Deduction & Refund
  const handleCancelOrder = async (e) => {
    e.preventDefault();
    if (!cancelOrderTarget) return;

    setSubmittingCancel(true);
    try {
      const res = await studentService.cancelOrder(cancelOrderTarget.id, cancelReason);

      if (res.success && res.data) {
        toast.success(res.message || 'Order cancelled and refund issued!', { icon: '💸', duration: 5000 });
        
        // Update order locally with refunded metadata
        setOrders((prev) =>
          prev.map((o) =>
            o.id === cancelOrderTarget.id
              ? {
                  ...o,
                  status: 'cancelled',
                  paymentStatus: 'refunded',
                  refundStatus: res.data.refundStatus || 'partial',
                  refundAmount: res.data.refundAmount,
                  cancellationFee: res.data.cancellationFee,
                  refundTxnId: res.data.refundTxnId,
                  cancelledBy: 'student',
                  cancelReason: cancelReason,
                }
              : o
          )
        );

        setCancelOrderTarget(null);
        setCancelReason('Ordered by mistake');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setSubmittingCancel(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 antialiased pb-16 sm:pb-12">
      <StudentHeader />

      <main className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Campus Order History</h1>
            <p className="text-xs text-slate-500 font-medium">Track live orders and view past receipts</p>
          </div>

          <Link
            to="/student/dashboard"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all self-start sm:self-center"
          >
            + New Campus Purchase
          </Link>
        </div>

        {/* Search & Status Tabs Bar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders by ID, passcode, or product..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl text-xs font-medium focus:outline-none"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all border ${
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

        {/* Loading Skeletons */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="h-5 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-5 bg-slate-200 rounded w-1/6"></div>
                </div>
                <div className="h-12 bg-slate-100 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="bg-rose-50 border border-rose-200 p-6 rounded-3xl text-center space-y-3 max-w-md mx-auto my-8">
            <p className="text-xs font-bold text-rose-800">{error}</p>
            <button
              onClick={fetchOrders}
              className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Retry Loading Orders
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          /* EMPTY STATE */
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs text-center space-y-4 max-w-md mx-auto my-8">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-500 text-3xl shadow-inner">
              🛍️
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-slate-900">No orders found</h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Your campus purchases will appear here.
              </p>
            </div>
            <Link
              to="/student/dashboard"
              className="inline-flex items-center gap-1.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all"
            >
              <span>Explore Campus Shops</span>
              <span>→</span>
            </Link>
          </div>
        ) : (
          /* ORDERS LIST */
          <div className="space-y-4">
            {filteredOrders.map((ord) => {
              const totalItemQty = ord.OrderItems?.reduce((acc, item) => acc + item.quantity, 0) || 1;

              return (
                <div
                  key={ord.id}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4 hover:shadow-md transition-shadow"
                >
                  {/* Card Top Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-slate-900">
                          Order #{ord.id}
                        </span>
                        {getStatusBadge(ord.status)}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Placed on {new Date(ord.createdAt).toLocaleString()} • {ord.paymentMethod || 'Campus Card Wallet'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-center">
                      {ord.pickupCode && (
                        <div className="bg-slate-900 text-amber-300 px-3 py-1.5 rounded-xl font-mono text-center shrink-0">
                          <span className="text-[9px] text-slate-400 block font-sans">Passcode</span>
                          <span className="text-xs font-bold">{ord.pickupCode}</span>
                        </div>
                      )}
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold">Total Bill</span>
                        <span className="text-base font-extrabold text-indigo-600">₹{ord.totalAmount?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Item List Preview */}
                  {ord.OrderItems && ord.OrderItems.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>Items ({totalItemQty})</span>
                        <span>{ord.vendorCount || 1} Campus {ord.vendorCount === 1 ? 'Shop' : 'Shops'}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ord.OrderItems.map((item) => (
                          <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs flex items-center justify-between">
                            <span className="font-semibold text-slate-800 truncate">{item.productName} × {item.quantity}</span>
                            <span className="font-bold text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Delivery Address Summary */}
                  {ord.deliveryAddress && (
                    <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 text-xs text-indigo-950 flex items-center justify-between">
                      <div>
                        <strong>📍 Campus Address:</strong>{' '}
                        {Object.values(ord.deliveryAddress).filter(Boolean).join(' • ')}
                      </div>
                    </div>
                  )}

                  {/* REFUND STATUS DETAILS BANNER (For Cancelled / Refunded Orders) */}
                  {['cancelled', 'rejected'].includes(ord.status?.toLowerCase()) && (
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-2xl border border-emerald-200 text-xs space-y-1.5 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-black text-emerald-900">
                          <span>💸</span>
                          <span>
                            {ord.refundStatus === 'full' || ord.cancelledBy === 'vendor'
                              ? `100% Full Refund Issued: ₹${(ord.refundAmount || ord.totalAmount).toFixed(2)}`
                              : `Refund Processed: ₹${(ord.refundAmount || Math.max(0, ord.totalAmount - 15)).toFixed(2)}`}
                          </span>
                        </div>
                        <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-full uppercase">
                          {ord.refundStatus === 'full' || ord.cancelledBy === 'vendor' ? 'Full Refund' : 'Net Refund'}
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-800 space-y-0.5">
                        {ord.cancelledBy === 'student' && (
                          <p>• Campus convenience & cancellation charge: <strong>₹{ord.cancellationFee?.toFixed(2) || '15.00'}</strong></p>
                        )}
                        <p>• Refund Destination: <strong>Original Payment Source ({ord.paymentMethod || 'UPI / Card'})</strong></p>
                        {ord.cancelReason && (
                          <p>• Reason: <em>"{ord.cancelReason}"</em></p>
                        )}
                        {ord.refundTxnId && (
                          <p className="font-mono text-[10px] text-emerald-700">Refund Ref: {ord.refundTxnId}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons Toolbar */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedReceiptOrder(ord)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-colors"
                      >
                        📄 View Details
                      </button>

                      {/* Cancel Order Action (Available before vendor starts preparing) */}
                      {['placed', 'accepted'].includes(ord.status?.toLowerCase()) && (
                        <button
                          onClick={() => setCancelOrderTarget(ord)}
                          className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs rounded-xl border border-rose-200 transition-colors flex items-center gap-1"
                        >
                          <span>✕</span>
                          <span>Cancel Order</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setComplaintOrderTarget(ord);
                          setComplaintReason('Wrong item');
                          setComplaintDescription('');
                        }}
                        className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-xl border border-slate-200 transition-colors"
                      >
                        ⚠️ Report Issue
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Review Action for Completed Orders */}
                      {ord.status?.toLowerCase() === 'completed' && (
                        ord.isReviewed ? (
                          <span className="px-3.5 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold text-xs rounded-xl flex items-center gap-1">
                            <span>✓</span> Reviewed ★{ord.userRating || 5}
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setReviewOrderTarget(ord);
                              setRatingInput(5);
                              setCommentInput('');
                            }}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1"
                          >
                            <span>★</span> Rate Experience
                          </button>
                        )
                      )}

                      <button
                        onClick={() => navigate(`/student/orders/${ord.id}`)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1"
                      >
                        <span>Track Pickup</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* RAISE COMPLAINT MODAL */}
      {complaintOrderTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-fade-in border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Report an Order Issue</h3>
                <p className="text-[11px] text-slate-500 font-medium">Order #{complaintOrderTarget.id}</p>
              </div>
              <button
                onClick={() => setComplaintOrderTarget(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitComplaint} className="space-y-4">
              
              {/* Complaint Reason Selector Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Issue Reason <span className="text-rose-500">*</span>
                </label>
                <select
                  value={complaintReason}
                  onChange={(e) => setComplaintReason(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-500 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value="Wrong item">Wrong item delivered / picked up</option>
                  <option value="Missing item">Missing item in order package</option>
                  <option value="Damaged item">Damaged or poor quality item</option>
                  <option value="Late pickup">Excessive preparation delay</option>
                  <option value="Payment issue">Campus Card / Billing error</option>
                  <option value="Other">Other vendor issue</option>
                </select>
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Detailed Explanation <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows="4"
                  required
                  value={complaintDescription}
                  onChange={(e) => setComplaintDescription(e.target.value)}
                  placeholder="Please describe what went wrong so campus admins can inspect and mediate..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-500 rounded-2xl text-xs font-medium focus:outline-none"
                ></textarea>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submittingComplaint || !complaintDescription.trim()}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submittingComplaint ? 'Submitting Dispute...' : 'Submit Complaint Ticket ⚠️'}
                </button>
                <button
                  type="button"
                  onClick={() => setComplaintOrderTarget(null)}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 5-STAR RATING & REVIEW MODAL */}
      {reviewOrderTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-fade-in border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Rate Your Experience</h3>
                <p className="text-[11px] text-slate-500 font-medium">Order #{reviewOrderTarget.id}</p>
              </div>
              <button
                onClick={() => setReviewOrderTarget(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              
              {/* Star Rating Interactive Selector */}
              <div className="text-center space-y-2 py-2">
                <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">
                  Select Rating Score
                </span>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= (hoverRating || ratingInput);
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingInput(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 focus:outline-none transition-transform hover:scale-125 active:scale-95"
                      >
                        <span className={`text-3xl ${isFilled ? 'text-amber-400' : 'text-slate-200'}`}>
                          ★
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs font-extrabold text-slate-700">
                  {ratingInput === 5
                    ? ' Excellent (5/5)'
                    : ratingInput === 4
                    ? ' Very Good (4/5)'
                    : ratingInput === 3
                    ? ' Average (3/5)'
                    : ratingInput === 2
                    ? ' Fair (2/5)'
                    : ratingInput === 1
                    ? ' Poor (1/5)'
                    : 'Click stars to select rating'}
                </p>
              </div>

              {/* Comment Textarea */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Tell us about your experience (Optional)
                </label>
                <textarea
                  rows="3"
                  maxLength={500}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="e.g. Super fast pickup! Fresh food and nice packaging..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-2xl text-xs font-medium focus:outline-none"
                ></textarea>
                <span className="text-[10px] text-slate-400 font-medium block text-right">
                  {commentInput.length} / 500
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submittingReview || ratingInput < 1}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submittingReview ? 'Submitting Review...' : 'Submit Review ★'}
                </button>
                <button
                  type="button"
                  onClick={() => setReviewOrderTarget(null)}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* RECEIPT DETAILS MODAL */}
      {selectedReceiptOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-fade-in border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Order Receipt #{selectedReceiptOrder.id}</h3>
                <p className="text-[11px] text-slate-400">{new Date(selectedReceiptOrder.createdAt).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedReceiptOrder(null)} className="text-slate-400 hover:text-slate-600 font-bold text-base">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <p className="font-extrabold text-slate-900">Items Purchased</p>
                {selectedReceiptOrder.OrderItems?.map((item) => (
                  <div key={item.id} className="flex justify-between font-medium text-slate-800">
                    <span>{item.productName} × {item.quantity}</span>
                    <span className="font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-1 text-indigo-950">
                <p className="font-extrabold">Payment & Pickup</p>
                <p>Payment Method: {selectedReceiptOrder.paymentMethod}</p>
                <p>Passcode: <span className="font-mono font-bold text-indigo-700">{selectedReceiptOrder.pickupCode}</span></p>
                <p>Campus Service Fee: ₹{selectedReceiptOrder.serviceFee?.toFixed(2) || '15.00'}</p>
                <p className="font-black text-sm text-slate-900 pt-1 border-t border-indigo-200">
                  Total Bill: ₹{selectedReceiptOrder.totalAmount?.toFixed(2)}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedReceiptOrder(null)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}

      {/* CANCEL ORDER CONFIRMATION & REFUND MODAL */}
      {cancelOrderTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-fade-in border border-slate-100 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-black text-sm">
                  ✕
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Cancel Campus Order</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Order #{cancelOrderTarget.id}</p>
                </div>
              </div>
              <button
                onClick={() => setCancelOrderTarget(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base"
              >
                ✕
              </button>
            </div>

            {/* Cancellation Fee & Refund Calculation Breakdown */}
            <div className="bg-gradient-to-br from-slate-50 to-indigo-50/40 p-4 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Campus Refund Calculation Policy
              </span>

              <div className="flex justify-between text-slate-600">
                <span>Original Total Paid:</span>
                <span className="font-bold text-slate-900">₹{cancelOrderTarget.totalAmount?.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-rose-600 font-semibold">
                <span>Campus Cancellation / Convenience Charge:</span>
                <span>- ₹15.00</span>
              </div>

              <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-black text-emerald-700">
                <span>Net Refund to Payment Source:</span>
                <span className="text-base">
                  ₹{Math.max(0, cancelOrderTarget.totalAmount - 15).toFixed(2)}
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
                  {submittingCancel ? 'Cancelling & Refunding...' : `Confirm & Claim ₹${Math.max(0, cancelOrderTarget.totalAmount - 15).toFixed(2)} Refund 💸`}
                </button>
                <button
                  type="button"
                  onClick={() => setCancelOrderTarget(null)}
                  className="py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Keep Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrdersScreen;
