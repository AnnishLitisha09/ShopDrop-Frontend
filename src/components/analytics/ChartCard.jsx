import React from 'react';

export const ChartCard = ({ title, subtitle, children, badgeText }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4 overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            {title}
          </h3>
          {subtitle && <p className="text-[11px] text-slate-400 font-medium">{subtitle}</p>}
        </div>
        {badgeText && (
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
            {badgeText}
          </span>
        )}
      </div>

      <div>{children}</div>
    </div>
  );
};

export default ChartCard;
