import React from 'react';
import { Activity, Heart, Wind, Thermometer, Droplet } from 'lucide-react';

export default function VitalGauge({
  type,
  label,
  value,
  unit,
  minBaseline,
  maxBaseline,
  isCritical = false,
  isWarning = false,
}) {
  const getIcon = () => {
    switch (type) {
      case 'heart_rate':
        return <Heart className="w-5 h-5 text-rose-500 animate-pulse" />;
      case 'spo2':
        return <Activity className="w-5 h-5 text-sky-500" />;
      case 'temp':
        return <Thermometer className="w-5 h-5 text-amber-500" />;
      case 'resp':
        return <Wind className="w-5 h-5 text-teal-500" />;
      case 'bp':
        return <Droplet className="w-5 h-5 text-indigo-500" />;
      default:
        return <Activity className="w-5 h-5 text-slate-500" />;
    }
  };

  const statusBg = isCritical
    ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-500/20'
    : isWarning
    ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-500/20'
    : 'bg-white border-slate-200';

  const statusValueColor = isCritical
    ? 'text-rose-600 font-bold'
    : isWarning
    ? 'text-amber-600 font-semibold'
    : 'text-slate-900 font-bold';

  return (
    <div className={`p-4 rounded-xl border transition-all shadow-sm ${statusBg}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
          {getIcon()}
          <span>{label}</span>
        </span>
        {(isCritical || isWarning) && (
          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${isCritical ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'}`}>
            {isCritical ? 'CRITICAL' : 'DEVIATION'}
          </span>
        )}
      </div>

      <div className="flex items-baseline space-x-1.5">
        <span className={`text-3xl font-mono tracking-tight ${statusValueColor}`}>
          {value !== null && value !== undefined && value !== 0 ? value : '--'}
        </span>
        <span className="text-xs font-medium text-slate-500">{unit}</span>
      </div>

      {(minBaseline !== undefined || maxBaseline !== undefined) && (
        <div className="mt-2 text-[11px] text-slate-600 flex justify-between items-center border-t border-slate-100 pt-1.5">
          <span>Target baseline:</span>
          <span className="font-mono text-slate-700">
            {minBaseline ?? '--'} - {maxBaseline ?? '--'} {unit}
          </span>
        </div>
      )}
    </div>
  );
}
