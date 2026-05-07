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
  agentId: string;
  name: string;
  avgMs: number;
  invocations: number;
}

export function AgentPerfChart({ data }: { data: DataPoint[] }) {
  // 转成秒并保留 1 位小数
  const chartData = data.map((d) => ({
    ...d,
    avgSec: +(d.avgMs / 1000).toFixed(1),
    label: `${d.agentId} ${d.name.slice(0, 6)}`,
  }));

  return (
    <div className="h-[320px] w-full">
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
              tickFormatter={(v) => `${v}s`}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 10, fill: 'oklch(0.5 0.04 257)' }}
              stroke="oklch(0.85 0.01 257)"
              width={140}
            />
            <Tooltip
              contentStyle={{
                fontSize: 11,
                borderRadius: 6,
                border: '1px solid oklch(0.92 0.01 257)',
              }}
              formatter={(value, name, item) => {
                const payload = (item as { payload?: DataPoint }).payload;
                if (name === '平均耗时')
                  return [
                    `${value}s · ${payload?.invocations.toLocaleString('zh-CN') ?? 0} 次调用`,
                    name as string,
                  ];
                return [String(value), name as string];
              }}
            />
            <Bar
              dataKey="avgSec"
              name="平均耗时"
              fill="oklch(0.55 0.21 263)"
              radius={[0, 3, 3, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ClientOnly>
    </div>
  );
}
