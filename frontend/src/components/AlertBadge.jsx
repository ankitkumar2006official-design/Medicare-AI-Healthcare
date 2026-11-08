import React from 'react';

export default function AlertBadge({ severity, category, status }) {
  const value = (severity || category || status || 'stable').toLowerCase();

  const colorMap = {
    critical: 'bg-rose-100 text-rose-700 border-rose-300 ring-rose-500/20',
    high: 'bg-orange-100 text-orange-700 border-orange-300 ring-orange-500/20',
    moderate: 'bg-amber-100 text-amber-700 border-amber-300 ring-amber-500/20',
    low: 'bg-sky-100 text-sky-700 border-sky-300 ring-sky-500/20',
    stable: 'bg-emerald-100 text-emerald-700 border-emerald-300 ring-emerald-500/20',
    triggered: 'bg-rose-100 text-rose-700 border-rose-300',
    acknowledged: 'bg-amber-100 text-amber-700 border-amber-300',
    escalated: 'bg-purple-100 text-purple-700 border-purple-300',
    resolved: 'bg-slate-100 text-slate-700 border-slate-300',
    online: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    offline: 'bg-slate-100 text-slate-600 border-slate-300',
  };

  const badgeClass = colorMap[value] || 'bg-slate-100 text-slate-700 border-slate-300';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${badgeClass}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-75"></span>
      {value}
    </span>
  );
}
