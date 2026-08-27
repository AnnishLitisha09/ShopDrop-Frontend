import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export const LoginScreen = () => {
  const navigate = useNavigate();
  const { login, getDashboardPath } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Form states
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  // Quick Demo Login helper credentials
  const demoAccounts = [
    { role: 'Student', email: 'student@stanford.edu', pass: 'Password123!', bg: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200' },
    { role: 'Vendor', email: 'vendor@campusbites.com', pass: 'Password123!', bg: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200' },
    { role: 'Inst. Admin', email: 'admin@stanford.edu', pass: 'Password123!', bg: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200' },
    { role: 'Super Admin', email: 'superadmin@shopdrop.edu', pass: 'Password123!', bg: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200' },
  ];

  const handleDemoFill = (acc) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    setErrors({});
    setServerError('');
    toast.success(`Demo credentials set for ${acc.role}`, { id: 'demo-fill' });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const authenticatedUser = await login(email, password, rememberMe);
      toast.success(`Welcome back, ${authenticatedUser.name}!`);

      // Dynamic redirect based on backend user role
      const targetDashboard = getDashboardPath(authenticatedUser.role);
      navigate(targetDashboard, { replace: true });
    } catch (err) {
      console.error('Login submit error:', err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Unable to connect to authentication server. Please check your connection.';
      
      setServerError(errorMsg);
      toast.error(errorMsg, { id: 'login-err' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased text-slate-800 selection:bg-indigo-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Icon & Name */}
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/30 flex items-center justify-center text-white font-extrabold text-2xl tracking-tighter transform hover:scale-105 transition-transform duration-200">
            SD
          </div>
        </div>

        <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Shop Drop
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium max-w-xs mx-auto">
          One campus. Every shop. One marketplace.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Card Container */}
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-100 sm:px-10 space-y-6">
          
          {/* Quick Demo Fill Bar for Mini Project Demonstration */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Demo Roles Quick-Fill (Password: Password123!)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleDemoFill(acc)}
                  className={`text-xs px-2.5 py-1.5 font-medium rounded-lg border transition-all duration-150 flex items-center justify-between ${acc.bg}`}
                >
                  <span>{acc.role}</span>
                  <span className="opacity-60 text-[10px]">→</span>
                </button>
              ))}
            </div>
          </div>

          {/* Server / Connection Error Alert Banner */}
          {serverError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-sm font-medium flex items-start gap-3 animate-fade-in">
              <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold text-rose-800">Authentication Error</p>
                <p className="text-xs text-rose-600 mt-0.5">{serverError}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Campus Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                  }}
                  disabled={loading}
                  placeholder="student@stanford.edu"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                    errors.email
                      ? 'border-rose-400 focus:ring-rose-400/20 bg-rose-50/30'
                      : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/20 bg-white'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                  <span>•</span> {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <a
                  href="#forgot-password"
                  onClick={(e) => {
                    e.preventDefault();
                    toast('Please contact your campus administrator to reset password.', { icon: 'ℹ️' });
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                  }}
                  disabled={loading}
                  placeholder="••••••••"
                  className={`w-full pl-4 pr-12 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                    errors.password
                      ? 'border-rose-400 focus:ring-rose-400/20 bg-rose-50/30'
                      : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/20 bg-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-medium focus:outline-none"
                  tabIndex="-1"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.018 10.018 0 013.682-.813c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-4.686-3.86a3 3 0 11-4.243-4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                  <span>•</span> {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2.5 block text-xs font-medium text-slate-700 cursor-pointer">
                Remember session on this browser
              </label>
            </div>

            {/* Login Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-600/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-150 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign in to Shop Drop</span>
              )}
            </button>
          </form>

          {/* Student Registration Link */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 font-medium">
              Don't have a student account?{' '}
              <Link
                to="/register"
                className="font-extrabold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Shop Drop Multi-Tenant Campus Commerce Platform © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
