import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import vendorService from '../../services/vendorService';

export const VendorLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [vendorData, setVendorData] = useState(null);
  const [loadingVendor, setLoadingVendor] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchVendorData = async () => {
    try {
      const res = await vendorService.getDashboardStats();
      if (res.success && res.data) {
        setVendorData(res.data);
      }
    } catch (err) {
      console.error('Error fetching vendor layout data:', err);
    } finally {
      setLoadingVendor(false);
    }
  };

  useEffect(() => {
    fetchVendorData();
  }, []);

  const handleToggleShopStatus = async () => {
    if (!vendorData?.vendor || statusUpdating) return;
    const newStatus = !vendorData.vendor.isOpen;
    setStatusUpdating(true);

    try {
      const res = await vendorService.updateShopStatus(newStatus);
      if (res.success) {
        setVendorData((prev) => ({
          ...prev,
          vendor: { ...prev.vendor, isOpen: newStatus },
        }));
        toast.success(`Shop is now ${newStatus ? 'OPEN for orders' : 'CLOSED'}`, {
          icon: newStatus ? '🟢' : '🔴',
        });
      }
    } catch (err) {
      toast.error('Failed to update shop status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const navLinks = [
    { path: '/vendor/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/vendor/analytics', label: 'Shop Analytics', icon: '📈' },
    { path: '/vendor/orders', label: 'Orders Queue', icon: '📋' },
    { path: '/vendor/products', label: 'Products Catalog', icon: '📦' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800 antialiased">
      
      {/* 1. 70% BLUE & 30% BLACK SHADED SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-[#0D1B2A] via-[#102A43] to-[#0A192F] text-slate-100 border-r border-blue-900/50 shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 space-y-6">
          {/* Logo & Brand Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-600/35 ring-1 ring-blue-300/30">
                SD
              </div>
              <div>
                <span className="font-black text-white text-base tracking-tight block">Shop Drop</span>
                <span className="text-[10px] text-blue-300 font-extrabold uppercase tracking-widest">Vendor Portal</span>
              </div>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-1">
              ✕
            </button>
          </div>

          {/* Active Campus Store Info Card */}
          {vendorData?.vendor && (
            <div className="bg-[#1B365D]/80 p-4 rounded-2xl border border-blue-700/40 space-y-1 shadow-inner backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-blue-300 font-black uppercase tracking-wider">Stanford Store</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              </div>
              <p className="text-xs font-black text-white truncate">{vendorData.vendor.shopName}</p>
              <p className="text-[11px] text-blue-200/90 font-medium truncate">📍 {vendorData.vendor.location}</p>
            </div>
          )}

          {/* Navigation Section Title */}
          <div className="text-[10px] font-black uppercase tracking-widest text-blue-300/70 px-1 pt-1">
            Menu Navigation
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 text-xs font-bold">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 text-white font-black shadow-lg shadow-blue-600/35 ring-1 ring-blue-300/40'
                      : 'text-blue-100/90 hover:text-white hover:bg-[#1B365D]/70 font-bold'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{link.icon}</span>
                    <span>{link.label}</span>
                  </div>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Logout Footer */}
        <div className="p-6 border-t border-blue-900/50 bg-[#071322]/90 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-black text-xs shadow-md">
                {user?.name?.charAt(0) || 'V'}
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#071322] absolute -bottom-0.5 -right-0.5"></span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-white truncate">{user?.name || 'Vendor Admin'}</p>
              <p className="text-[10px] text-blue-200/80 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full py-2.5 bg-[#1B365D]/80 hover:bg-rose-950/80 text-blue-100 hover:text-rose-200 border border-blue-800/40 hover:border-rose-800/60 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <span>🚪 Logout Account</span>
          </button>
        </div>
      </aside>

      {/* Backdrop overlay for mobile drawer */}
      {mobileMenuOpen && (
        <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden" />
      )}

      {/* 2. MAIN CONTENT WRAPPER */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Navbar Header */}
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest hidden sm:inline">
              Shop Drop Vendor Portal
            </span>
          </div>

          {/* Shop Availability Status Toggle Pill */}
          {vendorData?.vendor && (
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 p-1.5 px-3 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                <span className={`text-xs font-extrabold flex items-center gap-1.5 ${vendorData.vendor.isOpen ? 'text-emerald-700' : 'text-rose-700'}`}>
                  <span>{vendorData.vendor.isOpen ? '🟢' : '🔴'}</span>
                  <span className="hidden sm:inline">{vendorData.vendor.isOpen ? 'OPEN FOR ORDERS' : 'SHOP CLOSED'}</span>
                </span>

                <button
                  onClick={handleToggleShopStatus}
                  disabled={statusUpdating}
                  className={`px-3 py-1 rounded-xl text-[11px] font-extrabold transition-all shadow-2xs active:scale-95 disabled:opacity-50 ${
                    vendorData.vendor.isOpen
                      ? 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {statusUpdating ? 'Updating...' : vendorData.vendor.isOpen ? 'Close Shop' : 'Open Shop'}
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Dynamic Screen View Outlet */}
        <div className="p-4 sm:p-8 flex-1 max-w-7xl mx-auto w-full">
          <Outlet context={{ vendorData, fetchVendorData }} />
        </div>
      </div>

    </div>
  );
};

export default VendorLayout;
