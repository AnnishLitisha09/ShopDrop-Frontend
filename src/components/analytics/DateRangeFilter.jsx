import React from 'react';

export const DateRangeFilter = ({ activePeriod, onSelectPeriod }) => {
  const periods = [
    { id: 'today', label: 'Today' },
    { id: '7days', label: 'Last 7 Days' },
    { id: '30days', label: 'Last 30 Days' },
    { id: 'month', label: 'This Month' },
  ];

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
      {periods.map((p) => {
        const isActive = activePeriod === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onSelectPeriod(p.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
              isActive
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800 font-bold'
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
};

export default DateRangeFilter;
