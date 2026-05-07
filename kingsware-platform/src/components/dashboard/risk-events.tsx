import { AlertTriangle, ChevronRight, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

import { Card } from '@/components/ui/card';
import type { RiskEvent } from '@/data/types';
import { formatRelativeTime } from '@/lib/format';
import { riskBgClass } from '@/lib/score';
import { cn } from '@/lib/utils';

export function RiskEvents({ events }: { events: RiskEvent[] }) {
  return (
    <Card className="p-0">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-grade-d-bg text-grade-d">
            <ShieldAlert className="size-3.5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight">风险事件预警</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              事件驱动监控 · 30+ 维度
            </p>
          </div>
        </div>
        <Link
          href="/monitor"
          className="text-[12px] font-medium text-primary hover:underline"
        >
          全部
        </Link>
      </header>
      <ul className="divide-y divide-border">
        {events.map((event) => (
          <li
            key={event.id}
            className={cn(
              'group px-4 py-3 transition-colors hover:bg-muted/40',
              event.acknowledged && 'opacity-60',
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md border',
                  riskBgClass(event.level),
                )}
              >
                <AlertTriangle className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                      riskBgClass(event.level),
                    )}
                  >
                    {event.level === 'critical' ? '严重' : event.level === 'warning' ? '关注' : '提示'}
                  </span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {event.source}
                  </span>
                  <span className="ml-auto text-[10.5px] tabular-nums text-muted-foreground">
                    {formatRelativeTime(event.triggeredAt)}
                  </span>
                </div>
                <p className="mt-1.5 truncate text-[13px] font-medium text-foreground">
                  {event.title}
                </p>
                <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                  {event.customerName}
                </p>
                <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-muted-foreground/90">
                  {event.description}
                </p>
                {event.assignee && (
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="text-muted-foreground/60">负责人</span>
                    <span className="font-medium text-foreground/80">{event.assignee}</span>
                    {!event.acknowledged && (
                      <span className="ml-auto inline-flex items-center gap-0.5 font-semibold text-primary group-hover:underline">
                        立即处置
                        <ChevronRight className="size-3" />
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
