import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import vendorService from '../../services/vendorService';

export const VendorProductsScreen = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteProductTarget, setDeleteProductTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Meals',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
    isAvailable: true,
  });

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await vendorService.getProducts();
      if (res.success && res.data) {
        setProducts(res.data.products || []);
      }
    } catch (err) {
      console.error('Error fetching vendor products:', err);
      setError('Failed to load product catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'Meals',
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
      isAvailable: true,
    });
    setAddModalOpen(true);
  };

  const handleOpenEditModal = (prod) => {
    setEditProduct(prod);
    setFormData({
      name: prod.name || '',
      description: prod.description || '',
      price: prod.price || '',
      category: prod.category || 'Meals',
      imageUrl: prod.imageUrl || '',
      isAvailable: prod.isAvailable !== false,
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    setUploadingImage(true);
    try {
      const res = await vendorService.uploadImage(file);
      if (res.success && res.imageUrl) {
        setFormData((prev) => ({ ...prev, imageUrl: res.imageUrl }));
        toast.success('Image file uploaded successfully!', { icon: '📸' });
      }
    } catch (err) {
      console.error('Image upload error:', err);
      toast.error('Failed to upload image file.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleToggleAvailability = async (product) => {
    const updatedStatus = !product.isAvailable;
    try {
      const res = await vendorService.updateProduct(product.id, { isAvailable: updatedStatus });
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, isAvailable: updatedStatus } : p))
        );
        toast.success(
          `Product "${product.name}" set to ${updatedStatus ? 'AVAILABLE' : 'UNAVAILABLE'}`,
          { icon: updatedStatus ? '🟢' : '🔴' }
        );
      }
    } catch (err) {
      toast.error('Failed to update product availability.');
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price || !formData.category) {
      toast.error('Please enter product name, price, and category.');
      return;
    }

    setSubmitting(true);
    try {
      if (editProduct) {
        const res = await vendorService.updateProduct(editProduct.id, formData);
        if (res.success) {
          toast.success(`Updated "${formData.name}" successfully!`);
          setEditProduct(null);
          fetchProducts();
        }
      } else {
        const res = await vendorService.createProduct(formData);
        if (res.success) {
          toast.success(`Created "${formData.name}" successfully!`);
          setAddModalOpen(false);
          fetchProducts();
        }
      }
    } catch (err) {
      toast.error('Failed to save product details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteProductTarget) return;
    setSubmitting(true);
    try {
      const res = await vendorService.deleteProduct(deleteProductTarget.id);
      if (res.success) {
        toast.success(`Product "${deleteProductTarget.name}" deleted.`);
        setProducts((prev) => prev.filter((p) => p.id !== deleteProductTarget.id));
        setDeleteProductTarget(null);
      }
    } catch (err) {
      toast.error('Failed to delete product.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (activeFilter === 'Available' && !p.isAvailable) return false;
    if (activeFilter === 'Unavailable' && p.isAvailable) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = p.name?.toLowerCase().includes(q);
      const matchCat = p.category?.toLowerCase().includes(q);
      if (!matchName && !matchCat) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER & SEARCH BAR */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Product Catalog Manager</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage items, prices, and stock availability for campus students.
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-2xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 self-start sm:self-center"
          >
            <span>+ Add Product</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by name or category..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl text-xs font-medium focus:outline-none"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {['All', 'Available', 'Unavailable'].map((tab) => {
              const isActive = activeFilter === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all border ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200/80'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* PRODUCTS INVENTORY TABLE */}
      {loading ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 space-y-4 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/4"></div>
          <div className="h-12 bg-slate-200 rounded-xl"></div>
          <div className="h-12 bg-slate-200 rounded-xl"></div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-3xl text-center space-y-3 max-w-md mx-auto my-8">
          <p className="text-xs font-bold text-rose-800">{error}</p>
          <button
            onClick={fetchProducts}
            className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Retry Loading
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs text-center space-y-4 max-w-md mx-auto my-8">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-500 text-3xl shadow-inner">
            📦
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900">Your shop has no products yet</h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Add items to your shop catalog so campus students can discover and order them.
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all"
          >
            <span>+ Add Your First Product</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] bg-slate-50/50">
                  <th className="p-4">Item Details</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Availability</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-12 h-12 rounded-2xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">{prod.name}</h4>
                          <p className="text-[11px] text-slate-500 truncate max-w-xs">{prod.description || 'Campus product'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-lg">
                        {prod.category}
                      </span>
                    </td>

                    <td className="p-4 font-black text-slate-900 text-sm">
                      ₹{prod.price?.toFixed(2)}
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => handleToggleAvailability(prod)}
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold transition-all border flex items-center gap-1.5 ${
                          prod.isAvailable
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        <span>{prod.isAvailable ? '🟢' : '🔴'}</span>
                        <span>{prod.isAvailable ? 'Available' : 'Unavailable'}</span>
                      </button>
                    </td>

                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(prod)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                      >
                        ✎ Edit
                      </button>
                      <button
                        onClick={() => setDeleteProductTarget(prod)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-colors"
                      >
                        ✕ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {(addModalOpen || editProduct) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5 animate-fade-in border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">
                {editProduct ? 'Edit Product Details' : 'Add New Campus Product'}
              </h3>
              <button
                onClick={() => {
                  setAddModalOpen(false);
                  setEditProduct(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Fresh Peri Peri Burger"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price in Rupees (₹) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="e.g. 150.00"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:border-indigo-600 focus:outline-none bg-white"
                  >
                    <option value="Meals">Meals</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Stationery">Stationery</option>
                    <option value="Printing">Printing</option>
                    <option value="Apparel">Apparel</option>
                    <option value="Essentials">Essentials</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <label className="block font-bold text-slate-700">Product Image (Upload File or Enter URL)</label>
                
                <div className="flex items-center gap-4">
                  {formData.imageUrl ? (
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-16 h-16 rounded-xl object-cover bg-white border border-slate-300 shadow-2xs shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-200 text-slate-400 font-bold flex items-center justify-center text-xs shrink-0">
                      No Image
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-100 text-indigo-600 border border-indigo-200 font-extrabold rounded-xl cursor-pointer text-xs shadow-2xs transition-colors">
                      <span>📁 Upload From Device</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    {uploadingImage && (
                      <p className="text-[11px] text-indigo-600 font-bold animate-pulse">
                        ⏳ Uploading image file...
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] text-slate-400 font-semibold block mb-1">Or paste public Image URL:</span>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2 bg-white rounded-xl border border-slate-300 text-xs font-medium focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short description of the product..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:border-indigo-600 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="isAvailable" className="font-bold text-slate-800 cursor-pointer">
                  Product Available for Student Ordering
                </label>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {submitting ? 'Saving Product...' : editProduct ? 'Save Changes' : 'Create Product'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddModalOpen(false);
                    setEditProduct(null);
                  }}
                  className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteProductTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 animate-fade-in border border-slate-100">
            <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500 text-2xl shadow-inner">
              🗑️
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">Delete this product?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete <strong>"{deleteProductTarget.name}"</strong>? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleDeleteProduct}
                disabled={submitting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Delete Product'}
              </button>
              <button
                onClick={() => setDeleteProductTarget(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
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

export default VendorProductsScreen;
