import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/apiClient';
import vendorService from '../../services/vendorService';
import studentService from '../../services/studentService';

export const ProfileScreen = () => {
  const navigate = useNavigate();
  const { user, logout, updateUserProfile } = useAuth();

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [savedAddress, setSavedAddress] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Preferences states
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [campusDealsEnabled, setCampusDealsEnabled] = useState(true);
  const [preferredPayment, setPreferredPayment] = useState('Campus Card Wallet');

  // Order summary shortcuts states
  const [orderStats, setOrderStats] = useState({ total: 12, completed: 10, pending: 2 });

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setSavedAddress(user.savedAddress || '');
      setAvatarUrl(user.avatarUrl || '');
    }

    const fetchOrderStats = async () => {
      try {
        const res = await studentService.getOrders();
        if (res.success && res.data?.orders) {
          const ords = res.data.orders;
          const total = ords.length;
          const completed = ords.filter((o) => o.status === 'completed').length;
          const pending = ords.filter((o) => ['pending', 'accepted', 'preparing', 'ready'].includes(o.status)).length;
          setOrderStats({ total, completed, pending });
        }
      } catch (err) {
        console.error('Error loading student order stats:', err);
      }
    };

    fetchOrderStats();
  }, [user]);

  // Handle Avatar Image File Upload
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await vendorService.uploadImage(file);
      if (res.success && res.imageUrl) {
        setAvatarUrl(res.imageUrl);
        toast.success('Avatar image uploaded successfully!', { icon: '🖼️' });
      }
    } catch (err) {
      toast.error('Failed to upload avatar image.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle Profile Update
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Student name cannot be empty.');
      return;
    }

    setUpdatingProfile(true);
    try {
      const response = await apiClient.put('/auth/profile', {
        name: name.trim(),
        savedAddress: savedAddress.trim(),
        avatarUrl,
      });

      if (response.data?.success && response.data?.user) {
        updateUserProfile(response.data.user);
        toast.success('Profile & settings updated successfully!', { icon: '✅' });
      }
    } catch (err) {
      toast.error('Failed to update profile.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }

    setUpdatingPassword(true);
    try {
      const response = await apiClient.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      if (response.data?.success) {
        toast.success('Password changed successfully!', { icon: '🔒' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 antialiased pb-16 sm:pb-12">
      
      {/* 1. TOP NAVBAR HEADER */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-4 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/student/dashboard"
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">Student Profile & Settings</h1>
          </div>

          <span className="text-xs font-black text-indigo-800 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
            ✓ Verified Student
          </span>
        </div>
      </header>

      {/* 2. MAIN CONTENT CANVAS */}
      <main className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6">
        
        {/* STUDENT PROFILE CARD */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl text-white p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
          
          {/* Avatar with File Picker */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-black text-3xl shadow-lg border-2 border-white/20 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Student Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || 'S'
              )}
            </div>

            <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md cursor-pointer transition-transform active:scale-95">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>

          {/* Student Info Details */}
          <div className="space-y-1 text-center sm:text-left min-w-0 flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl font-black text-white truncate">{user?.name || 'Alex Student'}</h2>
              <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium truncate">{user?.email || 'student@stanford.edu'}</p>
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[11px] font-semibold text-slate-300">
              <span className="bg-slate-800/80 px-3 py-1 rounded-xl border border-slate-700">📍 Stanford University</span>
              <span className="bg-slate-800/80 px-3 py-1 rounded-xl border border-slate-700">🆔 STU-849201</span>
            </div>
          </div>

        </div>

        {/* ORDER HISTORY SHORTCUTS GRID */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          
          <button
            onClick={() => navigate('/student/orders')}
            className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow text-center space-y-1 cursor-pointer"
          >
            <span className="text-2xl block">🛍️</span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Orders</span>
            <p className="text-xl sm:text-2xl font-black text-slate-900">{orderStats.total}</p>
          </button>

          <button
            onClick={() => navigate('/student/orders')}
            className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow text-center space-y-1 cursor-pointer"
          >
            <span className="text-2xl block">✅</span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">Completed</span>
            <p className="text-xl sm:text-2xl font-black text-emerald-600">{orderStats.completed}</p>
          </button>

          <button
            onClick={() => navigate('/student/orders')}
            className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow text-center space-y-1 cursor-pointer"
          >
            <span className="text-2xl block">⏳</span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">Pending Pickup</span>
            <p className="text-xl sm:text-2xl font-black text-amber-600">{orderStats.pending}</p>
          </button>

        </div>

        {/* EDITABLE ACCOUNT SETTINGS CARD */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>👤</span> Edit Account Details
            </h3>
            <p className="text-[11px] text-slate-400">Update your student name and default campus delivery address</p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-bold">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-slate-700">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-2xl text-xs font-medium focus:outline-none"
                  placeholder="Enter full name"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-700">Email Address (Read-only)</label>
                <input
                  type="email"
                  value={user?.email || 'student@stanford.edu'}
                  disabled
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 text-slate-500 rounded-2xl text-xs font-medium cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-700">Saved Campus Address / Hostel Room No.</label>
              <textarea
                rows="2"
                value={savedAddress}
                onChange={(e) => setSavedAddress(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-2xl text-xs font-medium focus:outline-none"
                placeholder="e.g. Cedar Hall, Room 304, Block B"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={updatingProfile}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {updatingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* CAMPUS PREFERENCES CARD */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>⚙️</span> Campus Preferences
            </h3>
            <p className="text-[11px] text-slate-400">Configure your order notification and payment defaults</p>
          </div>

          <div className="space-y-4 text-xs">
            
            {/* Preferred Payment Method */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <h4 className="font-extrabold text-slate-900">Preferred Payment Method</h4>
                <p className="text-[11px] text-slate-500 font-medium">Default option during checkout</p>
              </div>
              <select
                value={preferredPayment}
                onChange={(e) => setPreferredPayment(e.target.value)}
                className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-extrabold text-slate-800 text-xs focus:outline-none"
              >
                <option value="Campus Card Wallet">Campus Card Wallet</option>
                <option value="UPI / Card">UPI / Credit Card</option>
              </select>
            </div>

            {/* Notification Switches */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <h4 className="font-extrabold text-slate-900">Order Status Notifications</h4>
                <p className="text-[11px] text-slate-500 font-medium">Receive real-time alerts when orders are ready for pickup</p>
              </div>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <h4 className="font-extrabold text-slate-900">Campus Deals & Vendor Offers</h4>
                <p className="text-[11px] text-slate-500 font-medium">Receive alerts for special discounts at campus canteens</p>
              </div>
              <input
                type="checkbox"
                checked={campusDealsEnabled}
                onChange={(e) => setCampusDealsEnabled(e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
              />
            </div>

          </div>
        </div>

        {/* SECURITY & PASSWORD CHANGE CARD */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>🔒</span> Security & Account Access
            </h3>
            <p className="text-[11px] text-slate-400">Change your password or logout from account session</p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs font-bold">
            <div className="space-y-1.5">
              <label className="block text-slate-700">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-2xl text-xs font-medium focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-slate-700">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-2xl text-xs font-medium focus:outline-none"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-700">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-2xl text-xs font-medium focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                disabled={updatingPassword}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {updatingPassword ? 'Updating Password...' : 'Update Password'}
              </button>

              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="px-5 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs rounded-2xl border border-rose-200 transition-colors"
              >
                🚪 Logout Account
              </button>
            </div>
          </form>
        </div>

      </main>

    </div>
  );
};

export default ProfileScreen;
