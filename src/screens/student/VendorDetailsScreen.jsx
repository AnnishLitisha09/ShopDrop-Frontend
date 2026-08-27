import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import StudentHeader from '../../components/layout/StudentHeader';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import studentService from '../../services/studentService';

export const VendorDetailsScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, addToCart, updateQuantity, cartTotalCount, cartTotalPrice } = useCart();

  // Async data states
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [reviews, setReviews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // In-shop filter states
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [inShopQuery, setInShopQuery] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);

  const fetchVendorDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentService.getVendorDetails(id);
      if (res.success && res.data) {
        setVendor(res.data.vendor);
        setProducts(res.data.products || []);
        if (res.data.categories?.length > 0) {
          setCategories(res.data.categories);
        }
        setReviews(res.data.reviews || null);
      }
    } catch (err) {
      console.error('Error fetching vendor details:', err);
      const msg = err.response?.data?.message || 'Failed to load shop details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorDetails();
  }, [id]);

  // Filtered products logic
  const filteredProducts = products.filter((prod) => {
    const matchesCategory = selectedCategory === 'All' || prod.category === selectedCategory;
    const matchesQuery =
      !inShopQuery ||
      prod.name.toLowerCase().includes(inShopQuery.toLowerCase()) ||
      (prod.description && prod.description.toLowerCase().includes(inShopQuery.toLowerCase()));
    const matchesAvailability = !onlyAvailable || prod.isAvailable;
    return matchesCategory && matchesQuery && matchesAvailability;
  });

  // Helper to check item in cart
  const getCartQuantity = (productId) => {
    const found = cartItems.find((item) => item.id === productId);
    return found ? found.quantity : 0;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased pb-20 sm:pb-8">
      {/* Top Navigation */}
      <StudentHeader
        institutionName="Stanford University"
        searchQuery=""
        setSearchQuery={() => {}}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        
        {/* Back Link */}
        <Link
          to="/student/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <span>←</span> Back to Campus Marketplace
        </Link>

        {/* Error / Multi-tenant Access Denied State */}
        {error ? (
          <div className="bg-white p-8 rounded-3xl border border-rose-200 shadow-sm text-center space-y-4 max-w-lg mx-auto my-12">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500 text-3xl">
              🚫
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Shop Unavailable</h2>
            <p className="text-xs text-slate-600 leading-relaxed">{error}</p>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
            >
              Return to Campus Marketplace
            </button>
          </div>
        ) : loading ? (
          /* Loading Skeleton Header */
          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4 animate-pulse">
            <div className="h-44 bg-slate-200 rounded-2xl w-full"></div>
            <div className="h-6 bg-slate-200 rounded w-1/3"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          </div>
        ) : vendor && (
          <>
            {/* 1. Header Banner & Vendor Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
              {/* Banner Image */}
              <div className="h-48 sm:h-64 w-full bg-slate-200 relative overflow-hidden">
                <img
                  src={vendor.bannerUrl || vendor.logoUrl}
                  alt={vendor.shopName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

                {/* Open / Closed Status Badge */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide backdrop-blur-md shadow-md ${
                      vendor.isOpen
                        ? 'bg-emerald-500/90 text-white'
                        : 'bg-slate-900/90 text-slate-300'
                    }`}
                  >
                    {vendor.isOpen ? 'Open Now' : 'Closed'}
                  </span>
                </div>
              </div>

              {/* Vendor Info Section */}
              <div className="p-6 sm:p-8 space-y-6 relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                  <div className="flex items-center gap-4">
                    <img
                      src={vendor.logoUrl}
                      alt={vendor.shopName}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover bg-white border-2 border-white shadow-md shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-[11px] rounded-md">
                          {vendor.category}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">#{vendor.id}</span>
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                        {vendor.shopName}
                      </h1>
                    </div>
                  </div>

                  {/* Rating & Reviews pill */}
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 shrink-0">
                    <div className="text-center px-2 border-r border-slate-200">
                      <span className="text-lg font-extrabold text-slate-900 flex items-center gap-1 justify-center">
                        <span className="text-amber-500">★</span> {vendor.rating || 4.8}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">{vendor.reviewCount || 142} Reviews</span>
                    </div>
                    <div className="text-center px-2">
                      <span className="text-xs font-bold text-slate-900 block">{vendor.pickupTime}</span>
                      <span className="text-[10px] text-slate-500 font-semibold">Est. Pickup</span>
                    </div>
                  </div>
                </div>

                {/* Vendor Description & Location Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
                  <div className="md:col-span-2 space-y-2">
                    <h3 className="font-bold text-slate-900 text-sm">About {vendor.shopName}</h3>
                    <p className="leading-relaxed text-slate-600">{vendor.description}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                    <p className="flex items-start gap-2">
                      <span className="font-bold text-slate-900 shrink-0">📍 Location:</span>
                      <span>{vendor.location}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 shrink-0">⏰ Hours:</span>
                      <span>{vendor.operatingHours}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 shrink-0">💳 Payments:</span>
                      <span>{vendor.paymentMethods}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Closed Shop Warning Banner */}
            {!vendor.isOpen && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-xs font-semibold flex items-center gap-3">
                <span className="text-lg">🕒</span>
                <span>
                  <strong>Shop is currently closed.</strong> You can browse items and view prices, but ordering will resume during operating hours ({vendor.operatingHours}).
                </span>
              </div>
            )}

            {/* 2. Product Search & Category Filter Toolbar */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* In-Shop Search */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inShopQuery}
                    onChange={(e) => setInShopQuery(e.target.value)}
                    placeholder={`Search items in ${vendor.shopName}...`}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl text-xs font-medium focus:outline-none"
                  />
                  <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Only In-Stock Filter Checkbox */}
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={onlyAvailable}
                    onChange={(e) => setOnlyAvailable(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  In-Stock Only
                </label>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Products Grid */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Shop Items</h2>
                <span className="text-xs font-semibold text-slate-500">
                  Showing {filteredProducts.length} of {products.length} Products
                </span>
              </div>

              {filteredProducts.length === 0 ? (
                /* Empty Product List State */
                <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-3">
                  <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-2xl">
                    🛍️
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {products.length === 0
                      ? "This shop hasn't added any products yet."
                      : 'No items match your search or filter.'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Try clearing your search query or selecting another product category.
                  </p>
                </div>
              ) : (
                /* Products Cards Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => {
                    const cartQty = getCartQuantity(product.id);
                    return (
                      <div
                        key={product.id}
                        className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                      >
                        <div>
                          {/* Image */}
                          <div
                            onClick={() => navigate(`/student/products/${product.id}`)}
                            className="h-44 w-full bg-slate-100 overflow-hidden cursor-pointer relative"
                          >
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            
                            {/* Category Badge */}
                            <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-0.5 rounded-md text-[10px] font-extrabold text-slate-700 shadow-xs">
                              {product.category}
                            </span>

                            {/* Stock Badge */}
                            {!product.isAvailable && (
                              <span className="absolute top-3 right-3 bg-rose-600 text-white px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase shadow-xs">
                                Out of Stock
                              </span>
                            )}
                          </div>

                          {/* Details */}
                          <div className="p-5 space-y-2">
                            <h3
                              onClick={() => navigate(`/student/products/${product.id}`)}
                              className="text-base font-extrabold text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors line-clamp-1"
                            >
                              {product.name}
                            </h3>
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {product.description || 'Fresh item prepared at campus shop.'}
                            </p>
                          </div>
                        </div>

                        {/* Price & Cart Control Footer */}
                        <div className="p-5 pt-0 flex items-center justify-between gap-3">
                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold block">Price</span>
                            <span className="text-lg font-extrabold text-slate-900">
                              ₹{product.price?.toFixed(2)}
                            </span>
                          </div>

                          {/* Cart Action Button / Quantity Controls */}
                          {!product.isAvailable ? (
                            <button
                              disabled
                              className="px-3.5 py-2 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl cursor-not-allowed border border-slate-200"
                            >
                              Unavailable
                            </button>
                          ) : cartQty > 0 ? (
                            /* Quantity Control buttons when item is in cart */
                            <div className="flex items-center border-2 border-indigo-600 rounded-xl bg-indigo-50/50 overflow-hidden shadow-xs">
                              <button
                                onClick={() => updateQuantity(product.id, cartQty - 1)}
                                className="px-3 py-1.5 text-indigo-700 hover:bg-indigo-100 font-extrabold text-sm transition-colors"
                              >
                                -
                              </button>
                              <span className="px-3 text-xs font-extrabold text-indigo-900">{cartQty}</span>
                              <button
                                onClick={() => updateQuantity(product.id, cartQty + 1)}
                                className="px-3 py-1.5 text-indigo-700 hover:bg-indigo-100 font-extrabold text-sm transition-colors"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            /* Add to Cart button */
                            <button
                              onClick={() => addToCart(product)}
                              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs hover:shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                            >
                              <span>+</span>
                              <span>Add to Cart</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 4. Reviews Preview Section */}
            {reviews && (
              <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Student Ratings & Reviews</h2>
                    <p className="text-xs text-slate-500">Verified feedback from campus students</p>
                  </div>
                  <button
                    onClick={() => toast('Showing recent campus student reviews.', { icon: '⭐' })}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    View All {reviews.reviewCount} Reviews →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Rating Breakdown */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-center items-center text-center space-y-1">
                    <span className="text-4xl font-extrabold text-slate-900">{reviews.averageRating}</span>
                    <div className="flex items-center text-amber-500 text-sm gap-0.5">
                      ★ ★ ★ ★ ★
                    </div>
                    <span className="text-xs text-slate-500 font-semibold">{reviews.reviewCount} Ratings</span>
                  </div>

                  {/* Recent Student Reviews */}
                  <div className="md:col-span-2 space-y-3">
                    {reviews.recent.map((rev) => (
                      <div key={rev.id} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900">{rev.studentName}</span>
                          <span className="text-[11px] text-slate-400">{rev.date}</span>
                        </div>
                        <div className="text-amber-500 text-xs">{'★'.repeat(rev.rating)}</div>
                        <p className="text-xs text-slate-600 italic">"{rev.comment}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* Floating Bottom Cart Bar for Mobile */}
      {cartTotalCount > 0 && (
        <div className="fixed bottom-3 left-4 right-4 z-40 sm:hidden animate-bounce">
          <Link
            to="/student/cart"
            className="w-full bg-indigo-600 text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between font-bold text-xs"
          >
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-white/20 rounded-lg text-white font-extrabold">
                {cartTotalCount} items
              </span>
              <span>${cartTotalPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>View Cart</span>
              <span>→</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
};

export default VendorDetailsScreen;
