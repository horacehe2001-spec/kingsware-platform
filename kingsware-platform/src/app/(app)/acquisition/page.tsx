import {
  CheckCircle2,
  Database,
  Filter,
  Loader2,
  Megaphone,
  PauseCircle,
  Target,
  Users2,
} from 'lucide-react';

import { AcquisitionFunnel } from '@/components/acquisition/acquisition-funnel';
import { Card } from '@/components/ui/card';
import {
  ACQUISITION_BATCHES,
  DATA_SOURCES,
  FUNNEL,
  type AcquisitionBatch,
} from '@/data/acquisition';
import { cn } from '@/lib/utils';

export default function AcquisitionPage() {
  const totalPool = FUNNEL[0].count;
  const inDiligence = FUNNEL[FUNNEL.length - 1].count;
  const conversionRate = ((inDiligence / totalPool) * 100).toFixed(2);

  const runningBatches = ACQUISITION_BATCHES.filter((b) => b.status === 'running').length;
  const monthPassed = ACQUISITION_BATCHES.reduce((s, b) => s + b.passedCount, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* 标题 */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl tracking-tight">批量获客</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            45 万目标客群分层预筛 · SDAFI Sense 阶段批量化 · 一票否决前置
          </p>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTile
          icon={<Target className="size-4" />}
          label="目标客群池"
          value={totalPool.toLocaleString('zh-CN')}
          unit="户"
          sub="个体户 35 万 + 法人 10 万"
          tone="primary"
        />
        <KpiTile
          icon={<Users2 className="size-4" />}
          label="本月触达"
          value={monthPassed.toLocaleString('zh-CN')}
          unit="户"
          sub={`${runningBatches} 个批次运行中`}
          tone="ai"
        />
        <KpiTile
          icon={<Filter className="size-4" />}
          label="终选转尽调"
          value={inDiligence.toLocaleString('zh-CN')}
          unit="户"
          sub={`从池子 ${conversionRate}% 收敛入口`}
          tone="grade-a"
        />
        <KpiTile
          icon={<Database className="size-4" />}
          label="数据源"
          value={DATA_SOURCES.length.toString()}
          unit="个"
          sub={`${DATA_SOURCES.filter((s) => s.status === 'active').length} 个在线 / ${
            DATA_SOURCES.filter((s) => s.status === 'maintenance').length
          } 个维护`}
          tone="grade-c"
        />
      </div>

      {/* 漏斗 */}
      <Card className="p-0">
        <header className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold tracking-tight">8 层预筛漏斗</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            从 45 万目标客群到 8,200 户进入尽调 · 整体收敛率 {conversionRate}%
          </p>
        </header>
        <AcquisitionFunnel stages={FUNNEL} />
      </Card>

      {/* 双栏：批次 + 数据源 */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* 批次任务 */}
        <Card className="p-0 lg:col-span-3">
          <header className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold tracking-tight">批次任务</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              共 {ACQUISITION_BATCHES.length} 个批次 · 客户经理调起 + 后台 SDAFI 引擎执行
            </p>
          </header>
          <ul className="divide-y divide-border">
            {ACQUISITION_BATCHES.map((b) => (
              <BatchRow key={b.id} batch={b} />
            ))}
          </ul>
        </Card>

        {/* 数据源 */}
        <Card className="p-0 lg:col-span-2">
          <header className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold tracking-tight">数据源</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              4 类数据源驱动获客漏斗各层
            </p>
          </header>
          <ul className="divide-y divide-border/60">
            {DATA_SOURCES.map((s) => (
              <li key={s.id} className="flex items-center gap-2.5 px-4 py-2.5">
                <div
                  className={cn(
                    'size-2 shrink-0 rounded-full',
                    s.status === 'active'
                      ? 'bg-grade-a'
                      : s.status === 'maintenance'
                        ? 'bg-grade-c'
                        : 'bg-muted-foreground/40',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-medium">{s.name}</p>
                  <p className="mt-0.5 truncate text-[10.5px] text-muted-foreground">
                    {s.category} · {s.provider}
                  </p>
                </div>
                <div className="text-right text-[10.5px] text-muted-foreground">
                  <span className="font-mono tabular-nums">{s.fields}</span> 字段
                  <p className="font-mono">{s.refreshFreq}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function KpiTile({
  icon,
  label,
  value,
  unit,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  sub: string;
  tone: 'primary' | 'ai' | 'grade-a' | 'grade-c';
}) {
  const cls = {
    primary: 'bg-primary/10 text-primary',
    ai: 'bg-ai-from/10 text-ai-from',
    'grade-a': 'bg-grade-a-bg text-grade-a',
    'grade-c': 'bg-grade-c-bg text-grade-c',
  }[tone];
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] font-medium text-muted-foreground">{label}</p>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="font-display text-3xl tabular-nums leading-none">
              {value}
            </span>
            {unit && <span className="text-[12px] text-muted-foreground">{unit}</span>}
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">{sub}</p>
        </div>
        <div className={`flex size-9 items-center justify-center rounded-md ${cls}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

const STATUS_META: Record<
  AcquisitionBatch['status'],
  {
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
    cls: string;
  }
> = {
  queued: {
    label: '排队中',
    Icon: Loader2,
    cls: 'text-muted-foreground/70',
  },
  running: {
    label: '运行中',
    Icon: Loader2,
    cls: 'text-ai-from animate-spin',
  },
  completed: {
    label: '已完成',
    Icon: CheckCircle2,
    cls: 'text-grade-a',
  },
  paused: {
    label: '已暂停',
    Icon: PauseCircle,
    cls: 'text-grade-c',
  },
};

function BatchRow({ batch }: { batch: AcquisitionBatch }) {
  const m = STATUS_META[batch.status];
  const passRate = batch.inputCount
    ? ((batch.passedCount / batch.inputCount) * 100).toFixed(1)
    : '0';
  return (
    <li className="px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40">
          <Megaphone className="size-3.5 text-foreground/70" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[12.5px] font-semibold">{batch.name}</span>
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold',
                batch.status === 'running'
                  ? 'border-ai-from/30 bg-ai-from/10 text-ai-from'
                  : batch.status === 'completed'
                    ? 'border-grade-a/20 bg-grade-a-bg text-grade-a'
                    : batch.status === 'paused'
                      ? 'border-grade-c/20 bg-grade-c-bg text-grade-c'
                      : 'border-border bg-muted text-muted-foreground',
              )}
            >
              <m.Icon className={cn('size-3 shrink-0', m.cls)} />
              {m.label}
            </span>
          </div>
          <p className="mt-0.5 text-[10.5px] text-muted-foreground">
            {batch.segment === 'legal-entity' ? '法人小微' : '个体工商户'} · {batch.region} ·{' '}
            {batch.owner}
          </p>
          {/* 进度条 */}
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full transition-all duration-500',
                  batch.status === 'completed'
                    ? 'bg-grade-a'
                    : batch.status === 'running'
                      ? 'ai-gradient'
                      : batch.status === 'paused'
                        ? 'bg-grade-c'
                        : 'bg-muted-foreground/30',
                )}
                style={{ width: `${batch.progress}%` }}
              />
            </div>
            <span className="font-mono text-[10.5px] tabular-nums text-muted-foreground">
              {batch.progress}%
            </span>
          </div>
          {/* 数字 */}
          <div className="mt-1.5 flex items-center gap-3 text-[10.5px] text-muted-foreground">
            <span>
              输入{' '}
              <span className="font-mono tabular-nums text-foreground/80">
                {batch.inputCount.toLocaleString('zh-CN')}
              </span>
            </span>
            <span>
              通过{' '}
              <span className="font-mono tabular-nums text-foreground/80">
                {batch.passedCount.toLocaleString('zh-CN')}
              </span>
            </span>
            <span>
              通过率{' '}
              <span className="font-mono tabular-nums text-foreground/80">
                {passRate}%
              </span>
            </span>
            {batch.estimatedCompletion && (
              <span className="ml-auto font-mono text-muted-foreground/70">
                预计 {batch.estimatedCompletion.slice(11, 16)} 完成
              </span>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
