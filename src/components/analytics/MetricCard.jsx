import React from 'react';

export const MetricCard = ({ icon, label, value, trend, isCurrency = false, accentColor = 'indigo' }) => {
  const getAccentStyle = () => {
    switch (accentColor) {
      case 'purple':
        return 'text-purple-600 border-purple-200';
      case 'amber':
        return 'text-amber-600 border-amber-200';
      case 'emerald':
        return 'text-emerald-600 border-emerald-200';
      case 'blue':
        return 'text-blue-600 border-blue-200';
      default:
        return 'text-indigo-600 border-indigo-200';
    }
  };

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon || '📊'}</span>
        {trend && (
          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            ↑ {trend}%
          </span>
        )}
      </div>

      <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">{label}</span>
      
      <p className={`text-2xl font-black ${getAccentStyle()}`}>
        {isCurrency ? `₹${typeof value === 'number' ? value.toFixed(2) : value}` : value}
      </p>
    </div>
  );
};

export default MetricCard;
