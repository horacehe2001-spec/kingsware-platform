'use client';

import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ClientOnly } from '@/components/shared/client-only';

interface DataPoint {
  date: string;
  total: number;
  passed: number;
  passRate: number;
}

export function TrendChart({ data }: { data: DataPoint[] }) {
  return (
    <div className="h-[280px] w-full">
      <ClientOnly>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 257)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'oklch(0.5 0.04 257)' }}
              stroke="oklch(0.85 0.01 257)"
              interval={3}
            />
            <YAxis
              yAxisId="count"
              tick={{ fontSize: 10, fill: 'oklch(0.5 0.04 257)' }}
              stroke="oklch(0.85 0.01 257)"
              tickFormatter={(v) => `${v}`}
            />
            <YAxis
              yAxisId="rate"
              orientation="right"
              tick={{ fontSize: 10, fill: 'oklch(0.5 0.04 257)' }}
              stroke="oklch(0.85 0.01 257)"
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                fontSize: 11,
                borderRadius: 6,
                border: '1px solid oklch(0.92 0.01 257)',
              }}
              formatter={(value, name) => {
                if (name === '通过率') return [`${value}%`, name as string];
                return [String(value), name as string];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line
              yAxisId="count"
              type="monotone"
              dataKey="total"
              name="总报告数"
              stroke="oklch(0.55 0.21 263)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="count"
              type="monotone"
              dataKey="passed"
              name="通过数"
              stroke="oklch(0.62 0.16 158)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="rate"
              type="monotone"
              dataKey="passRate"
              name="通过率"
              stroke="oklch(0.55 0.24 305)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ClientOnly>
    </div>
  );
}
