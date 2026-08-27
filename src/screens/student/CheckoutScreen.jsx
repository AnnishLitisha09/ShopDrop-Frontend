import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import StudentHeader from '../../components/layout/StudentHeader';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import studentService from '../../services/studentService';

export const CheckoutScreen = () => {
  const navigate = useNavigate();
  const { user, updateSavedAddress } = useAuth();
  const {
    cartItems,
    groupedCartList,
    clearCart,
    cartTotalCount,
    cartSubtotal,
    serviceFee,
    cartTotalPrice,
  } = useCart();

  // Institution dynamic address schema configuration
  const [addressConfig, setAddressConfig] = useState([
    {
      key: 'hostelName',
      label: 'Hostel / Hall Name',
      placeholder: 'e.g. Cedar Hall / Ricketts House',
      required: true,
    },
    {
      key: 'roomNumber',
      label: 'Room / Block Number',
      placeholder: 'e.g. Room 304, Block B',
      required: true,
    },
    {
      key: 'landmark',
      label: 'Campus Landmark / Notes',
      placeholder: 'e.g. Near West Dining Hall',
      required: false,
    },
  ]);

  // Read saved campus address from user profile or local storage
  const getInitialAddress = () => {
    if (user?.savedAddress && typeof user.savedAddress === 'object') {
      return user.savedAddress;
    }
    try {
      const stored = localStorage.getItem('sd_saved_address');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  const initialAddress = getInitialAddress();
  const hasSavedAddress = Object.keys(initialAddress).length > 0 && Object.values(initialAddress).some((v) => v && v.trim());

  // Form states
  const [deliveryAddress, setDeliveryAddress] = useState(initialAddress);
  const [isEditingAddress, setIsEditingAddress] = useState(!hasSavedAddress);
  const [addressErrors, setAddressErrors] = useState({});
  const [selectedPayment, setSelectedPayment] = useState('Campus Card Wallet');
  const [pickupNotes, setPickupNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Order confirmation overlay state
  const [confirmationData, setConfirmationData] = useState(null);

  // Load institution address config
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await studentService.getHomeData();
        if (res.success && res.data?.institution?.addressFieldsConfig) {
          setAddressConfig(res.data.institution.addressFieldsConfig);
        }
      } catch (err) {
        console.error('Failed to load institution config:', err);
      }
    };
    loadConfig();
  }, []);

  // Update address state if user session updates
  useEffect(() => {
    const addr = getInitialAddress();
    if (Object.keys(addr).length > 0 && Object.keys(deliveryAddress).length === 0) {
      setDeliveryAddress(addr);
      setIsEditingAddress(false);
    }
  }, [user]);

  // Payment Options
  const paymentMethods = [
    {
      id: 'Campus Card Wallet',
      name: 'Campus Card Wallet',
      subtitle: 'Stanford Student ID Account (Balance: ₹15,000)',
      icon: '💳',
    },
    {
      id: 'UPI / QR Code',
      name: 'UPI / QR Code Pay',
      subtitle: 'Google Pay, PhonePe, Paytm, BHIM UPI',
      icon: '📲',
    },
    {
      id: 'Cash on Pickup',
      name: 'Cash on Campus Pickup',
      subtitle: 'Pay cash directly at shop pickup counter',
      icon: '💵',
    },
    {
      id: 'Credit / Debit Card',
      name: 'Credit / Debit Card',
      subtitle: 'Visa, MasterCard, RuPay',
      icon: '💳',
    },
  ];

  const handleAddressChange = (key, value) => {
    setDeliveryAddress((prev) => ({ ...prev, [key]: value }));
    if (addressErrors[key]) {
      setAddressErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const validateAddressFields = () => {
    const errors = {};
    addressConfig.forEach((field) => {
      if (field.required) {
        const val = deliveryAddress[field.key];
        if (!val || !val.trim()) {
          errors[field.key] = `${field.label} is required`;
        }
      }
    });
    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty.');
      navigate('/student/cart');
      return;
    }

    if (!validateAddressFields()) {
      setIsEditingAddress(true); // Open edit view if missing required address fields
      toast.error('Please fill in all required campus address fields.', { id: 'addr-val' });
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const orderPayload = {
        items: cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          vendorId: item.vendorId,
        })),
        paymentMethod: selectedPayment,
        deliveryAddress,
        pickupNotes: pickupNotes.trim() || undefined,
      };

      const res = await studentService.createOrder(orderPayload);

      if (res.success && res.data) {
        setConfirmationData(res.data);
        clearCart();
        // Persist saved address for subsequent checkouts
        if (updateSavedAddress) {
          updateSavedAddress(deliveryAddress);
        }
        toast.success('Order placed successfully! 🎉', { id: 'order-success' });
      } else {
        throw new Error(res.message || 'Failed to place order.');
      }
    } catch (err) {
      console.error('Checkout submit error:', err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Unable to process order. Please try again.';
      toast.error(errorMsg, { id: 'checkout-err' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const savedAddressSummary = addressConfig
    .map((f) => deliveryAddress[f.key])
    .filter(Boolean)
    .join(' • ');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased pb-24 sm:pb-12">
      {/* Header */}
      <StudentHeader
        institutionName="Stanford University"
        searchQuery=""
        setSearchQuery={() => {}}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
          <div>
            <Link
              to="/student/cart"
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-indigo-600 mb-1 transition-colors"
            >
              <span>←</span> Back to Cart
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Order Checkout & Payment
            </h1>
          </div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
            Institution: Stanford University
          </span>
        </div>

        {/* ORDER CONFIRMATION VIEW (When order is placed) */}
        {confirmationData ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl max-w-2xl mx-auto text-center space-y-6 animate-fade-in my-6">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 text-4xl shadow-inner">
              🎉
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Order Placed Successfully!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto">
                Your multi-vendor campus order has been confirmed and routed to vendors for preparation.
              </p>
            </div>

            {/* Pickup Passcode & Order Details Card */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 p-6 rounded-2xl text-white shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-indigo-700/60 pb-4">
                <div className="text-left">
                  <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Pickup Passcode</span>
                  <p className="text-3xl font-extrabold text-amber-300 font-mono">{confirmationData.pickupCode}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Order ID</span>
                  <p className="text-sm font-bold text-white font-mono">{confirmationData.orderId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-left">
                <div>
                  <span className="text-[10px] text-indigo-300 block">Total Bill</span>
                  <span className="font-extrabold text-white text-sm">₹{confirmationData.totalAmount?.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-indigo-300 block">Campus Vendors</span>
                  <span className="font-bold text-white">{confirmationData.vendorCount} Shops</span>
                </div>
                <div>
                  <span className="text-[10px] text-indigo-300 block">Payment Method</span>
                  <span className="font-bold text-white truncate block">{confirmationData.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-[10px] text-indigo-300 block">Est. Readiness</span>
                  <span className="font-bold text-emerald-400">{confirmationData.estimatedTime || '10-15 mins'}</span>
                </div>
              </div>

              {/* Delivery Address Summary */}
              {confirmationData.deliveryAddress && (
                <div className="pt-3 border-t border-indigo-700/60 text-left text-xs space-y-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-300 block">Campus Delivery / Pickup Address</span>
                  <p className="text-slate-200">
                    {Object.values(confirmationData.deliveryAddress).filter(Boolean).join(' • ')}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => navigate('/student/orders')}
                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
              >
                Track Order & Status →
              </button>
              <button
                onClick={() => navigate('/student/dashboard')}
                className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 max-w-md mx-auto my-8">
            <p className="text-sm font-bold text-slate-900">Your cart is currently empty.</p>
            <Link
              to="/student/dashboard"
              className="inline-block px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Browse Campus Shops
            </Link>
          </div>
        ) : (
          /* MAIN CHECKOUT FORM LAYOUT (2 Columns) */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Column: Item Review, Saved Campus Address & Payment Method */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* 1. Multi-Vendor Item Review */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <span>1.</span> Review Items ({cartTotalCount})
                  </h2>
                  <span className="text-xs font-semibold text-slate-500">
                    {groupedCartList.length} Vendor {groupedCartList.length === 1 ? 'Section' : 'Sections'}
                  </span>
                </div>

                <div className="space-y-4">
                  {groupedCartList.map((vg) => (
                    <div key={vg.vendorId} className="bg-slate-50 rounded-2xl border border-slate-200/80 overflow-hidden">
                      <div className="bg-slate-100/80 px-4 py-2.5 flex items-center justify-between text-xs border-b border-slate-200/60">
                        <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          <span>🏪</span> {vg.vendorName}
                        </span>
                        <span className="font-bold text-indigo-600">Subtotal: ₹{vg.subtotal.toFixed(2)}</span>
                      </div>

                      <div className="divide-y divide-slate-100 p-3 sm:p-4 space-y-2">
                        {vg.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-3 text-xs pt-2">
                            <div className="flex items-center gap-3">
                              <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-white border border-slate-200" />
                              <div>
                                <h4 className="font-bold text-slate-900">{item.name}</h4>
                                <p className="text-[11px] text-slate-500">Qty: {item.quantity} × ₹{item.price?.toFixed(2)}</p>
                              </div>
                            </div>
                            <span className="font-extrabold text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Campus Delivery / Pickup Address (Auto-Filled & Editable) */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <span>2.</span> Campus Delivery / Pickup Address
                  </h2>
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                    🏛️ Configured by Institution
                  </span>
                </div>

                {/* SAVED ADDRESS CARD (Shown when user has a saved address and is not editing) */}
                {!isEditingAddress && savedAddressSummary ? (
                  <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-emerald-600 text-white font-extrabold text-[10px] rounded-md uppercase">
                          ✓ Saved Campus Address
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">Auto-filled from account</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 pt-0.5">
                        {savedAddressSummary}
                      </p>
                    </div>

                    <button
                      onClick={() => setIsEditingAddress(true)}
                      className="px-4 py-2 bg-white hover:bg-slate-100 text-indigo-600 border border-indigo-200 font-extrabold text-xs rounded-xl shadow-2xs transition-all self-start sm:self-center shrink-0 flex items-center gap-1.5"
                    >
                      <span>✎</span>
                      <span>Edit Address</span>
                    </button>
                  </div>
                ) : (
                  /* EDITABLE DYNAMIC ADDRESS INPUT FORM */
                  <div className="space-y-4 pt-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500 font-medium">
                        {hasSavedAddress
                          ? 'Edit your campus building and room details for this order:'
                          : 'Enter your campus building and room details for Stanford University:'}
                      </p>
                      {hasSavedAddress && (
                        <button
                          onClick={() => setIsEditingAddress(false)}
                          className="text-xs font-bold text-slate-500 hover:text-slate-800 underline"
                        >
                          Use Saved Address
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {addressConfig.map((field) => (
                        <div key={field.key} className={field.key === 'landmark' ? 'sm:col-span-2' : ''}>
                          <label htmlFor={field.key} className="block text-xs font-extrabold text-slate-700 mb-1">
                            {field.label} {field.required && <span className="text-rose-500">*</span>}
                          </label>
                          <input
                            id={field.key}
                            type="text"
                            value={deliveryAddress[field.key] || ''}
                            onChange={(e) => handleAddressChange(field.key, e.target.value)}
                            placeholder={field.placeholder || `Enter ${field.label}...`}
                            className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                              addressErrors[field.key]
                                ? 'border-rose-400 focus:ring-rose-400/20 bg-rose-50/30'
                                : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/20 bg-white'
                            }`}
                          />
                          {addressErrors[field.key] && (
                            <p className="mt-1 text-[11px] text-rose-600 font-semibold">• {addressErrors[field.key]}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Special Pickup Instructions */}
                <div className="pt-2">
                  <label htmlFor="pickupNotes" className="block text-xs font-extrabold text-slate-700 mb-1">
                    Special Pickup Notes (Optional)
                  </label>
                  <textarea
                    id="pickupNotes"
                    rows="2"
                    value={pickupNotes}
                    onChange={(e) => setPickupNotes(e.target.value)}
                    placeholder="e.g. Will pick up right after CS lecture at 2:00 PM..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none"
                  ></textarea>
                </div>
              </div>

              {/* 3. Payment Method Selection */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <span>3.</span> Select Payment Method
                  </h2>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    ✓ Verified Campus Gateway
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {paymentMethods.map((pm) => {
                    const isSelected = selectedPayment === pm.id;
                    return (
                      <div
                        key={pm.id}
                        onClick={() => setSelectedPayment(pm.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'bg-indigo-50/70 border-indigo-600 shadow-sm'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-2xl mt-0.5">{pm.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-extrabold text-slate-900">{pm.name}</h4>
                            <input
                              type="radio"
                              name="paymentMethod"
                              checked={isSelected}
                              onChange={() => setSelectedPayment(pm.id)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                            />
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{pm.subtitle}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Right Column: Order Summary Card (Sticky Desktop) */}
            <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-24">
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 space-y-6">
                
                <h2 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                  Bill Summary (Rupees)
                </h2>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Items Subtotal ({cartTotalCount})</span>
                    <span className="font-bold text-slate-900">₹{cartSubtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Campus Service & Pickup Fee</span>
                    <span className="font-bold text-slate-900">₹{serviceFee.toFixed(2)}</span>
                  </div>

                  <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-base">
                    <div>
                      <span className="font-extrabold text-slate-900 block">Total Bill</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{selectedPayment}</span>
                    </div>
                    <span className="text-2xl font-extrabold text-indigo-600">
                      ₹{cartTotalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Place Order CTA Button */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-indigo-600/25 transition-all duration-150 active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Submitting Order...</span>
                    </>
                  ) : (
                    <>
                      <span>Place Order • ₹{cartTotalPrice.toFixed(2)}</span>
                      <span>→</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-slate-400 text-center font-semibold">
                  🔒 Multi-Tenant Secured Campus Transaction • Stanford University
                </p>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Floating Bottom Sticky Checkout Bar for Mobile */}
      {!confirmationData && cartItems.length > 0 && (
        <div className="fixed bottom-3 left-4 right-4 z-40 lg:hidden">
          <button
            onClick={handlePlaceOrder}
            disabled={isSubmitting}
            className="w-full bg-indigo-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between font-bold text-xs active:scale-98 disabled:opacity-50"
          >
            <div>
              <span className="block text-[10px] text-indigo-200 font-semibold">{selectedPayment}</span>
              <span className="text-base font-extrabold">₹{cartTotalPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <span>Place Order</span>
              <span>→</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default CheckoutScreen;
