import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import ProtectedRoute from './src/routes/ProtectedRoute';

import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

import StudentDashboard from './src/screens/student/StudentDashboard';
import VendorDetailsScreen from './src/screens/student/VendorDetailsScreen';
import ProductDetailsScreen from './src/screens/student/ProductDetailsScreen';
import CartScreen from './src/screens/student/CartScreen';
import CheckoutScreen from './src/screens/student/CheckoutScreen';
import OrdersScreen from './src/screens/student/OrdersScreen';
import OrderTrackingScreen from './src/screens/student/OrderTrackingScreen';
import ProfileScreen from './src/screens/student/ProfileScreen';
import NotificationsScreen from './src/screens/student/NotificationsScreen';

import VendorLayout from './src/components/layout/VendorLayout';
import VendorDashboard from './src/screens/vendor/VendorDashboard';
import VendorOrdersScreen from './src/screens/vendor/VendorOrdersScreen';
import VendorProductsScreen from './src/screens/vendor/VendorProductsScreen';

import InstitutionAdminLayout from './src/components/layout/InstitutionAdminLayout';
import InstitutionAdminDashboard from './src/screens/institution/InstitutionAdminDashboard';
import VendorApplicationsScreen from './src/screens/institution/VendorApplicationsScreen';
import VendorManagementScreen from './src/screens/institution/VendorManagementScreen';
import ComplaintManagementScreen from './src/screens/institution/ComplaintManagementScreen';

import StudentManagementScreen from './src/screens/institution/StudentManagementScreen';

import SuperAdminLayout from './src/components/layout/SuperAdminLayout';
import SuperAdminDashboard from './src/screens/superAdmin/SuperAdminDashboard';
import InstitutionManagementScreen from './src/screens/superAdmin/InstitutionManagementScreen';

import AnalyticsView from './src/screens/common/AnalyticsView';

const HomeRedirect = () => {
  const { user, isAuthenticated, loading, getDashboardPath } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
          <Routes>
            {/* Public Authentication Routes */}
            <Route
              path="/login"
              element={
                <ProtectedRoute allowUnauthenticated={true}>
                  <LoginScreen />
                </ProtectedRoute>
              }
            />
            <Route path="/register" element={<Navigate to="/login" replace />} />

            {/* Student Marketplace & Sub-Routes */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/vendors/:id"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <VendorDetailsScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/products/:id"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <ProductDetailsScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/cart"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <CartScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/checkout"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <CheckoutScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/orders"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <OrdersScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/orders/:id"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <OrderTrackingScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/profile"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <ProfileScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/notifications"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <NotificationsScreen />
                </ProtectedRoute>
              }
            />

            {/* Vendor Management Routes */}
            <Route
              path="/vendor"
              element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <VendorLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<VendorDashboard />} />
              <Route path="analytics" element={<AnalyticsView />} />
              <Route path="orders" element={<VendorOrdersScreen />} />
              <Route path="products" element={<VendorProductsScreen />} />
            </Route>

            {/* Institution Admin Routes */}
            <Route
              path="/institution-admin"
              element={
                <ProtectedRoute allowedRoles={['institution_admin']}>
                  <InstitutionAdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<InstitutionAdminDashboard />} />
              <Route path="analytics" element={<AnalyticsView />} />
              <Route path="students" element={<StudentManagementScreen />} />
              <Route path="vendors" element={<VendorManagementScreen />} />
              <Route path="vendor-applications" element={<VendorApplicationsScreen />} />
              <Route path="complaints" element={<ComplaintManagementScreen />} />
            </Route>

            {/* Super Admin Dashboard & Sub-Routes */}
            <Route
              path="/super-admin"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <SuperAdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<SuperAdminDashboard />} />
              <Route path="analytics" element={<AnalyticsView />} />
              <Route path="institutions" element={<InstitutionManagementScreen />} />
            </Route>

            {/* Catch-all Routes */}
            <Route path="/" element={<HomeRedirect />} />
            <Route path="*" element={<HomeRedirect />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
