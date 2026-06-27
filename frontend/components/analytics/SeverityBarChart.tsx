'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface SeverityBarChartProps {
  data: { name: string; critical: number; high: number; medium: number; low: number }[];
}

export default function SeverityBarChart({ data }: SeverityBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
        <XAxis dataKey="name" tick={{ fill: '#A0A0A0', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} />
        <YAxis tick={{ fill: '#A0A0A0', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} />
        <Tooltip
          contentStyle={{ backgroundColor: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px', color: '#EDEDED' }}
          labelStyle={{ color: '#A0A0A0' }}
        />
        <Legend wrapperStyle={{ fontSize: '11px', color: '#A0A0A0' }} />
        <Bar dataKey="critical" fill="#FF3B5C" stackId="a" />
        <Bar dataKey="high" fill="#FFB020" stackId="a" />
        <Bar dataKey="medium" fill="#00D4FF" stackId="a" />
        <Bar dataKey="low" fill="#00E5A0" stackId="a" />
      </BarChart>
    </ResponsiveContainer>
  );
}
