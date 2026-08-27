import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles = [], allowUnauthenticated = false }) => {
  const { user, isAuthenticated, loading, getDashboardPath } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 font-medium">Loading Shop Drop...</p>
        </div>
      </div>
    );
  }

  // If page is public/unauthenticated (like Login), and user is already logged in -> redirect to role dashboard
  if (allowUnauthenticated) {
    if (isAuthenticated && user) {
      const targetPath = getDashboardPath(user.role);
      return <Navigate to={targetPath} replace />;
    }
    return children;
  }

  // If user is not authenticated -> redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user role is not authorized for this specific route -> redirect to their designated dashboard
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const defaultPath = getDashboardPath(user.role);
    return <Navigate to={defaultPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
