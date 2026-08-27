import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';

export const RegisterScreen = () => {
  const navigate = useNavigate();
  const { register, getDashboardPath } = useAuth();

  // Form input states
  const [name, setName] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI toggle states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Dynamic institution options
  const [institutions, setInstitutions] = useState([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(true);

  // Async & error states
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const res = await authService.getInstitutions();
        if (res.success && res.data?.institutions) {
          setInstitutions(res.data.institutions);
          if (res.data.institutions.length > 0) {
            setInstitutionId(res.data.institutions[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching campus institutions:', err);
        setServerError('Unable to load campus institutions. Please refresh.');
      } finally {
        setLoadingInstitutions(false);
      }
    };

    fetchInstitutions();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Full Name is required';
    }

    if (!institutionId) {
      newErrors.institutionId = 'Please select a valid campus institution';
    }

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
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const newStudent = await register(name, email, password, institutionId);
      toast.success(`Account created successfully! Welcome to Shop Drop, ${newStudent.name}!`, { icon: '🎉' });

      // Seamless redirect to Student Marketplace
      const targetDashboard = getDashboardPath(newStudent.role);
      navigate(targetDashboard, { replace: true });
    } catch (err) {
      console.error('Registration submit error:', err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Registration failed. Please check your details and try again.';

      setServerError(errorMsg);
      toast.error(errorMsg, { id: 'reg-err' });
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
          Create Student Account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium max-w-xs mx-auto">
          Join your campus marketplace for instant food, stationery, and dorm delivery.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200/80 sm:px-10 space-y-6">
          
          {/* Server Error Alert Banner */}
          {serverError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-bold flex items-start gap-2.5 animate-shake">
              <span className="text-base leading-none">⚠️</span>
              <div className="flex-1">{serverError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            
            {/* Full Name Field */}
            <div>
              <label htmlFor="name" className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Student"
                className={`w-full px-4 py-3 bg-slate-50 border rounded-2xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 transition-all ${
                  errors.name
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-600/20'
                }`}
              />
              {errors.name && <p className="mt-1 text-[11px] font-bold text-rose-600">{errors.name}</p>}
            </div>

            {/* Campus / Institution Selector Dropdown */}
            <div>
              <label htmlFor="institutionId" className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                College / Institution <span className="text-rose-500">*</span>
              </label>
              {loadingInstitutions ? (
                <div className="w-full py-3 px-4 bg-slate-100 rounded-2xl text-xs text-slate-400 animate-pulse">
                  Loading campus list...
                </div>
              ) : (
                <select
                  id="institutionId"
                  value={institutionId}
                  onChange={(e) => setInstitutionId(e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:ring-2 transition-all ${
                    errors.institutionId
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-600/20'
                  }`}
                >
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.code})
                    </option>
                  ))}
                </select>
              )}
              {errors.institutionId && <p className="mt-1 text-[11px] font-bold text-rose-600">{errors.institutionId}</p>}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Student Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@stanford.edu"
                className={`w-full px-4 py-3 bg-slate-50 border rounded-2xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 transition-all ${
                  errors.email
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-600/20'
                }`}
              />
              {errors.email && <p className="mt-1 text-[11px] font-bold text-rose-600">{errors.email}</p>}
            </div>

            {/* Password Field with Visibility Toggle */}
            <div>
              <label htmlFor="password" className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className={`w-full pl-4 pr-11 py-3 bg-slate-50 border rounded-2xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 transition-all ${
                    errors.password
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-600/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-[11px] font-bold text-rose-600">{errors.password}</p>}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className={`w-full pl-4 pr-11 py-3 bg-slate-50 border rounded-2xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 transition-all ${
                    errors.confirmPassword
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-600/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-[11px] font-bold text-rose-600">{errors.confirmPassword}</p>}
            </div>

            {/* Registration Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>Create Student Account →</span>
                )}
              </button>
            </div>

          </form>

          {/* Footer Navigation Link */}
          <div className="border-t border-slate-100 pt-5 text-center">
            <p className="text-xs text-slate-500 font-medium">
              Already have an account?{' '}
              <Link to="/login" className="font-extrabold text-indigo-600 hover:text-indigo-800 transition-colors">
                Sign in
              </Link>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};

export default RegisterScreen;
