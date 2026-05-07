import { cn } from '@/lib/utils';
import { statusLabel } from '@/lib/format';
import type { ApprovalStatus } from '@/data/types';

const STATUS_CLASSES: Record<ApprovalStatus, string> = {
  draft: 'bg-muted text-muted-foreground border-border',
  'in-progress': 'bg-grade-b-bg text-grade-b border-grade-b/20',
  'pending-review': 'bg-grade-c-bg text-grade-c border-grade-c/20',
  approved: 'bg-grade-a-bg text-grade-a border-grade-a/20',
  rejected: 'bg-grade-d-bg text-grade-d border-grade-d/20',
  'on-hold': 'bg-muted text-muted-foreground border-border',
};

interface StatusBadgeProps {
  status: ApprovalStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium',
        STATUS_CLASSES[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {statusLabel(status)}
    </span>
  );
}
