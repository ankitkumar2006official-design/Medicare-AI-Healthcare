import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

export default function VitalChart({
  title,
  data,
  dataKey,
  dataKey2 = null,
  color = '#0D9488',
  color2 = '#6366F1',
  unit = '',
  minTarget = null,
  maxTarget = null,
  yDomain = ['auto', 'auto'],
}) {
  const formattedData = (data || []).map((item, idx) => {
    const timeStr = item.timestamp
      ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : `#${idx + 1}`;
    return {
      ...item,
      timeLabel: timeStr,
    };
  });

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col h-72">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {minTarget !== null && maxTarget !== null && (
          <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
            Target: {minTarget} - {maxTarget} {unit}
          </span>
        )}
      </div>

      <div className="flex-1 w-full min-h-0">
        {formattedData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            Awaiting telemetry packets...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="timeLabel"
                tick={{ fontSize: 10, fill: '#64748B' }}
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1' }}
              />
              <YAxis
                domain={yDomain}
                tick={{ fontSize: 10, fill: '#64748B' }}
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  color: '#F8FAFC',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                }}
                formatter={(val, name) => [`${val} ${unit}`, name]}
              />

              {minTarget !== null && (
                <ReferenceLine y={minTarget} stroke="#F59E0B" strokeDasharray="3 3" />
              )}
              {maxTarget !== null && (
                <ReferenceLine y={maxTarget} stroke="#F59E0B" strokeDasharray="3 3" />
              )}

              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              {dataKey2 && (
                <Line
                  type="monotone"
                  dataKey={dataKey2}
                  stroke={color2}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
