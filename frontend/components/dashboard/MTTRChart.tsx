'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { analyticsApi } from '@/lib/api';
import { format, parseISO } from 'date-fns';
import type { MTTRDataPoint } from '@/lib/types';

interface MTTRChartProps {
  data?: MTTRDataPoint[];
  height?: number;
}

export default function MTTRChart({ data: propData, height = 300 }: MTTRChartProps) {
  const [data, setData] = useState<MTTRDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (propData) {
      setData(propData);
      setLoading(false);
    } else {
      analyticsApi.getMTTR()
        .then(setData)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [propData]);

  if (loading) {
    return (
      <div className="h-[300px] bg-pulseops-surface border border-pulseops-border rounded-xl animate-pulse flex items-center justify-center">
        <span className="text-xs text-pulseops-muted">Loading chart...</span>
      </div>
    );
  }

  const chartData = data.map(d => ({
    date: format(parseISO(d.date), 'MMM dd'),
    mttr: d.avg_mttr ? Math.round(d.avg_mttr / 60) : 0,
    incidents: d.incident_count,
  }));

  return (
    <div className="bg-pulseops-surface border border-pulseops-border rounded-xl p-5">
      <h3 className="text-sm font-medium text-pulseops-text mb-4">MTTR Trend (Last 30 Days)</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#A0A0A0', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#A0A0A0', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
            unit="m"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#141414',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#EDEDED',
            }}
            labelStyle={{ color: '#A0A0A0' }}
          />
          <Line
            type="monotone"
            dataKey="mttr"
            stroke="#00D4FF"
            strokeWidth={2}
            dot={{ fill: '#00D4FF', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, stroke: '#00D4FF', strokeWidth: 2, fill: '#0A0A0A' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
