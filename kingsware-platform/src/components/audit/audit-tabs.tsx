'use client';

import { CheckCircle2, Loader2, Search, ShieldX, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type {
  AgentSignalLogRow,
  CycleLogRow,
  DataSnapshotRow,
  ImproveLogRow,
} from '@/data/audit';
import { cn } from '@/lib/utils';

interface Props {
  cycleLog: CycleLogRow[];
  signalLog: AgentSignalLogRow[];
  improveLog: ImproveLogRow[];
  snapshots: DataSnapshotRow[];
}

export function AuditTabs({ cycleLog, signalLog, improveLog, snapshots }: Props) {
  const [q, setQ] = useState('');

  // 全局搜索（覆盖 customer 名 / id / agent id / hash 等）
  const matches = (s: string) => s.toLowerCase().includes(q.trim().toLowerCase());
  const fCycle = useMemo(
    () =>
      !q
        ? cycleLog
        : cycleLog.filter(
            (r) =>
              matches(r.customerName) ||
              matches(r.customerId) ||
              matches(r.agentId) ||
              matches(r.cycleId),
          ),
    [cycleLog, q],
  );
  const fSignal = useMemo(
    () =>
      !q
        ? signalLog
        : signalLog.filter(
            (r) =>
              matches(r.customerName) ||
              matches(r.customerId) ||
              matches(r.fromAgent) ||
              matches(r.detail),
          ),
    [signalLog, q],
  );
  const fImprove = useMemo(
    () =>
      !q
        ? improveLog
        : improveLog.filter(
            (r) =>
              matches(r.agentTarget) ||
              matches(r.description) ||
              matches(r.approver),
          ),
    [improveLog, q],
  );
  const fSnap = useMemo(
    () =>
      !q
        ? snapshots
        : snapshots.filter(
            (r) =>
              matches(r.customerName) ||
              matches(r.customerId) ||
              matches(r.snapshotId) ||
              matches(r.fieldHashSample),
          ),
    [snapshots, q],
  );

  return (
    <Card className="p-0">
      <Tabs defaultValue="cycle" className="w-full">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
          <TabsList className="h-9 bg-muted/60">
            <TabsTrigger value="cycle">
              cycle_log
              <span className="ml-1.5 rounded bg-muted-foreground/15 px-1.5 py-0.5 text-[10px] font-mono">
                {cycleLog.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="signal">
              agent_signal_log
              <span className="ml-1.5 rounded bg-muted-foreground/15 px-1.5 py-0.5 text-[10px] font-mono">
                {signalLog.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="improve">
              improve_log
              <span className="ml-1.5 rounded bg-muted-foreground/15 px-1.5 py-0.5 text-[10px] font-mono">
                {improveLog.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="snapshot">
              数据池快照
              <span className="ml-1.5 rounded bg-muted-foreground/15 px-1.5 py-0.5 text-[10px] font-mono">
                {snapshots.length}
              </span>
            </TabsTrigger>
          </TabsList>
          <div className="relative ml-auto w-[300px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索客户 / cycle_id / Agent / hash"
              className="h-8 pl-9 text-[12px]"
            />
          </div>
        </div>

        <TabsContent value="cycle" className="m-0">
          <CycleLogTable rows={fCycle} />
        </TabsContent>
        <TabsContent value="signal" className="m-0">
          <SignalLogTable rows={fSignal} />
        </TabsContent>
        <TabsContent value="improve" className="m-0">
          <ImproveLogTable rows={fImprove} />
        </TabsContent>
        <TabsContent value="snapshot" className="m-0">
          <SnapshotsTable rows={fSnap} />
        </TabsContent>
      </Tabs>
    </Card>
  );
}

// ─── cycle_log 表 ──────────────────────────────────
function CycleLogTable({ rows }: { rows: CycleLogRow[] }) {
  if (rows.length === 0) return <Empty />;
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/30">
          <TableHead className="pl-4 text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
            cycle_id / 客户
          </TableHead>
          <TableHead className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
            Agent
          </TableHead>
          <TableHead className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
            版本
          </TableHead>
          <TableHead className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
            状态 / 耗时
          </TableHead>
          <TableHead className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
            API / Token
          </TableHead>
          <TableHead className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
            产物
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="pl-4">
              <p className="font-mono text-[11px] font-semibold">{r.cycleId}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {r.customerName}
              </p>
            </TableCell>
            <TableCell className="font-mono text-[11.5px]">{r.agentId}</TableCell>
            <TableCell className="text-[11px] text-muted-foreground">
              <p className="font-mono">{r.agentVersion}</p>
              <p className="mt-0.5 font-mono text-[10px]">{r.modelVersion}</p>
            </TableCell>
            <TableCell>
              <CycleStatus status={r.status} />
              <p className="mt-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                {(r.durationMs / 1000).toFixed(1)}s
              </p>
            </TableCell>
            <TableCell>
              <p className="font-mono text-[11px] tabular-nums">{r.apiCalls} 接口</p>
              <p className="mt-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                {r.tokenUsage.toLocaleString('zh-CN')} tk
              </p>
            </TableCell>
            <TableCell>
              <p className="truncate font-mono text-[10.5px] text-muted-foreground">
                {r.outputRef}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                {r.startedAt}
              </p>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function CycleStatus({ status }: { status: CycleLogRow['status'] }) {
  const map = {
    success: {
      Icon: CheckCircle2,
      cls: 'text-grade-a',
      label: '成功',
    },
    'critic-rejected': {
      Icon: ShieldX,
      cls: 'text-grade-c',
      label: 'Critic 退回',
    },
    failed: {
      Icon: XCircle,
      cls: 'text-grade-d',
      label: '失败',
    },
    running: {
      Icon: Loader2,
      cls: 'text-ai-from animate-spin',
      label: '运行中',
    },
  } as const;
  const m = map[status];
  return (
    <span className={cn('inline-flex items-center gap-1 text-[11.5px] font-medium', m.cls)}>
      <m.Icon className="size-3" />
      {m.label}
    </span>
  );
}

// ─── agent_signal_log 表 ───────────────────────────
const SIGNAL_LABEL: Record<AgentSignalLogRow['signalType'], string> = {
  authorization: '授权',
  'snapshot-frozen': '快照冻结',
  'critic-pass': 'Critic 通过',
  'critic-reject': 'Critic 退回',
  'veto-triggered': '一票否决',
  'human-handoff': '转人工',
};
const SIGNAL_TONE: Record<AgentSignalLogRow['signalType'], string> = {
  authorization: 'bg-grade-c-bg text-grade-c border-grade-c/20',
  'snapshot-frozen': 'bg-primary/10 text-primary border-primary/20',
  'critic-pass': 'bg-grade-a-bg text-grade-a border-grade-a/20',
  'critic-reject': 'bg-grade-c-bg text-grade-c border-grade-c/30',
  'veto-triggered': 'bg-grade-d-bg text-grade-d border-grade-d/20',
  'human-handoff': 'bg-muted text-muted-foreground border-border',
};

function SignalLogTable({ rows }: { rows: AgentSignalLogRow[] }) {
  if (rows.length === 0) return <Empty />;
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/30">
          <TableHead className="pl-4 text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
            信号类型 / 客户
          </TableHead>
          <TableHead className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
            发起 → 接收
          </TableHead>
          <TableHead className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
            主体
          </TableHead>
          <TableHead className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
            详情
          </TableHead>
          <TableHead className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
            时间
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="pl-4">
              <span
                className={cn(
                  'inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold',
                  SIGNAL_TONE[r.signalType],
                )}
              >
                {SIGNAL_LABEL[r.signalType]}
              </span>
              <p className="mt-1 text-[11px] text-muted-foreground">{r.customerName}</p>
            </TableCell>
            <TableCell className="font-mono text-[11px]">
              <span>{r.fromAgent}</span>
              {r.toAgent && (
                <>
                  <span className="mx-1 text-muted-foreground">→</span>
                  <span>{r.toAgent}</span>
                </>
              )}
            </TableCell>
            <TableCell className="text-[11px] text-muted-foreground">
              {r.subjectType}
            </TableCell>
            <TableCell className="max-w-[460px]">
              <p className="line-clamp-2 text-[11.5px] leading-relaxed">{r.detail}</p>
            </TableCell>
            <TableCell className="font-mono text-[10.5px] text-muted-foreground">
              {r.occurredAt}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ─── improve_log 表 ────────────────────────────────
const CHANGE_TYPE_LABEL: Record<ImproveLogRow['changeType'], string> = {
  prompt: 'Prompt',
  threshold: '阈值',
  weight: '权重',
  rule: '规则',
};
const CHANGE_TYPE_TONE: Record<ImproveLogRow['changeType'], string> = {
  prompt: 'bg-ai-from/10 text-ai-from border-ai-from/20',
  threshold: 'bg-grade-c-bg text-grade-c border-grade-c/20',
  weight: 'bg-grade-b-bg text-grade-b border-grade-b/20',
  rule: 'bg-grade-d-bg text-grade-d border-grade-d/20',
};

function ImproveLogTable({ rows }: { rows: ImproveLogRow[] }) {
  if (rows.length === 0) return <Empty />;
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/30">
          <TableHead className="pl-4 text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
            类型 / 目标
          </TableHead>
          <TableHead className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
            变更内容
          </TableHead>
          <TableHead className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
            触发原因
          </TableHead>
          <TableHead className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
            审批 / 上线
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="pl-4">
              <span
                className={cn(
                  'inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold',
                  CHANGE_TYPE_TONE[r.changeType],
                )}
              >
                {CHANGE_TYPE_LABEL[r.changeType]}
              </span>
              <p className="mt-1 font-mono text-[11px]">{r.agentTarget}</p>
              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                {r.version}
              </p>
            </TableCell>
            <TableCell className="max-w-[380px]">
              <p className="line-clamp-2 text-[11.5px] leading-relaxed">
                {r.description}
              </p>
            </TableCell>
            <TableCell className="max-w-[280px]">
              <p className="line-clamp-2 text-[11px] text-muted-foreground">
                {r.trigger}
              </p>
            </TableCell>
            <TableCell>
              <p className="text-[11.5px] font-medium">{r.approver}</p>
              <p className="mt-0.5 font-mono text-[10.5px] text-muted-foreground">
                批 {r.approvedAt.slice(0, 10)}
              </p>
              <p className="font-mono text-[10.5px] text-muted-foreground">
                上线 {r.appliedAt.slice(0, 10)}
              </p>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ─── 数据池快照表 ──────────────────────────────────
function SnapshotsTable({ rows }: { rows: DataSnapshotRow[] }) {
  if (rows.length === 0) return <Empty />;
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/30">
          <TableHead className="pl-4 text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
            snapshot_id
          </TableHead>
          <TableHead className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
            客户
          </TableHead>
          <TableHead className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
            数据池
          </TableHead>
          <TableHead className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
            字段数 / 接口数
          </TableHead>
          <TableHead className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
            字段哈希（前缀）
          </TableHead>
          <TableHead className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
            数据时点
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="pl-4 font-mono text-[11px]">{r.snapshotId}</TableCell>
            <TableCell className="text-[11.5px]">
              {r.customerName}
              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                {r.customerId}
              </p>
            </TableCell>
            <TableCell>
              <span
                className={cn(
                  'inline-block rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold',
                  r.pool === 'device_pool'
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-grade-b-bg text-grade-b border-grade-b/20',
                )}
              >
                {r.pool}
              </span>
            </TableCell>
            <TableCell>
              <p className="font-mono text-[11px] tabular-nums">{r.fieldCount} 字段</p>
              <p className="mt-0.5 font-mono text-[10.5px] tabular-nums text-muted-foreground">
                {r.apiSourceCount} API 来源
              </p>
            </TableCell>
            <TableCell className="font-mono text-[11px]">{r.fieldHashSample}…</TableCell>
            <TableCell className="font-mono text-[10.5px] text-muted-foreground">
              {r.observedAt}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Empty() {
  return (
    <div className="px-4 py-12 text-center text-[12px] text-muted-foreground">
      没有匹配的记录
    </div>
  );
}
