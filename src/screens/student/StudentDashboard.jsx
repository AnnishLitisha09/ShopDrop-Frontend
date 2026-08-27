import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import StudentHeader from '../../components/layout/StudentHeader';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import studentService from '../../services/studentService';
import StockBadge from '../../components/common/StockBadge';

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  // Data states
  const [institution, setInstitution] = useState(null);
  const [categories, setCategories] = useState([
    'All', 'Food', 'Stationery', 'Printing', 'Gifts & Accessories', 'Footwear', 'Essentials', 'Other'
  ]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [recentOrderItems, setRecentOrderItems] = useState([]);

  // UI / Async states
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Time-of-day greeting helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const fetchHomeData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentService.getHomeData();
      if (res.success && res.data) {
        setInstitution(res.data.institution);
        if (res.data.categories?.length > 0) {
          setCategories(res.data.categories);
        }
        setVendors(res.data.vendors || []);
        setProducts(res.data.products || []);
        setRecentOrderItems(res.data.recentOrderItems || []);
      }
    } catch (err) {
      console.error('Error loading campus marketplace:', err);
      setError('Unable to load your campus marketplace. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  // Filter or search when searchQuery or selectedCategory changes
  useEffect(() => {
    if (!searchQuery && selectedCategory === 'All') {
      fetchHomeData();
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await studentService.searchMarketplace(searchQuery, selectedCategory);
        if (res.success && res.data) {
          setVendors(res.data.vendors || []);
          setProducts(res.data.products || []);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased">
      {/* Top Header */}
      <StudentHeader
        institutionName={institution?.name || 'Stanford University'}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-8">
        
        {/* Welcome Section */}
        <section className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-indigo-200 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {institution?.name || 'Campus Marketplace'}
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Student'} 👋
            </h1>
            <p className="text-sm sm:text-base text-indigo-200 font-medium">
              Discover everything available on your campus — food stalls, bookstore, printing & services.
            </p>
          </div>
        </section>

        {/* Error Alert with Retry */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between text-rose-800 text-sm font-medium">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <span>{error}</span>
            </div>
            <button
              onClick={fetchHomeData}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              Retry Loading
            </button>
          </div>
        )}

        {/* Horizontally Scrollable Categories */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Browse Categories</h2>
            {selectedCategory !== 'All' && (
              <button
                onClick={() => setSelectedCategory('All')}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Reset Filter
              </button>
            )}
          </div>
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all duration-150 shrink-0 border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20 scale-105'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200/80 shadow-2xs'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </section>

        {/* Quick "Order Again" Section */}
        {recentOrderItems.length > 0 && !searchQuery && selectedCategory === 'All' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>⚡</span> Order Again
                </h2>
                <p className="text-xs text-slate-500">Quick reorder from your previous campus purchases</p>
              </div>
              <Link to="/student/orders" className="text-xs font-bold text-indigo-600 hover:underline">
                View All Orders →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {recentOrderItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow group"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate">{item.Vendor?.shopName || 'Campus Shop'}</p>
                    <p className="text-xs font-extrabold text-indigo-600 mt-1">₹{item.price?.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl font-extrabold text-xs transition-colors shrink-0"
                    title="Add to cart"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Featured Campus Vendors */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Campus Shops & Vendors
              </h2>
              <p className="text-xs text-slate-500">
                Approved vendors scoped to {institution?.name || 'your institution'}
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-200/60 px-2.5 py-1 rounded-full">
              {vendors.length} Shops Available
            </span>
          </div>

          {/* Vendors Loading Skeletons */}
          {(loading || searchLoading) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3 animate-pulse">
                  <div className="h-32 bg-slate-200 rounded-xl"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : vendors.length === 0 ? (
            /* Empty Vendors State */
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-xl">
                🏪
              </div>
              <h3 className="text-sm font-bold text-slate-900">No shops are currently available on your campus.</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No vendors found matching your selected category or search filter.
              </p>
            </div>
          ) : (
            /* Vendor Cards Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendors.map((vendor) => (
                <div
                  key={vendor.id}
                  onClick={() => navigate(`/student/vendors/${vendor.id}`)}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden group flex flex-col justify-between"
                >
                  <div>
                    {/* Shop Banner Image */}
                    <div className="h-32 w-full bg-slate-100 relative overflow-hidden">
                      <img
                        src={vendor.bannerUrl || vendor.logoUrl}
                        alt={vendor.shopName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      
                      {/* Open/Closed Badge */}
                      <span
                        className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide backdrop-blur-md shadow-xs ${
                          vendor.isOpen
                            ? 'bg-emerald-500/90 text-white'
                            : 'bg-slate-800/90 text-slate-300'
                        }`}
                      >
                        {vendor.isOpen ? 'Open Now' : 'Closed'}
                      </span>

                      {/* Vendor Category Chip */}
                      <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[11px] font-bold text-slate-800">
                        {vendor.category}
                      </span>
                    </div>

                    {/* Shop Content */}
                    <div className="p-5 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-extrabold text-base text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {vendor.shopName}
                        </h3>
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60 shrink-0">
                          <span className="text-amber-500 text-xs">★</span>
                          <span className="text-xs font-bold text-amber-800">{vendor.rating || 4.5}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500">
                        Estimated Pickup: <span className="font-semibold text-slate-700">{vendor.pickupTime}</span>
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
                    <span>Visit Shop</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recommended / Popular Products */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Popular Products & Items
              </h2>
              <p className="text-xs text-slate-500">Order items directly from campus shops</p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-200/60 px-2.5 py-1 rounded-full">
              {products.length} Items Listed
            </span>
          </div>

          {/* Products Loading Skeletons */}
          {(loading || searchLoading) ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3 animate-pulse">
                  <div className="h-36 bg-slate-200 rounded-xl"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            /* Empty Products State */
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-xl">
                📦
              </div>
              <h3 className="text-sm font-bold text-slate-900">No products found.</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No items match your search query or category filter.
              </p>
            </div>
          ) : (
            /* Product Cards Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                >
                  <div>
                    {/* Product Image */}
                    <div
                      onClick={() => navigate(`/student/products/${product.id}`)}
                      className="h-40 w-full bg-slate-100 overflow-hidden cursor-pointer relative"
                    >
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-700">
                        {product.category}
                      </span>
                      <div className="absolute top-2 right-2">
                        <StockBadge stock={product.stock} isAvailable={product.isAvailable} />
                      </div>
                    </div>

                    {/* Product Content */}
                    <div className="p-4 space-y-1.5">
                      <p className="text-[11px] font-semibold text-indigo-600 truncate">
                        {product.Vendor?.shopName || 'Campus Shop'}
                      </p>
                      <h3
                        onClick={() => navigate(`/student/products/${product.id}`)}
                        className="text-xs sm:text-sm font-bold text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors line-clamp-2"
                      >
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-1">{product.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Price & Add to Cart Footer */}
                  <div className="p-4 pt-0 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Price</span>
                      <span className="text-sm sm:text-base font-extrabold text-slate-900">
                        ₹{product.price?.toFixed(2)}
                      </span>
                    </div>
                    {product.isAvailable === false || (typeof product.stock === 'number' && product.stock <= 0) ? (
                      <button
                        disabled
                        className="px-3 py-1.5 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl cursor-not-allowed border border-slate-200"
                      >
                        {product.isAvailable === false ? 'Unavailable' : 'Out of Stock'}
                      </button>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs hover:shadow-md transition-all active:scale-95 flex items-center gap-1"
                      >
                        <span>+</span>
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-center text-xs text-slate-400">
        <p>Shop Drop Multi-Tenant Campus Marketplace • Scoped to {institution?.name || 'Stanford University'}</p>
      </footer>
    </div>
  );
};

export default StudentDashboard;
