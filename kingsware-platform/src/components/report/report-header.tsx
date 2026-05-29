'use client';

import {
  Bot,
  Building2,
  Clock3,
  Download,
  KeyRound,
  Printer,
  Replace,
  Share2,
  ShieldCheck,
  Sparkles,
  Store,
} from 'lucide-react';
import { toast } from 'sonner';

import { RoleGate } from '@/components/shared/role-gate';
import { ScoreBadge } from '@/components/shared/score-badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { gradeToLabel } from '@/data/analysis-labels';
import type { Customer, DueDiligenceReport } from '@/data/types';
import { formatAmount } from '@/lib/format';
import { cn } from '@/lib/utils';

interface ReportHeaderProps {
  customer: Customer;
  report: DueDiligenceReport;
}

export function ReportHeader({ customer, report }: ReportHeaderProps) {
  const isLE = customer.type === 'legal-entity';

  // 一票否决：从 report.oneVoteVeto 实时计算
  const vetoTotal = report.oneVoteVeto.length;
  const vetoTriggered = report.oneVoteVeto.filter((v) => v.triggered).length;
  const vetoPassed = vetoTotal - vetoTriggered;
  const vetoAllClear = vetoTriggered === 0;

  // Agent / API 总数：从 agentStates 实时统计
  const totalAgents = report.agentStates.length;
  const totalApiCalls = report.agentStates.reduce((s, st) => s + (st.apiCalls ?? 0), 0);

  // 真实耗时：max(finishedAt) - min(startedAt)
  const elapsedMs = (() => {
    const starts = report.agentStates
      .map((s) => (s.startedAt ? new Date(s.startedAt).getTime() : NaN))
      .filter((n) => !isNaN(n));
    const ends = report.agentStates
      .map((s) => (s.finishedAt ? new Date(s.finishedAt).getTime() : NaN))
      .filter((n) => !isNaN(n));
    if (!starts.length || !ends.length) return 0;
    return Math.max(...ends) - Math.min(...starts);
  })();
  const elapsedLabel =
    elapsedMs > 0
      ? elapsedMs >= 60000
        ? `${Math.floor(elapsedMs / 60000)}m ${Math.floor((elapsedMs % 60000) / 1000)}s`
        : `${Math.floor(elapsedMs / 1000)}s`
      : '—';

  return (
    <Card className="p-0">
      <div className="flex flex-wrap gap-4 p-4 md:p-5">
        {/* 客户头像 + 基本 */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex size-12 shrink-0 items-center justify-center rounded-lg border',
              isLE
                ? 'border-primary/20 bg-primary/5 text-primary'
                : 'border-grade-c/20 bg-grade-c-bg text-grade-c',
            )}
          >
            {isLE ? <Building2 className="size-6" /> : <Store className="size-6" />}
          </div>
          <div>
            <h1 className="font-display text-xl tracking-tight leading-tight">
              {customer.name}
            </h1>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              {customer.unifiedSocialCreditCode}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
              <span>{customer.industry}</span>
              <span>·</span>
              <span>{customer.region}</span>
              <span>·</span>
              <span>
                {isLE ? '法人代表 ' + customer.legalRepresentative : '经营者 ' + customer.ownerName}
              </span>
            </div>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <RoleGate permission="report.review-with-agent">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Bot className="size-3.5" />
              与 Agent 复核
            </Button>
          </RoleGate>
          <RoleGate permission="report.regenerate">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={async () => {
                toast('报告重新生成中…', {
                  description: '约需 60-90 秒，完成后将通知您',
                  duration: 3000,
                });
                await new Promise((r) => setTimeout(r, 2000));
                toast.success('报告已更新', {
                  description: '最新数据已同步至当前视图',
                });
              }}
            >
              <Replace className="size-3.5" />
              重新生成
            </Button>
          </RoleGate>
          <RoleGate permission="report.share">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={async () => {
                await navigator.clipboard.writeText(window.location.href);
                toast.success('链接已复制', {
                  description: '可粘贴发给审批同事',
                });
              }}
            >
              <Share2 className="size-3.5" />
              分享
            </Button>
          </RoleGate>
          <RoleGate permission="report.export">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => window.open(`/credit/reports/${customer.id}/print`, '_blank')}
            >
              <Printer className="size-3.5" />
              打印报告
            </Button>
          </RoleGate>
          <RoleGate permission="report.export">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={async () => {
                try {
                  const res = await fetch(`/api/reports/${customer.id}/export`);
                  if (!res.ok) throw new Error('export failed');
                  const blob = await res.blob();

                  const raw = res.headers.get('X-Filename');
                  const name = raw ? decodeURIComponent(raw) : `${report.reportNumber}.md`;

                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = name;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                } catch {
                  toast.error('导出失败', {
                    description: '请稍后重试或联系技术支持',
                  });
                }
              }}
            >
              <Download className="size-3.5" />
              导出报告
            </Button>
          </RoleGate>
        </div>
      </div>

      <Separator />

      {/* 指标条 */}
      <div className="grid grid-cols-2 gap-px bg-border/30 md:grid-cols-6">
        <Metric
          label="申请授信"
          value={formatAmount(customer.appliedAmount)}
          sub={customer.appliedProduct}
          highlight
        />
        <Metric
          label={isLE ? '综合表现' : '综合评分'}
          value={
            isLE ? (
              <span className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {report.creditGrade ? gradeToLabel(report.creditGrade) : '—'}
              </span>
            ) : (
              <ScoreBadge
                grade={report.creditGrade}
                score={report.totalScore}
                size="lg"
              />
            )
          }
          sub={`报告号 ${report.reportNumber}`}
        />
        <Metric
          label="报告状态"
          value={<StatusBadge status={report.status as never} />}
          sub={`进度 ${report.progress}%`}
        />
        <Metric
          label="一票否决"
          value={
            <span
              className={cn(
                'flex items-center gap-1.5',
                vetoAllClear ? 'text-grade-a' : 'text-grade-d',
              )}
            >
              <ShieldCheck className="size-4" />
              <span className="font-mono font-semibold">
                {vetoAllClear ? `${vetoPassed}/${vetoTotal} 通过` : `触发 ${vetoTriggered} 项`}
              </span>
            </span>
          }
          sub={vetoAllClear ? '所有底线项均合规' : `${vetoTotal - vetoTriggered} 项通过 / ${vetoTriggered} 项触发`}
        />
        <Metric
          label="数据授权"
          value={
            <span className="flex items-center gap-1.5 text-primary">
              <KeyRound className="size-4" />
              <span className="font-mono font-semibold">已签约</span>
            </span>
          }
          sub="H5 实人核身 · 电子签约"
        />
        <Metric
          label="生成"
          value={
            <span className="flex items-center gap-1.5">
              <Sparkles className="size-4 text-ai-from" />
              <span className="font-mono font-semibold">{elapsedLabel}</span>
            </span>
          }
          sub={`${totalAgents} Agent 协同 · ${totalApiCalls} API`}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock3 className="size-3" />
          最后更新 {customer.updatedAt}
        </span>
        <span>
          客户经理 <span className="text-foreground/80">{customer.manager}</span> ·{' '}
          {customer.branch}
        </span>
      </div>
    </Card>
  );
}

function Metric({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn('bg-card px-3 py-2.5', highlight && 'bg-primary/5')}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div
        className={cn(
          'mt-0.5 text-[13px] font-semibold leading-tight',
          highlight && 'text-primary',
        )}
      >
        {value}
      </div>
      {sub && <p className="mt-0.5 truncate text-[10.5px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
