import { cn } from '@/lib/utils';
import { gradeBadgeClass } from '@/lib/score';
import { gradeLabel } from '@/lib/format';
import type { CreditGrade } from '@/data/types';

interface ScoreBadgeProps {
  grade?: CreditGrade;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ScoreBadge({
  grade,
  score,
  size = 'md',
  showLabel = true,
  className,
}: ScoreBadgeProps) {
  const sizeClass = {
    sm: 'h-5 px-1.5 text-[10px]',
    md: 'h-6 px-2 text-[11px]',
    lg: 'h-7 px-2.5 text-xs',
  }[size];

  if (!grade) return <span className="text-muted-foreground text-xs">—</span>;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border font-semibold',
        sizeClass,
        gradeBadgeClass(grade),
        className,
      )}
    >
      <span className="font-mono">{grade}</span>
      {showLabel && <span>{gradeLabel(grade)}</span>}
      {typeof score === 'number' && (
        <span className="ml-0.5 font-mono tabular-nums opacity-80">
          · {score}
        </span>
      )}
    </span>
  );
}
