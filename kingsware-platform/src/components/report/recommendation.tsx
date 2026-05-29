'use client';

import { CircleCheck, FileSignature, Loader2, Stamp } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { RoleGate } from '@/components/shared/role-gate';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { DueDiligenceReport } from '@/data/types';
import { formatAmount } from '@/lib/format';
import { cn } from '@/lib/utils';

export function RecommendationCard({
  recommendation,
  analysisMode = false,
}: {
  recommendation: DueDiligenceReport['recommendation'];
  /** true = 纯分析版：去掉"建议批准/否决"决策措辞，改"供审批参考" */
  analysisMode?: boolean;
}) {
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  if (!recommendation) return null;

  const decisionColor = {
    建议批准: 'text-grade-a bg-grade-a-bg border-grade-a/20',
    有条件批准: 'text-grade-c bg-grade-c-bg border-grade-c/20',
    建议否决: 'text-grade-d bg-grade-d-bg border-grade-d/20',
  }[recommendation.decision];

  return (
    <Card className="p-0">
      <header className="border-b border-border bg-gradient-to-br from-primary/5 to-transparent px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <FileSignature className="size-4 text-primary" />
            {analysisMode ? '授信参考' : '授信结构建议'}
          </h2>
          <span
            className={cn(
              'rounded-md border px-2 py-1 text-[12px] font-semibold',
              analysisMode
                ? 'border-primary/20 bg-primary/10 text-primary'
                : decisionColor,
            )}
          >
            {analysisMode ? '供审批参考' : recommendation.decision}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          由 LE-A10 授信结论 Agent 输出 · {analysisMode ? '是否授信由银行审批人员独立判定' : '待审批官签批'}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-px bg-border/30 sm:grid-cols-4">
        <Field label={analysisMode ? '测算参考额度' : '建议金额'} value={formatAmount(recommendation.amount)} highlight />
        <Field label={analysisMode ? '参考期限' : '建议期限'} value={`${recommendation.term} 个月`} />
        <Field label={analysisMode ? '参考利率' : '建议利率'} value={recommendation.rate} />
        <Field label="担保方式" value={recommendation.guarantee} />
      </div>

      <div className="border-t border-border px-4 py-3">
        <p className="text-[11.5px] font-medium uppercase tracking-wider text-muted-foreground">
          关键风控条件
        </p>
        <ul className="mt-2 space-y-1.5">
          {recommendation.conditions.map((c, i) => (
            <li key={i} className="flex items-start gap-2 text-[12px]">
              <CircleCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <span className="text-foreground/90">{c}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-2 border-t border-border px-4 py-3">
        <RoleGate
          permission="report.reject"
          fallback={
            <p className="flex-1 text-center text-[11px] text-muted-foreground">
              当前角色无审批权限，仅供查看
            </p>
          }
        >
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            disabled={rejecting}
            onClick={async () => {
              setRejecting(true);
              await new Promise((r) => setTimeout(r, 800));
              toast.success('报告已退回', {
                description: '对应 Agent 将在下一轮重跑修正',
              });
              setRejecting(false);
            }}
          >
            {rejecting && <Loader2 className="size-3.5 animate-spin" />}
            退回修改
          </Button>
        </RoleGate>
        <RoleGate permission="report.approve">
          <Button
            size="sm"
            className="flex-1 gap-1.5"
            disabled={approving}
            onClick={async () => {
              setApproving(true);
              await new Promise((r) => setTimeout(r, 800));
              toast.success('签批通过', {
                description: '授信方案已批复，报告归档中',
              });
              setApproving(false);
            }}
          >
            {approving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Stamp className="size-3.5" />
            )}
            {approving ? '批复中…' : '签批通过'}
          </Button>
        </RoleGate>
      </div>
    </Card>
  );
}

function Field({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-card px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          'mt-0.5 font-mono text-[13px] font-semibold tabular-nums',
          highlight && 'text-primary',
        )}
      >
        {value}
      </p>
    </div>
  );
}
