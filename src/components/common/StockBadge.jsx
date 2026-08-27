import React from 'react';

export const StockBadge = ({ stock, isAvailable = true, className = '' }) => {
  const stockNum = typeof stock === 'number' ? stock : parseInt(stock ?? 10, 10);

  if (isAvailable === false) {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-600 font-extrabold text-[10px] rounded-lg border border-slate-200/80 ${className}`}>
        <span>○</span> Currently Unavailable
      </span>
    );
  }

  if (stockNum <= 0) {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-100 text-rose-800 font-extrabold text-[10px] rounded-lg border border-rose-300 ${className}`}>
        <span>✕</span> Out of Stock
      </span>
    );
  }

  if (stockNum <= 5) {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-900 font-extrabold text-[10px] rounded-lg border border-amber-300 animate-pulse ${className}`}>
        <span>⚡</span> Only {stockNum} left
      </span>
    );
  }

  if (stockNum <= 10) {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-extrabold text-[10px] rounded-lg border border-indigo-200 ${className}`}>
        <span>📦</span> {stockNum} left
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded-lg border border-emerald-300 ${className}`}>
      <span>✓</span> Available
    </span>
  );
};

export default StockBadge;
