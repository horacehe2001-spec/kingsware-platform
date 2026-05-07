import { ArrowLeftRight, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

import { Card } from '@/components/ui/card';
import type { CrossValidationPair } from '@/data/types';
import { cn } from '@/lib/utils';

const RESULT_CONFIG = {
  正常: {
    Icon: CheckCircle2,
    cls: 'text-grade-a bg-grade-a-bg border-grade-a/20',
  },
  关注: {
    Icon: AlertCircle,
    cls: 'text-grade-c bg-grade-c-bg border-grade-c/20',
  },
  异常: {
    Icon: AlertTriangle,
    cls: 'text-grade-d bg-grade-d-bg border-grade-d/20',
  },
};

export function CrossValidationCard({
  validations,
}: {
  validations: CrossValidationPair[];
}) {
  const abnormal = validations.filter((v) => v.result === '异常').length;
  const concern = validations.filter((v) => v.result === '关注').length;
  const normal = validations.filter((v) => v.result === '正常').length;

  return (
    <Card className="p-0">
      <header className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
              <ArrowLeftRight className="size-4 text-primary" />
              五对交叉验证
            </h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              由 LE-A07 交叉验证 Agent 输出 · 识别单维度评分难以察觉的造假信号
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="rounded bg-grade-a-bg px-1.5 py-0.5 font-semibold text-grade-a">
              {normal} 正常
            </span>
            <span className="rounded bg-grade-c-bg px-1.5 py-0.5 font-semibold text-grade-c">
              {concern} 关注
            </span>
            <span className="rounded bg-grade-d-bg px-1.5 py-0.5 font-semibold text-grade-d">
              {abnormal} 异常
            </span>
          </div>
        </div>
      </header>

      <ul className="divide-y divide-border">
        {validations.map((v) => {
          const cfg = RESULT_CONFIG[v.result];
          const Icon = cfg.Icon;
          return (
            <li key={v.id} className="px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1">
                  <span className="font-mono text-[11px] font-semibold">
                    {v.pair.split('×')[0].trim()}
                  </span>
                  <span className="text-[10px] text-muted-foreground">×</span>
                  <span className="font-mono text-[11px] font-semibold">
                    {v.pair.split('×')[1].trim()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10.5px] font-semibold',
                        cfg.cls,
                      )}
                    >
                      <Icon className="size-3" />
                      {v.result}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      偏差: <span className="font-mono">{v.deviation}</span>
                    </span>
                  </div>
                  <p className="mt-1 text-[11.5px] leading-snug text-foreground/85">
                    {v.riskImplication}
                  </p>
                  <div className="mt-1.5 grid gap-1 text-[10.5px] text-muted-foreground sm:grid-cols-2">
                    <span className="truncate">
                      <span className="text-muted-foreground/60">A:</span> {v.sourceA}
                    </span>
                    <span className="truncate">
                      <span className="text-muted-foreground/60">B:</span> {v.sourceB}
                    </span>
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
