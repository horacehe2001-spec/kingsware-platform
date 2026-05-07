'use client';

import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

import { ClientOnly } from '@/components/shared/client-only';
import { Card } from '@/components/ui/card';
import type { KpiMetric } from '@/data/types';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  metric: KpiMetric;
  invertDelta?: boolean; // 对于"成本/不良"类，下降为好
}

export function KpiCard({ metric, invertDelta = false }: KpiCardProps) {
  const delta = metric.delta ?? 0;
  const isPositive = invertDelta ? delta < 0 : delta > 0;
  const isNeutral = delta === 0;
  const trendData = (metric.trend ?? []).map((v, i) => ({ i, v }));
  const chartColor = isPositive
    ? 'oklch(0.62 0.16 158)'
    : isNeutral
      ? 'oklch(0.5 0.04 257)'
      : 'oklch(0.6 0.22 22)';
  const gradId = `kpi-grad-${metric.key}`;

  return (
    <Card className="relative overflow-hidden p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[12px] font-medium text-muted-foreground">{metric.label}</p>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-2xl tabular-nums leading-none text-foreground">
              {typeof metric.value === 'number'
                ? metric.value.toLocaleString('zh-CN')
                : metric.value}
            </span>
            {metric.unit && (
              <span className="text-[12px] text-muted-foreground">{metric.unit}</span>
            )}
          </div>
        </div>

        {!isNeutral && (
          <div
            className={cn(
              'flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
              isPositive
                ? 'bg-grade-a-bg text-grade-a'
                : 'bg-grade-d-bg text-grade-d',
            )}
          >
            {delta > 0 ? (
              <ArrowUpRight className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            )}
            {Math.abs(delta).toFixed(1)}%
          </div>
        )}
      </div>

      {metric.deltaLabel && (
        <p className="mt-1 text-[11px] text-muted-foreground/80">{metric.deltaLabel}</p>
      )}

      {trendData.length > 0 && (
        <div className="mt-3 h-10 w-full">
          <ClientOnly>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trendData}
                margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColor} stopOpacity={0.32} />
                    <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={chartColor}
                  strokeWidth={1.6}
                  fill={`url(#${gradId})`}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ClientOnly>
        </div>
      )}
    </Card>
  );
}
