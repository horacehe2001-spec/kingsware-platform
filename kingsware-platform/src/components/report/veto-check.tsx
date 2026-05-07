import { CheckCircle2, ShieldX, XCircle } from 'lucide-react';

import { Card } from '@/components/ui/card';
import type { DueDiligenceReport } from '@/data/types';
import { cn } from '@/lib/utils';

export function VetoCheck({ items }: { items: DueDiligenceReport['oneVoteVeto'] }) {
  const triggered = items.filter((i) => i.triggered).length;
  const allClear = triggered === 0;

  return (
    <Card className="p-0">
      <header className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <ShieldX className="size-4 text-grade-d" />
            一票否决项检查
          </h2>
          <span
            className={cn(
              'rounded-md border px-2 py-0.5 text-[11px] font-semibold',
              allClear
                ? 'bg-grade-a-bg text-grade-a border-grade-a/20'
                : 'bg-grade-d-bg text-grade-d border-grade-d/20',
            )}
          >
            {allClear ? `全部通过 (${items.length}/${items.length})` : `触发 ${triggered} 项`}
          </span>
        </div>
      </header>
      <ul className="grid gap-px bg-border/30 sm:grid-cols-2">
        {items.map((item, idx) => (
          <li
            key={idx}
            className={cn(
              'flex items-center gap-2.5 bg-card px-3 py-2.5 text-[12px]',
              item.triggered && 'bg-grade-d-bg/40',
            )}
          >
            {item.triggered ? (
              <XCircle className="size-4 shrink-0 text-grade-d" />
            ) : (
              <CheckCircle2 className="size-4 shrink-0 text-grade-a" />
            )}
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'font-medium leading-tight',
                  item.triggered && 'text-grade-d',
                )}
              >
                {item.item}
              </p>
              <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                {item.apiSource}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
