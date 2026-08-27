import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import institutionAdminService from '../../services/institutionAdminService';

export const InstitutionAdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchDashboardStats = async () => {
    try {
      const res = await institutionAdminService.getDashboardStats();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching institution admin layout data:', err);
      setError('Failed to load campus data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const navLinks = [
    { path: '/institution-admin/dashboard', label: 'Campus Overview', icon: '🏛️' },
    { path: '/institution-admin/analytics', label: 'Campus Analytics', icon: '📈' },
    { path: '/institution-admin/students', label: `Student Directory (${data?.kpi?.totalStudentsCount || 0})`, icon: '🎓' },
    { path: '/institution-admin/vendors', label: `Vendor Directory (${data?.kpi?.totalVendorsCount || 0})`, icon: '🏪' },
    { path: '/institution-admin/vendor-applications', label: `Vendor Applications (${data?.kpi?.pendingVendorsCount || 0})`, icon: '📋' },
    { path: '/institution-admin/complaints', label: `Complaints & Disputes (${data?.kpi?.openComplaintsCount || 0})`, icon: '💬' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800 antialiased">
      
      {/* 1. PERSISTENT 70% BLUE & 30% BLACK SHADED SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-[#0D1B2A] via-[#102A43] to-[#0A192F] text-slate-100 border-r border-blue-900/50 shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 space-y-6">
          {/* Logo & Brand Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-600/40 ring-1 ring-white/20">
                SD
              </div>
              <div>
                <span className="font-black text-white text-base tracking-tight block">Shop Drop</span>
                <span className="text-[10px] text-amber-400 font-black uppercase tracking-wider">Institution Admin</span>
              </div>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden text-slate-400 hover:text-white">✕</button>
          </div>

          {/* Institution Campus Info Glassmorphic Card */}
          {data?.institution && (
            <div className="bg-[#1B365D]/80 p-4 rounded-2xl border border-blue-400/20 space-y-1 shadow-inner backdrop-blur-md">
              <span className="text-[10px] text-blue-300 font-extrabold uppercase tracking-wider block">Campus Portal</span>
              <p className="text-xs font-extrabold text-white truncate">{data.institution.name}</p>
              <p className="text-[11px] text-blue-200/80">{data.institution.city}</p>
            </div>
          )}

          {/* Section Divider */}
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400/80 px-1 pt-1">
            Campus Governance
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
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 text-white font-black shadow-lg shadow-blue-600/30 ring-1 ring-white/20'
                      : 'text-slate-300 hover:text-white hover:bg-white/10 font-bold'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{link.icon}</span>
                    <span className="truncate">{link.label}</span>
                  </div>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-300"></span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Logout Footer */}
        <div className="p-6 border-t border-blue-900/50 bg-[#0A192F]/90 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-xs shadow-md">
              {user?.name?.charAt(0) || 'I'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-white truncate">{user?.name || 'Institution Head'}</p>
              <p className="text-[10px] text-blue-200/70 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full py-2.5 bg-[#0D1B2A] hover:bg-rose-950/80 text-slate-200 hover:text-rose-200 border border-blue-800/40 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <span>🚪 Logout Account</span>
          </button>
        </div>
      </aside>

      {mobileMenuOpen && (
        <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden" />
      )}

      {/* 2. MAIN CONTENT WRAPPER */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0 min-h-screen">
        
        {/* Persistent Top Navbar Header */}
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
              Shop Drop Institution Admin Portal
            </span>
          </div>

          <button
            onClick={fetchDashboardStats}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <span>🔄</span> Refresh Data
          </button>
        </header>

        {/* Dynamic Screen View Outlet */}
        <div className="p-4 sm:p-8 flex-1 max-w-7xl mx-auto w-full">
          <Outlet context={{ data, fetchDashboardStats, loading, error }} />
        </div>
      </div>

    </div>
  );
};

export default InstitutionAdminLayout;
