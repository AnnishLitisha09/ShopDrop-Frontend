import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import StudentHeader from '../../components/layout/StudentHeader';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export const CartScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cartItems,
    groupedCartList,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartTotalCount,
    cartSubtotal,
    serviceFee,
    cartTotalPrice,
  } = useCart();

  // Check if any cart item is out of stock
  const hasUnavailableItem = cartItems.some((item) => item.isAvailable === false);

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) return;
    // Navigate to full Checkout screen for payment selection & custom address input
    navigate('/student/checkout');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased pb-24 sm:pb-12">
      {/* Header */}
      <StudentHeader
        institutionName="Stanford University"
        searchQuery=""
        setSearchQuery={() => {}}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        
        {/* Navigation & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <Link
              to="/student/dashboard"
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-indigo-600 mb-1 transition-colors"
            >
              <span>←</span> Back to Marketplace
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Unified Campus Cart
              </h1>
              {cartTotalCount > 0 && (
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-extrabold text-xs rounded-full border border-indigo-200/80">
                  {cartTotalCount} {cartTotalCount === 1 ? 'Item' : 'Items'} • {groupedCartList.length} {groupedCartList.length === 1 ? 'Shop' : 'Shops'}
                </span>
              )}
            </div>
          </div>

          {cartItems.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear your cart?')) {
                  clearCart();
                }
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 self-start sm:self-center"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Clear Entire Cart</span>
            </button>
          )}
        </div>

        {/* Unavailable Item Alert Banner */}
        {hasUnavailableItem && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span>Some items in your cart are currently out of stock. Please remove them to proceed.</span>
            </div>
          </div>
        )}

        {/* Empty Cart State */}
        {cartItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-sm text-center space-y-5 max-w-lg mx-auto my-8">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-500 text-4xl shadow-inner">
              🛒
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-extrabold text-slate-900">Your campus cart is waiting</h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Explore campus food stalls, bookstore supplies, printing services, and merch available at Stanford University.
              </p>
            </div>
            <Link
              to="/student/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-indigo-600/25 transition-all"
            >
              <span>Browse Campus Shops</span>
              <span>→</span>
            </Link>
          </div>
        ) : (
          /* Main 2-Column Cart Layout */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Column: Multi-Vendor Grouped Sections */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Informational banner about multi-vendor fulfillment */}
              <div className="bg-indigo-50/80 border border-indigo-100 p-4 rounded-2xl flex items-center gap-3 text-xs font-medium text-indigo-900">
                <span className="text-lg shrink-0">⚡</span>
                <p>
                  <strong>Multi-Vendor Order Support:</strong> Items from different campus shops are grouped below into individual vendor sections. All items are purchased together in <strong>one unified checkout bill</strong>.
                </p>
              </div>

              {/* Grouped Vendor Cards */}
              {groupedCartList.map((vendorGroup) => (
                <div
                  key={vendorGroup.vendorId}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden"
                >
                  {/* Vendor Header */}
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                        🏪
                      </div>
                      <div>
                        <h2 className="text-sm font-extrabold text-slate-900">
                          {vendorGroup.vendorName}
                        </h2>
                        <span className="text-[11px] text-slate-500 font-semibold">
                          {vendorGroup.items.length} {vendorGroup.items.length === 1 ? 'item' : 'items'} in section
                        </span>
                      </div>
                    </div>

                    <Link
                      to={`/student/vendors/${vendorGroup.vendorId}`}
                      className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                      Visit Shop →
                    </Link>
                  </div>

                  {/* Vendor Items List */}
                  <div className="divide-y divide-slate-100">
                    {vendorGroup.items.map((item) => (
                      <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                        
                        {/* Image & Details */}
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                          />
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold text-[10px] rounded">
                                {item.category}
                              </span>
                              {!item.isAvailable && (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-extrabold text-[10px] rounded">
                                  Out of Stock
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                              {item.name}
                            </h3>
                            <p className="text-xs font-medium text-slate-500">
                              Unit Price: <span className="font-bold text-slate-800">₹{item.price?.toFixed(2)}</span>
                            </p>
                          </div>
                        </div>

                        {/* Quantity Controls & Subtotal */}
                        <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          {/* Quantity Selector */}
                          <div className="flex items-center border border-slate-300 rounded-xl bg-white shadow-2xs overflow-hidden">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-extrabold text-xs transition-colors"
                            >
                              -
                            </button>
                            <span className="px-3 text-xs font-extrabold text-slate-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-extrabold text-xs transition-colors"
                            >
                              +
                            </button>
                          </div>

                          {/* Item Subtotal */}
                          <div className="text-right min-w-[70px]">
                            <span className="text-[10px] text-slate-400 font-semibold block">Subtotal</span>
                            <span className="text-sm sm:text-base font-extrabold text-slate-900">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>

                          {/* Remove button */}
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remove item"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>

                  {/* Vendor Section Footer Subtotal */}
                  <div className="bg-slate-50/80 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">
                      {vendorGroup.vendorName} Subtotal:
                    </span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      ₹{vendorGroup.subtotal.toFixed(2)}
                    </span>
                  </div>

                </div>
              ))}
            </div>

            {/* Right Column: Order Summary Card (Sticky Desktop) */}
            <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-24">
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 space-y-6">
                
                <h2 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                  Order Summary
                </h2>

                {/* Vendor Subtotal Breakdown List */}
                <div className="space-y-2.5 text-xs">
                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                    Vendor Fulfillment Breakdown
                  </p>
                  {groupedCartList.map((vg) => (
                    <div key={vg.vendorId} className="flex items-center justify-between text-slate-700">
                      <span className="truncate max-w-[170px] font-semibold">{vg.vendorName}</span>
                      <span className="font-bold text-slate-900">₹{vg.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Products Subtotal</span>
                    <span className="font-bold text-slate-900">₹{cartSubtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1">
                      Campus Service & Pickup Fee
                      <span className="text-[10px] text-slate-400" title="Fixed campus platform fee">ⓘ</span>
                    </span>
                    <span className="font-bold text-slate-900">₹{serviceFee.toFixed(2)}</span>
                  </div>

                  <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-base">
                    <div>
                      <span className="font-extrabold text-slate-900 block">Total Bill</span>
                      <span className="text-[10px] text-slate-400 font-semibold">Taxes included</span>
                    </div>
                    <span className="text-2xl font-extrabold text-indigo-600">
                      ₹{cartTotalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Proceed to Checkout Button */}
                <button
                  onClick={handleProceedToCheckout}
                  disabled={hasUnavailableItem || cartItems.length === 0}
                  className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-indigo-600/25 transition-all duration-150 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span>Proceed to Campus Checkout</span>
                  <span>→</span>
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
      {cartItems.length > 0 && (
        <div className="fixed bottom-3 left-4 right-4 z-40 lg:hidden">
          <button
            onClick={handleProceedToCheckout}
            disabled={hasUnavailableItem}
            className="w-full bg-indigo-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between font-bold text-xs active:scale-98 disabled:opacity-50"
          >
            <div>
              <span className="block text-[10px] text-indigo-200 font-semibold">Total ({cartTotalCount} items)</span>
              <span className="text-base font-extrabold">₹{cartTotalPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <span>Checkout</span>
              <span>→</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default CartScreen;
