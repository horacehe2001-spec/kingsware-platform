'use client';

import {
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Sparkles,
  Store,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ScoreBadge } from '@/components/shared/score-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LE_AGENTS, SP_AGENTS } from '@/data/agents';
import { ALL_CUSTOMERS } from '@/data/customers';
import { SAMPLE_REPORTS } from '@/data/reports';
import type { AgentDefinition, AgentRunState, AgentStatus, Customer } from '@/data/types';
import { cn } from '@/lib/utils';

type Phase = 'form' | 'running' | 'done';

// 选可用客户：只有有 sample report 的 5 个客户能跑（其他客户跑完没报告可看）
const AVAILABLE_IDS = Object.keys(SAMPLE_REPORTS);

interface StageStep {
  /** SDAFI 阶段（1-6） */
  stage: number;
  label: string;
  desc: string;
  /** 这个阶段内 Agent 们的开始时间（ms），相对总流程起点 */
  startAt: number;
  /** 这个阶段持续时长（ms），用于推进 status running → success */
  durationMs: number;
}

/** 法人 5 阶段时序（Stage 6 FB/IM 是贷后，不参与本次报告生成） */
const LE_STEPS: StageStep[] = [
  { stage: 1, label: 'L0 编排层', desc: '一票否决前置 + 授权门控 + 数据池快照', startAt: 0, durationMs: 1500 },
  { stage: 2, label: 'L2 章节分析层', desc: '5 个 Agent 并行：工商 / 实控 / 行业 / 财务 / 履约', startAt: 1600, durationMs: 3500 },
  { stage: 3, label: 'L2.5 横向分析层', desc: '4 个 Agent 并行：评分 / 交叉验证 / 风险 / 还款', startAt: 5200, durationMs: 2200 },
  { stage: 4, label: 'L3 决策与质检层', desc: '决策 + 贷后设计 + Critic 回路', startAt: 7500, durationMs: 1800 },
  { stage: 5, label: 'Act 报告组装', desc: 'AC-01 渲染 docx + 推审批官', startAt: 9400, durationMs: 1200 },
];

/** 个体户 5 阶段时序（更快，因 14 Agent + 决策简单） */
const SP_STEPS: StageStep[] = [
  { stage: 1, label: 'L0 编排层', desc: '8 项一票否决 + 五步反欺诈门控 + 双主体快照', startAt: 0, durationMs: 1300 },
  { stage: 2, label: 'L2 章节分析层', desc: '5 个 Agent 并行：经营者 / 店铺 / 经济 / 反欺诈 / 个人信用', startAt: 1400, durationMs: 2800 },
  { stage: 3, label: 'L2.5 横向分析层', desc: '四维评分聚合', startAt: 4300, durationMs: 1200 },
  { stage: 4, label: 'L3 决策与质检层', desc: '风险地图 + 决策 + 失联监控配置', startAt: 5600, durationMs: 1500 },
  { stage: 5, label: 'Act 报告组装', desc: 'AC-01 渲染 docx + 推审批官', startAt: 7200, durationMs: 1000 },
];

const TOTAL_DURATION = (steps: StageStep[]) => {
  const last = steps[steps.length - 1];
  return last.startAt + last.durationMs;
};

export function NewDiligenceFlow() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('form');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tick, setTick] = useState(0); // ms 自启动以来
  const startedAtRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  const customers = useMemo(
    () => ALL_CUSTOMERS.filter((c) => AVAILABLE_IDS.includes(c.id)),
    [],
  );
  const selected = customers.find((c) => c.id === selectedId);
  const isLE = selected?.type === 'legal-entity';

  const agents: AgentDefinition[] = useMemo(() => {
    if (!selected) return [];
    return selected.type === 'legal-entity' ? LE_AGENTS : SP_AGENTS;
  }, [selected]);
  const steps = isLE ? LE_STEPS : SP_STEPS;
  const totalDuration = TOTAL_DURATION(steps);

  // 计算每个 Agent 在当前 tick 时刻的状态
  const liveStates: AgentRunState[] = useMemo(() => {
    if (!selected) return [];
    return agents.map((a): AgentRunState => {
      // FB-01 / IM-01 是贷后，本次跑不到
      if (a.id === 'FB-01' || a.id === 'IM-01') {
        return { agentId: a.id, status: 'queued' };
      }
      const step = steps.find((s) => s.stage === a.stage);
      if (!step) {
        return { agentId: a.id, status: 'queued' };
      }
      const stepStart = step.startAt;
      const stepEnd = step.startAt + step.durationMs;

      // 不同 Agent 的实际启动有点交错（前 200ms 内陆续启动）
      const idx = agents.filter((x) => x.stage === a.stage).indexOf(a);
      const stagger = idx * 80;
      const myStart = stepStart + stagger;
      const myDuration = step.durationMs - stagger;
      const myEnd = myStart + myDuration;

      let status: AgentStatus;
      if (tick < myStart) status = 'queued';
      else if (tick < myEnd) status = 'running';
      else status = 'success';

      return {
        agentId: a.id,
        status,
        startedAt: status !== 'queued' ? new Date(startedAtRef.current + myStart).toISOString() : undefined,
        finishedAt: status === 'success' ? new Date(startedAtRef.current + myEnd).toISOString() : undefined,
        durationMs: status === 'success' ? myDuration : undefined,
        apiCalls:
          status === 'success'
            ? a.id === 'SE-01'
              ? isLE ? 23 : 28
              : a.id.startsWith('LE-A') || a.id.startsWith('SP-A')
                ? 3 + Math.floor(((a.id.charCodeAt(a.id.length - 1) || 0) % 10))
                : 0
            : undefined,
      };
    });
  }, [agents, tick, isLE, selected, steps]);

  // 当前活跃阶段
  const activeStage = useMemo(() => {
    if (phase !== 'running') return 0;
    const s = [...steps].reverse().find((x) => tick >= x.startAt);
    return s?.stage ?? 0;
  }, [phase, tick, steps]);

  // 进度百分比
  const progressPct = phase === 'done' ? 100 : phase === 'running' ? Math.min(100, Math.round((tick / totalDuration) * 100)) : 0;

  // 启动动画
  useEffect(() => {
    if (phase !== 'running') return;
    startedAtRef.current = Date.now();
    const loop = () => {
      const elapsed = Date.now() - startedAtRef.current;
      setTick(elapsed);
      if (elapsed >= totalDuration) {
        setPhase('done');
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [phase, totalDuration]);

  const handleSubmit = () => {
    if (!selectedId) return;
    setTick(0);
    setPhase('running');
  };

  const handleReset = () => {
    setPhase('form');
    setTick(0);
    setSelectedId(null);
  };

  // 渲染分支
  if (phase === 'form') {
    return (
      <FormView
        customers={customers}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onSubmit={handleSubmit}
      />
    );
  }

  if (phase === 'done') {
    return (
      <DoneView
        customer={selected!}
        elapsedMs={totalDuration}
        liveStates={liveStates}
        onReset={handleReset}
        onView={() => router.push(`/credit/reports/${selected!.id}`)}
      />
    );
  }

  return (
    <RunningView
      customer={selected!}
      progressPct={progressPct}
      activeStage={activeStage}
      tick={tick}
      totalDuration={totalDuration}
      steps={steps}
      agents={agents}
      liveStates={liveStates}
    />
  );
}

// ─── 表单视图 ─────────────────────────────────

function FormView({
  customers,
  selectedId,
  onSelect,
  onSubmit,
}: {
  customers: Customer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSubmit: () => void;
}) {
  const leCustomers = customers.filter((c) => c.type === 'legal-entity');
  const spCustomers = customers.filter((c) => c.type === 'sole-proprietor');

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <Building2 className="size-4 text-primary" />
          <h2 className="text-[14px] font-semibold tracking-tight">法人小微企业（5 维评分 / 16 个 Agent）</h2>
          <span className="ml-auto text-[11px] text-muted-foreground">35-50 秒 · 90 个接口 · 93 张表</span>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {leCustomers.map((c) => (
            <CustomerCard key={c.id} c={c} selected={c.id === selectedId} onSelect={onSelect} />
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2">
          <Store className="size-4 text-primary" />
          <h2 className="text-[14px] font-semibold tracking-tight">个体工商户（4 维评分 / 14 个 Agent）</h2>
          <span className="ml-auto text-[11px] text-muted-foreground">8-15 秒 · 86 个接口 · 62 张表</span>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {spCustomers.map((c) => (
            <CustomerCard key={c.id} c={c} selected={c.id === selectedId} onSelect={onSelect} />
          ))}
        </div>
      </Card>

      <div className="sticky bottom-4 z-10 flex items-center justify-between rounded-lg border border-border bg-card/95 p-3 shadow-md backdrop-blur">
        <p className="text-[12px] text-muted-foreground">
          {selectedId ? '已选定客户，点击右侧按钮启动 16 个 Agent 协同' : '请先在上方选择一个客户'}
        </p>
        <Button size="lg" onClick={onSubmit} disabled={!selectedId} className="gap-2">
          <Sparkles className="size-4" />
          开始尽调
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function CustomerCard({
  c,
  selected,
  onSelect,
}: {
  c: Customer;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const isLE = c.type === 'legal-entity';
  return (
    <button
      type="button"
      onClick={() => onSelect(c.id)}
      className={cn(
        'group flex flex-col gap-2 rounded-lg border bg-card p-3 text-left transition-all',
        selected
          ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
          : 'border-border hover:border-primary/50 hover:shadow-sm',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold">{c.name}</p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {isLE ? `${(c as { legalRepresentative: string }).legalRepresentative} · ${c.industry}` : `${(c as { ownerName: string }).ownerName} · ${(c as { shopType: string }).shopType}`}
          </p>
        </div>
        {c.creditGrade && <ScoreBadge grade={c.creditGrade} size="sm" />}
      </div>
      <div className="flex items-center justify-between gap-2 text-[10.5px] text-muted-foreground">
        <span>{c.region}</span>
        <span className="font-mono tabular-nums">{c.appliedAmount.toLocaleString('zh-CN')} 万元</span>
      </div>
    </button>
  );
}

// ─── 运行视图 ─────────────────────────────────

function RunningView({
  customer,
  progressPct,
  activeStage,
  tick,
  totalDuration,
  steps,
  agents,
  liveStates,
}: {
  customer: Customer;
  progressPct: number;
  activeStage: number;
  tick: number;
  totalDuration: number;
  steps: StageStep[];
  agents: AgentDefinition[];
  liveStates: AgentRunState[];
}) {
  const stateMap = new Map(liveStates.map((s) => [s.agentId, s]));
  const elapsedSec = (tick / 1000).toFixed(1);
  const totalSec = (totalDuration / 1000).toFixed(0);

  // 按 stage 分组
  const byStage = new Map<number, AgentDefinition[]>();
  for (const a of agents) {
    if (!byStage.has(a.stage)) byStage.set(a.stage, []);
    byStage.get(a.stage)!.push(a);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 客户信息条 */}
      <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            {customer.type === 'legal-entity' ? <Building2 className="size-5" /> : <Store className="size-5" />}
          </div>
          <div>
            <p className="text-[14px] font-semibold">{customer.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {customer.type === 'legal-entity' ? '法人小微 · 16 Agent' : '个体工商户 · 14 Agent'} · 申请 {customer.appliedAmount} 万元
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[12px]">
          <span className="font-mono">
            <span className="font-display text-2xl font-semibold tabular-nums text-primary">{elapsedSec}</span>
            <span className="ml-1 text-muted-foreground">/ {totalSec} 秒</span>
          </span>
          <span className="font-mono">
            <span className="font-display text-2xl font-semibold tabular-nums text-emerald-600">{progressPct}%</span>
            <span className="ml-1 text-muted-foreground">完成</span>
          </span>
        </div>
      </Card>

      {/* 进度条 */}
      <Card className="overflow-hidden p-0">
        <div className="relative h-2 w-full overflow-hidden bg-muted">
          <div
            className="ai-gradient absolute inset-y-0 left-0 transition-all duration-200 ease-linear"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {/* 阶段时间轴 */}
        <div className="grid grid-cols-5 border-t border-border/60">
          {steps.map((s) => {
            const isActive = s.stage === activeStage;
            const isPast = tick >= s.startAt + s.durationMs;
            return (
              <div
                key={s.stage}
                className={cn(
                  'border-r border-border/60 px-3 py-2.5 transition-colors last:border-r-0',
                  isActive && 'bg-ai-from/5',
                  isPast && 'bg-emerald-50/50',
                )}
              >
                <div className="flex items-center gap-1.5">
                  {isPast ? (
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                  ) : isActive ? (
                    <Loader2 className="size-3.5 animate-spin text-ai-from" />
                  ) : (
                    <span className="size-3.5 rounded-full border border-muted-foreground/30" />
                  )}
                  <span className={cn('text-[11.5px] font-semibold', isActive ? 'text-ai-from' : isPast ? 'text-emerald-700' : 'text-muted-foreground')}>
                    {s.label}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-[10.5px] text-muted-foreground">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Agent 实时网格 */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[14px] font-semibold tracking-tight">Agent 实时状态</h3>
          <span className="text-[11px] text-muted-foreground">
            <Bot className="mr-1 inline size-3" />
            {liveStates.filter((s) => s.status === 'success').length} / {agents.length - 2} 已完成（2 个贷后 Agent 不参与本次）
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
          {agents.map((a) => {
            const st = stateMap.get(a.id);
            return <AgentTile key={a.id} agent={a} state={st!} />;
          })}
        </div>
      </Card>

      {/* 实时活动条 */}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-amber-500" />
          <h3 className="text-[13px] font-semibold tracking-tight">实时活动流</h3>
        </div>
        <ActivityStream agents={agents} liveStates={liveStates} tick={tick} />
      </Card>
    </div>
  );
}

function AgentTile({ agent, state }: { agent: AgentDefinition; state: AgentRunState }) {
  const isRunning = state.status === 'running';
  const isDone = state.status === 'success';
  const isQueued = state.status === 'queued';
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-md border px-3 py-2 transition-all',
        isRunning && 'border-ai-from/50 bg-ai-from/5 shadow-sm shadow-ai-from/20',
        isDone && 'border-emerald-200 bg-emerald-50/50',
        isQueued && 'border-dashed border-border/60 bg-muted/20 opacity-70',
      )}
    >
      <span
        className={cn(
          'size-2 shrink-0 rounded-full',
          isRunning && 'bg-ai-from animate-pulse',
          isDone && 'bg-emerald-500',
          isQueued && 'bg-muted-foreground/30',
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-[11px] font-semibold tabular-nums">{agent.id}</p>
        <p className="truncate text-[10.5px] text-muted-foreground">{agent.name}</p>
      </div>
      {isDone && (
        <span className="font-mono text-[10px] tabular-nums text-emerald-700">
          {state.durationMs ? `${(state.durationMs / 1000).toFixed(1)}s` : ''}
        </span>
      )}
      {isRunning && <Loader2 className="size-3 animate-spin text-ai-from" />}
    </div>
  );
}

function ActivityStream({
  agents,
  liveStates,
  tick: _tick,
}: {
  agents: AgentDefinition[];
  liveStates: AgentRunState[];
  tick: number;
}) {
  // 收集"已发生"的事件：startedAt + finishedAt
  const events: Array<{ time: number; agentId: string; type: 'start' | 'done'; agent: AgentDefinition; durationMs?: number }> = [];
  const stateMap = new Map(liveStates.map((s) => [s.agentId, s]));
  for (const a of agents) {
    const s = stateMap.get(a.id);
    if (!s || !s.startedAt) continue;
    const sTime = new Date(s.startedAt).getTime();
    events.push({ time: sTime, agentId: a.id, type: 'start', agent: a });
    if (s.finishedAt) {
      events.push({ time: new Date(s.finishedAt).getTime(), agentId: a.id, type: 'done', agent: a, durationMs: s.durationMs });
    }
  }
  events.sort((a, b) => b.time - a.time);
  const recent = events.slice(0, 6);

  if (recent.length === 0) {
    return <p className="mt-2 text-[12px] text-muted-foreground">等待 Agent 启动…</p>;
  }

  return (
    <ul className="mt-2 space-y-1.5">
      {recent.map((e, i) => (
        <li key={`${e.agentId}-${e.type}-${i}`} className="flex items-center gap-2 font-mono text-[11px]">
          <span
            className={cn(
              'size-1.5 shrink-0 rounded-full',
              e.type === 'done' ? 'bg-emerald-500' : 'bg-ai-from',
            )}
          />
          <span className="font-semibold tabular-nums">{e.agentId}</span>
          <span className="text-muted-foreground">{e.agent.name}</span>
          <span className={cn(e.type === 'done' ? 'text-emerald-700' : 'text-ai-from')}>
            {e.type === 'done' ? `✓ 完成 (${(e.durationMs! / 1000).toFixed(1)}s)` : '▶ 启动'}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ─── 完成视图 ─────────────────────────────────

function DoneView({
  customer,
  elapsedMs,
  liveStates,
  onReset,
  onView,
}: {
  customer: Customer;
  elapsedMs: number;
  liveStates: AgentRunState[];
  onReset: () => void;
  onView: () => void;
}) {
  const successCount = liveStates.filter((s) => s.status === 'success').length;
  const apiCalls = liveStates.reduce((s, x) => s + (x.apiCalls ?? 0), 0);
  const isLE = customer.type === 'legal-entity';

  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-hidden">
        <div className="ai-gradient relative px-6 py-8 text-white">
          <div className="absolute right-0 top-0 size-40 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/30">
                <CheckCircle2 className="size-7" />
              </div>
              <div>
                <h2 className="font-display text-xl">尽调完成</h2>
                <p className="mt-0.5 text-[13px] text-white/85">
                  {customer.name} · {isLE ? '法人小微' : '个体工商户'} · 综合评分 {customer.creditScore}（{customer.creditGrade} 级）
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onReset} className="gap-1.5 bg-white/20 text-white hover:bg-white/30">
                <RotateCcw className="size-3.5" />
                再来一份
              </Button>
              <Button onClick={onView} className="gap-1.5 bg-white text-primary hover:bg-white/95">
                查看完整报告
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-border/60 md:grid-cols-4">
          <Stat label="生成时长" value={`${(elapsedMs / 1000).toFixed(1)}s`} sub={`vs 人工 8 小时`} />
          <Stat label="Agent 调用" value={`${successCount} 个`} sub={`SDAFI 5 阶段`} />
          <Stat label="API 调用" value={`${apiCalls} 次`} sub={`正菱数据接口`} />
          <Stat label="单户成本" value="¥256" sub="-91.5% vs 人工" />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-ai-from" />
          <h3 className="text-[14px] font-semibold tracking-tight">本次尽调摘要</h3>
        </div>
        <ul className="mt-3 space-y-1.5 text-[12.5px]">
          <li>· 客户：<strong>{customer.name}</strong>（{customer.industry} · {customer.region}）</li>
          <li>· 申请金额：<strong>{customer.appliedAmount} 万元</strong> · 产品：{customer.appliedProduct}</li>
          <li>· 评分：<strong>{customer.creditScore} / 100</strong>（{customer.creditGrade} 级 {gradeLabel(customer.creditGrade)}）</li>
          <li>· {isLE ? '93 张表 + 7 附录' : '62 张表 + 6 附录'} 已渲染 · docx 已生成</li>
          <li>· 已推送审批官 <strong>{customer.manager}</strong> 至 <strong>{customer.branch}</strong>，等待签字</li>
        </ul>
      </Card>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="px-4 py-4 text-center">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[10.5px] text-muted-foreground/80">{sub}</p>
    </div>
  );
}

function gradeLabel(g?: string): string {
  return g === 'A' ? '优' : g === 'B' ? '良' : g === 'C' ? '关注' : g === 'D' ? '否决' : '';
}
