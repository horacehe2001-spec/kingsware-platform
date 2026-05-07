'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ClientOnly } from '@/components/shared/client-only';

interface DataPoint {
  industry: string;
  count: number;
}

export function IndustryDistributionChart({ data }: { data: DataPoint[] }) {
  // 行业名称太长会挤，缩一缩
  const chartData = data.map((d) => ({
    ...d,
    label: d.industry.length > 8 ? d.industry.slice(0, 7) + '…' : d.industry,
  }));

  return (
    <div className="h-[280px] w-full">
      <ClientOnly>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 257)" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: 'oklch(0.5 0.04 257)' }}
              stroke="oklch(0.85 0.01 257)"
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 10, fill: 'oklch(0.5 0.04 257)' }}
              stroke="oklch(0.85 0.01 257)"
              width={90}
            />
            <Tooltip
              contentStyle={{
                fontSize: 11,
                borderRadius: 6,
                border: '1px solid oklch(0.92 0.01 257)',
              }}
              formatter={(value) => [String(value), '客户数']}
              labelFormatter={(_label, payload) => {
                const p = payload?.[0]?.payload as DataPoint | undefined;
                return p?.industry ?? '';
              }}
            />
            <Bar dataKey="count" fill="oklch(0.65 0.13 195)" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ClientOnly>
    </div>
  );
}
