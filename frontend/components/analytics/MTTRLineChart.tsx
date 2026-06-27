'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface MTTRLineChartProps {
  data: { date: string; mttr: number }[];
}

export default function MTTRLineChart({ data }: MTTRLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
        <XAxis dataKey="date" tick={{ fill: '#A0A0A0', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} />
        <YAxis tick={{ fill: '#A0A0A0', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} unit="m" />
        <Tooltip
          contentStyle={{ backgroundColor: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px', color: '#EDEDED' }}
          labelStyle={{ color: '#A0A0A0' }}
        />
        <Line type="monotone" dataKey="mttr" stroke="#00D4FF" strokeWidth={2} dot={{ fill: '#00D4FF', r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
