'use client';

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface SourcePieChartProps {
  data: { source: string; count: number }[];
  colors: string[];
}

export default function SourcePieChart({ data, colors }: SourcePieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={4}
          dataKey="count"
          nameKey="source"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ backgroundColor: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px', color: '#EDEDED' }}
          labelStyle={{ color: '#A0A0A0' }}
        />
        <Legend wrapperStyle={{ fontSize: '11px', color: '#A0A0A0' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
