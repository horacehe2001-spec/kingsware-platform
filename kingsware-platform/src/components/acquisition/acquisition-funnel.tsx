import { ChevronRight } from 'lucide-react';

import type { FunnelStage } from '@/data/acquisition';
import { cn } from '@/lib/utils';

/**
 * 自定义漏斗组件（不依赖 recharts FunnelChart，因为它的视觉对中文不友好）。
 * 每行宽度按当前阶段 count / 第一阶段 count 比例展示。
 */
export function AcquisitionFunnel({ stages }: { stages: FunnelStage[] }) {
  const max = stages[0]?.count ?? 1;

  return (
    <div className="space-y-1 px-4 py-4">
      {stages.map((s, i) => {
        const widthPct = Math.max(10, (s.count / max) * 100);
        const isFirst = i === 0;
        const isLast = i === stages.length - 1;
        return (
          <div key={s.key} className="flex items-stretch gap-3">
            {/* 数据栏 */}
            <div className="w-[120px] shrink-0 text-right">
              <p className="font-display text-[18px] tabular-nums leading-tight">
                {s.count.toLocaleString('zh-CN')}
              </p>
              <p className="text-[10px] text-muted-foreground">户</p>
              {!isFirst && (
                <p
                  className={cn(
                    'mt-0.5 inline-block rounded px-1.5 py-0.5 font-mono text-[10px] tabular-nums',
                    s.passRate >= 75
                      ? 'bg-grade-a-bg text-grade-a'
                      : s.passRate >= 50
                        ? 'bg-grade-b-bg text-grade-b'
                        : s.passRate >= 30
                          ? 'bg-grade-c-bg text-grade-c'
                          : 'bg-grade-d-bg text-grade-d',
                  )}
                >
                  {s.passRate.toFixed(1)}%
                </p>
              )}
            </div>
            {/* 阶段块 */}
            <div className="flex-1">
              <div
                className={cn(
                  'group flex h-full items-center gap-2 overflow-hidden rounded-md border px-3 py-2 transition-all',
                  isFirst
                    ? 'border-primary/30 bg-primary/5'
                    : isLast
                      ? 'border-ai-from/40 bg-ai-from/5'
                      : 'border-border bg-card hover:border-primary/30 hover:bg-muted/40',
                )}
                style={{ width: `${widthPct}%`, minWidth: '40%' }}
              >
                <span
                  className={cn(
                    'inline-flex size-5 shrink-0 items-center justify-center rounded-md font-mono text-[10px] font-bold',
                    isFirst
                      ? 'bg-primary text-white'
                      : isLast
                        ? 'ai-gradient text-white'
                        : 'bg-muted text-muted-foreground',
                  )}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold leading-tight">{s.label}</p>
                  <p className="mt-0.5 truncate text-[10.5px] text-muted-foreground">
                    {s.description}
                  </p>
                </div>
                {!isLast && (
                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/40" />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
