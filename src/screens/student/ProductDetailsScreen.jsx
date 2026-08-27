import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import StudentHeader from '../../components/layout/StudentHeader';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import studentService from '../../services/studentService';

export const ProductDetailsScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, cartTotalCount, cartTotalPrice } = useCart();

  // Async states
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Local interactive states
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const fetchProductDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentService.getProductDetails(id);
      if (res.success && res.data) {
        setProduct(res.data.product);
        setRelatedProducts(res.data.relatedProducts || []);
        setReviews(res.data.reviews || null);
      }
    } catch (err) {
      console.error('Error fetching product details:', err);
      const msg = err.response?.data?.message || 'Failed to load product details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetails();
    setQuantity(1);
    setAdded(false);
  }, [id]);

  const handleDecreaseQty = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncreaseQty = () => {
    const maxStock = 20; // Default max item cap
    if (quantity < maxStock) {
      setQuantity(quantity + 1);
    } else {
      toast.error('Maximum quantity limit reached for this order.', { id: 'qty-max' });
    }
  };

  const handleAddToCart = () => {
    if (!product || !product.isAvailable) return;
    addToCart(product, quantity);
    setAdded(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased pb-16 sm:pb-8">
      {/* Top Header */}
      <StudentHeader
        institutionName="Stanford University"
        searchQuery=""
        setSearchQuery={() => {}}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-8">
        
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <span>←</span> Back to Marketplace
          </button>
          <Link
            to="/student/dashboard"
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            Browse All Campus Shops
          </Link>
        </div>

        {/* Error / 404 / 403 Access Denied State */}
        {error ? (
          <div className="bg-white p-8 rounded-3xl border border-rose-200 shadow-sm text-center space-y-4 max-w-lg mx-auto my-12">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500 text-3xl">
              🚫
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Product Unavailable</h2>
            <p className="text-xs text-slate-600 leading-relaxed">{error}</p>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
            >
              Return to Campus Marketplace
            </button>
          </div>
        ) : loading ? (
          /* Loading Skeleton */
          <div className="bg-white rounded-3xl p-8 border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
            <div className="h-80 bg-slate-200 rounded-2xl"></div>
            <div className="space-y-4">
              <div className="h-6 bg-slate-200 rounded w-1/3"></div>
              <div className="h-8 bg-slate-200 rounded w-3/4"></div>
              <div className="h-6 bg-slate-200 rounded w-1/4"></div>
              <div className="h-20 bg-slate-200 rounded w-full"></div>
            </div>
          </div>
        ) : product && (
          <>
            {/* Main Product Card (2 Columns) */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
              
              {/* Left Column: Image Preview */}
              <div className="space-y-4">
                <div className="h-80 sm:h-96 w-full rounded-2xl bg-slate-100 overflow-hidden relative border border-slate-200/60 shadow-xs group">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-lg text-xs font-extrabold text-slate-800 shadow-xs">
                      {product.category}
                    </span>
                  </div>

                  <div className="absolute top-4 right-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide backdrop-blur-md shadow-xs ${
                        product.isAvailable
                          ? 'bg-emerald-500/90 text-white'
                          : 'bg-rose-600/90 text-white'
                      }`}
                    >
                      {product.isAvailable ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Details & Add to Cart Controls */}
              <div className="space-y-6">
                
                {/* Header info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/student/vendors/${product.Vendor?.id}`}
                      className="text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-md"
                    >
                      🏪 {product.Vendor?.shopName || 'Campus Shop'}
                    </Link>
                    <span className="text-xs text-slate-400">• Item #{product.id}</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                    {product.name}
                  </h1>

                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
                      <span className="text-amber-500 text-xs">★</span>
                      <span className="text-xs font-extrabold text-amber-800">4.8</span>
                      <span className="text-[10px] text-slate-500 font-semibold">(38 ratings)</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      Campus Code: <strong className="text-slate-700">{product.institutionId}</strong>
                    </span>
                  </div>
                </div>

                {/* Price Display */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-semibold block">Campus Price</span>
                    <span className="text-3xl font-extrabold text-slate-900">₹{product.price?.toFixed(2)}</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200/60">
                    ✓ Available for Campus Pickup
                  </span>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {product.description || 'Fresh item prepared at campus shop.'}
                  </p>
                </div>

                {/* Quantity Selector & Add to Cart Button */}
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-4">
                    <label className="text-xs font-extrabold text-slate-700">Select Quantity:</label>
                    <div className="flex items-center border-2 border-slate-300 rounded-xl bg-white overflow-hidden shadow-xs">
                      <button
                        onClick={handleDecreaseQty}
                        disabled={!product.isAvailable || quantity <= 1}
                        className="px-3.5 py-2 text-slate-700 hover:bg-slate-100 font-extrabold text-base disabled:opacity-40 transition-colors"
                      >
                        -
                      </button>
                      <span className="px-4 text-sm font-extrabold text-slate-900 min-w-[32px] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={handleIncreaseQty}
                        disabled={!product.isAvailable}
                        className="px-3.5 py-2 text-slate-700 hover:bg-slate-100 font-extrabold text-base disabled:opacity-40 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Add to Cart CTA */}
                  {!product.isAvailable ? (
                    <button
                      disabled
                      className="w-full py-3.5 px-6 bg-slate-100 text-slate-400 font-bold rounded-2xl cursor-not-allowed border border-slate-200 text-sm"
                    >
                      Out of Stock
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <button
                        onClick={handleAddToCart}
                        className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-600/25 transition-all duration-150 active:scale-98 flex items-center justify-center gap-2 text-sm"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <span>Add {quantity} to Cart • ${(product.price * quantity).toFixed(2)}</span>
                      </button>

                      {added && (
                        <div className="flex items-center justify-between gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 animate-fade-in">
                          <span>✓ Added {quantity} item(s) to your cart!</span>
                          <div className="flex items-center gap-2">
                            <Link
                              to="/student/cart"
                              className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-2xs"
                            >
                              View Cart →
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Embedded Vendor Card */}
                {product.Vendor && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 hover:border-indigo-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.Vendor.logoUrl}
                        alt={product.Vendor.shopName}
                        className="w-12 h-12 rounded-xl object-cover bg-white border border-slate-200 shrink-0"
                      />
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900">{product.Vendor.shopName}</h4>
                        <p className="text-[11px] text-slate-500">
                          {product.Vendor.category} • Est. Pickup: {product.Vendor.pickupTime || '10 mins'}
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`/student/vendors/${product.Vendor.id}`}
                      className="px-3 py-1.5 bg-white text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-xl text-xs font-bold transition-colors shrink-0"
                    >
                      Visit Shop →
                    </Link>
                  </div>
                )}

              </div>
            </div>

            {/* Related Products Section */}
            {relatedProducts.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                      More from {product.Vendor?.shopName || 'this shop'}
                    </h2>
                    <p className="text-xs text-slate-500">Related items available on your campus</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {relatedProducts.map((rel) => (
                    <div
                      key={rel.id}
                      className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                    >
                      <div>
                        <div
                          onClick={() => navigate(`/student/products/${rel.id}`)}
                          className="h-32 w-full bg-slate-100 overflow-hidden cursor-pointer relative"
                        >
                          <img
                            src={rel.imageUrl}
                            alt={rel.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-3.5 space-y-1">
                          <h3
                            onClick={() => navigate(`/student/products/${rel.id}`)}
                            className="text-xs font-bold text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors line-clamp-1"
                          >
                            {rel.name}
                          </h3>
                          <p className="text-[11px] font-extrabold text-slate-900">₹{rel.price?.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="p-3.5 pt-0">
                        <button
                          onClick={() => addToCart(rel)}
                          className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl font-bold text-[11px] transition-colors"
                        >
                          + Quick Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Product Student Reviews Section */}
            {reviews && (
              <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Student Product Reviews</h2>
                    <p className="text-xs text-slate-500">Feedback from students who ordered this item</p>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200/60">
                    <span className="text-amber-500 text-xs">★</span>
                    <span className="text-xs font-extrabold text-amber-800">{reviews.averageRating} / 5.0</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {reviews.recent.map((rev) => (
                    <div key={rev.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">{rev.studentName}</span>
                        <span className="text-[11px] text-slate-400">{rev.date}</span>
                      </div>
                      <div className="text-amber-500 text-xs">{'★'.repeat(rev.rating)}</div>
                      <p className="text-xs text-slate-600 leading-relaxed">"{rev.comment}"</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* Floating Bottom Action Bar for Mobile */}
      {product && product.isAvailable && (
        <div className="fixed bottom-3 left-4 right-4 z-40 sm:hidden">
          <button
            onClick={handleAddToCart}
            className="w-full bg-indigo-600 text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between font-bold text-xs"
          >
            <span>Add {quantity} to Cart</span>
            <span>₹{(product.price * quantity).toFixed(2)} →</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductDetailsScreen;
