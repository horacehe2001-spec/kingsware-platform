import { ArrowRight, Clock3 } from 'lucide-react';
import Link from 'next/link';

import { Card } from '@/components/ui/card';
import type { TodoItem } from '@/data/types';
import { formatRelativeTime, priorityLabel } from '@/lib/format';
import { cn } from '@/lib/utils';

const PRIORITY_CLASSES = {
  low: 'border-l-muted',
  medium: 'border-l-grade-c',
  high: 'border-l-grade-d',
};

const TYPE_CLASSES: Record<string, string> = {
  待复核: 'bg-grade-b-bg text-grade-b',
  待审批: 'bg-grade-c-bg text-grade-c',
  风险处置: 'bg-grade-d-bg text-grade-d',
  授权确认: 'bg-muted text-muted-foreground',
  贷后跟进: 'bg-grade-a-bg text-grade-a',
};

export function TodoList({ items }: { items: TodoItem[] }) {
  return (
    <Card className="p-0">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">待办事项</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            按优先级排序 · {items.length} 项
          </p>
        </div>
        <Link
          href="/tasks"
          className="text-[12px] font-medium text-primary hover:underline"
        >
          全部
        </Link>
      </header>
      <ul className="divide-y divide-border">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.link}
              className={cn(
                'group flex items-start gap-3 border-l-2 px-4 py-3 transition-colors hover:bg-muted/50',
                PRIORITY_CLASSES[item.priority],
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[10px] font-semibold',
                      TYPE_CLASSES[item.type],
                    )}
                  >
                    {item.type}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] uppercase tracking-wider',
                      item.priority === 'high'
                        ? 'text-grade-d'
                        : item.priority === 'medium'
                          ? 'text-grade-c'
                          : 'text-muted-foreground',
                    )}
                  >
                    {priorityLabel(item.priority)} 优先级
                  </span>
                </div>
                <p className="mt-1 truncate text-[13px] font-medium text-foreground">
                  {item.title}
                </p>
                <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                  {item.customerName}
                </p>
                <div className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground/80">
                  <Clock3 className="size-3" />
                  截止 {formatRelativeTime(item.dueAt)}
                </div>
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
