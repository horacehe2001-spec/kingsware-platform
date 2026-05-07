import { AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react';

import { Card } from '@/components/ui/card';
import type { RiskPoint } from '@/data/types';
import { riskBgClass, severityLabel } from '@/lib/score';
import { cn } from '@/lib/utils';

const SEVERITY_ICON = {
  low: ShieldCheck,
  medium: ShieldAlert,
  high: AlertTriangle,
  critical: AlertTriangle,
} as const;

export function RiskPointsList({ points }: { points: RiskPoint[] }) {
  return (
    <Card className="p-0">
      <header className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight">核心风险点</h2>
          <span className="font-mono text-[11px] text-muted-foreground">
            {points.length} 项 · 按严重性排序
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          由 LE-A08 风险地图 + LE-A10 授信结论 Agent 综合生成（个体户由 SP-A07 + SP-A08）
        </p>
      </header>
      <ul className="divide-y divide-border">
        {points.map((p, idx) => {
          const Icon = SEVERITY_ICON[p.severity];
          return (
            <li key={p.id} className="px-4 py-3.5">
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className={cn(
                      'flex size-7 items-center justify-center rounded-md border',
                      riskBgClass(p.severity),
                    )}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    #{(idx + 1).toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={cn(
                        'rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                        riskBgClass(p.severity),
                      )}
                    >
                      {severityLabel(p.severity)}
                    </span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {p.category}
                    </span>
                    <span className="ml-auto flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                      触发 Agent:{' '}
                      {p.triggeredBy.map((id) => (
                        <span
                          key={id}
                          className="rounded bg-ai-from/10 px-1 py-0.5 text-ai-from"
                        >
                          {id}
                        </span>
                      ))}
                    </span>
                  </div>
                  <h3 className="mt-1.5 text-[13px] font-semibold leading-snug">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                    {p.description}
                  </p>

                  <div className="mt-2.5 grid gap-2 rounded-md border border-dashed border-border bg-muted/30 p-2.5 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        数据证据
                      </p>
                      <p className="mt-0.5 font-mono text-[10.5px] leading-snug text-foreground/80">
                        {p.evidence}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        建议
                      </p>
                      <p className="mt-0.5 text-[11px] leading-snug text-foreground/90">
                        {p.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
