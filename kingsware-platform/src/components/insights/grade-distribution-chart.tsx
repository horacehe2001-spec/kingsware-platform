'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { ClientOnly } from '@/components/shared/client-only';

interface DataPoint {
  grade: string;
  count: number;
  color: string;
}

export function GradeDistributionChart({ data }: { data: DataPoint[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-[180px] w-full">
        <ClientOnly>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="grade"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={2}
                stroke="white"
                strokeWidth={1.5}
              >
                {data.map((d) => (
                  <Cell key={d.grade} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 6,
                  border: '1px solid oklch(0.92 0.01 257)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ClientOnly>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl tabular-nums leading-none">
            {total}
          </span>
          <span className="text-[10px] text-muted-foreground">户</span>
        </div>
      </div>

      <ul className="grid w-full grid-cols-2 gap-1.5 px-3 text-[11px]">
        {data.map((d) => (
          <li key={d.grade} className="flex items-center gap-1.5">
            <span
              className="size-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-muted-foreground">{d.grade}</span>
            <span className="ml-auto font-mono font-semibold tabular-nums">
              {d.count}
            </span>
            <span className="font-mono text-muted-foreground/70 tabular-nums">
              {total > 0 ? `${((d.count / total) * 100).toFixed(0)}%` : '—'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
