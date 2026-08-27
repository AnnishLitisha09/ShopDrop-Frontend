import React from 'react';
import { Link } from 'react-router-dom';
import StudentHeader from '../../components/layout/StudentHeader';

export const NotificationsScreen = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <StudentHeader institutionName="Stanford University" searchQuery="" setSearchQuery={() => {}} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        <Link to="/student/dashboard" className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
          ← Back to Campus Marketplace
        </Link>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h1 className="text-2xl font-extrabold text-slate-900">Campus Alerts & Notifications</h1>
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-1">
            <p className="text-xs font-bold text-indigo-900">🎉 Welcome to Shop Drop!</p>
            <p className="text-xs text-indigo-700">Explore vendors, stationery, food, and campus services at Stanford University.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotificationsScreen;
