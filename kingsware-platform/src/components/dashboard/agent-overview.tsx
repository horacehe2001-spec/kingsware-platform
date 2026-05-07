'use client';

import { Activity, Cpu, Sparkles, Workflow } from 'lucide-react';

import { LE_AGENTS, SP_AGENTS } from '@/data/agents';
import type { AgentDefinition } from '@/data/types';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const STAGE_META: Record<number, { label: string; short: string; color: string; bg: string }> = {
  1: { label: 'L0 编排层', short: 'Sense', color: 'text-blue-600', bg: 'bg-blue-50' },
  2: { label: 'L2 章节分析层', short: 'Decide-A', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  3: { label: 'L2.5 横向分析层', short: 'Decide-B', color: 'text-violet-600', bg: 'bg-violet-50' },
  4: { label: 'L3 决策与质检层', short: 'Decide-C', color: 'text-fuchsia-600', bg: 'bg-fuchsia-50' },
  5: { label: 'Act 报告组装', short: 'Act', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  6: { label: '闭环 反馈/改进', short: 'F·I', color: 'text-amber-600', bg: 'bg-amber-50' },
};

interface AgentRuntimeStat {
  id: string;
  inFlight: number; // 在跑
  queued: number;   // 排队
  done30m: number;  // 30 分钟已完成
  avgMs: number;    // 平均耗时
  errorRate: number; // 错误率
}

/** Mock 30 分钟内运行时统计 —— 演示用 */
function mockStats(a: AgentDefinition): AgentRuntimeStat {
  // 用 id hash 给一组确定性的"看似真实"的数字
  const seed = [...a.id].reduce((s, c) => s + c.charCodeAt(0), 0);
  const r = (k: number) => ((seed * 31 + k * 17) % 100) / 100;

  // SE-01 / AC-01 是关键路径上的 Agent，调用频率最高
  const isHotPath = ['SE-01', 'AC-01'].includes(a.id);
  // FB-01 / IM-01 是贷后/季度，调用稀疏
  const isCold = ['FB-01', 'IM-01'].includes(a.id);
  // Critic 偶尔触发
  const isCritic = a.id.toLowerCase().includes('critic');

  const baseDone = isHotPath ? 180 + Math.floor(r(1) * 40) : isCold ? 2 + Math.floor(r(2) * 5) : isCritic ? 8 + Math.floor(r(3) * 6) : 28 + Math.floor(r(4) * 24);
  const inFlight = isCold ? 0 : Math.floor(r(5) * 4);
  const queued = isCold ? 0 : Math.floor(r(6) * 3);
  const avgMs = isHotPath ? 1200 + Math.floor(r(7) * 800) : isCold ? 4000 + Math.floor(r(8) * 2000) : 2500 + Math.floor(r(9) * 4000);
  return {
    id: a.id,
    inFlight,
    queued,
    done30m: baseDone,
    avgMs,
    errorRate: r(10) > 0.92 ? Math.round(r(11) * 50) / 100 : 0,
  };
}

/** 合并 LE + SP 的 Agent，按 id 去重 */
function unifiedAgents(): AgentDefinition[] {
  const seen = new Set<string>();
  const out: AgentDefinition[] = [];
  for (const a of [...LE_AGENTS, ...SP_AGENTS]) {
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    out.push(a);
  }
  return out;
}

export function AgentOverview() {
  const agents = unifiedAgents();
  const stats = new Map(agents.map((a) => [a.id, mockStats(a)]));

  const totalInFlight = [...stats.values()].reduce((s, v) => s + v.inFlight, 0);
  const totalQueued = [...stats.values()].reduce((s, v) => s + v.queued, 0);
  const totalDone30m = [...stats.values()].reduce((s, v) => s + v.done30m, 0);
  const avgLatencyAll = Math.round([...stats.values()].reduce((s, v) => s + v.avgMs, 0) / stats.size / 1000 * 10) / 10;

  // 按 stage 分组
  const stages = [1, 2, 3, 4, 5, 6] as const;
  const byStage = new Map<number, AgentDefinition[]>();
  for (const a of agents) {
    if (!byStage.has(a.stage)) byStage.set(a.stage, []);
    byStage.get(a.stage)!.push(a);
  }

  return (
    <Card className="overflow-hidden">
      {/* 头部：标题 + 实时统计 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Workflow className="size-4" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold tracking-tight">Agent 协作矩阵</h3>
            <p className="text-[11px] text-muted-foreground">
              {agents.length} 个 Agent · 6 阶段 SDAFI · 近 30 分钟实时
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[11.5px]">
          <RuntimeBadge label="在跑" value={totalInFlight} dotClass="bg-emerald-500 animate-pulse" />
          <RuntimeBadge label="排队" value={totalQueued} dotClass="bg-amber-500" />
          <RuntimeBadge label="30 min 已完成" value={totalDone30m} dotClass="bg-blue-500" />
          <RuntimeBadge label="平均耗时" value={`${avgLatencyAll}s`} dotClass="bg-violet-500" />
        </div>
      </div>

      {/* 阶段网格 */}
      <div className="grid grid-cols-6 gap-0">
        {stages.map((s) => {
          const meta = STAGE_META[s];
          const stageAgents = byStage.get(s) ?? [];
          const stageInFlight = stageAgents.reduce((sum, a) => sum + (stats.get(a.id)?.inFlight ?? 0), 0);
          const stageDone = stageAgents.reduce((sum, a) => sum + (stats.get(a.id)?.done30m ?? 0), 0);
          return (
            <div key={s} className="border-r border-border/60 last:border-r-0">
              {/* 阶段头 */}
              <div className={cn('px-3 py-2', meta.bg)}>
                <div className={cn('text-[12px] font-semibold', meta.color)}>{meta.short}</div>
                <div className="text-[10px] text-muted-foreground">{meta.label}</div>
                <div className="mt-1 flex items-baseline gap-2 text-[10.5px]">
                  <span className="font-mono tabular-nums">
                    <span className="font-semibold text-foreground">{stageAgents.length}</span>
                    <span className="text-muted-foreground"> Agent</span>
                  </span>
                  <span className="font-mono tabular-nums text-muted-foreground">
                    {stageDone} 调用
                  </span>
                </div>
              </div>

              {/* Agent 列表 */}
              <ul className="divide-y divide-border/40 px-2 py-1.5">
                {stageAgents.map((a) => {
                  const st = stats.get(a.id)!;
                  const isLive = st.inFlight > 0;
                  const isErr = st.errorRate > 0;
                  return (
                    <li
                      key={a.id}
                      className="flex items-center gap-2 py-1.5"
                      title={`${a.name} · ${a.humanRole} · 平均 ${(st.avgMs / 1000).toFixed(1)}s`}
                    >
                      <span
                        className={cn(
                          'size-1.5 shrink-0 rounded-full',
                          isErr ? 'bg-rose-500' : isLive ? 'bg-emerald-500 animate-pulse' : st.queued > 0 ? 'bg-amber-500' : 'bg-slate-300',
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[11px] font-mono font-semibold tabular-nums text-foreground">
                          {a.id}
                        </div>
                        <div className="truncate text-[10px] text-muted-foreground">{a.name}</div>
                      </div>
                      <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                        {st.done30m}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* 底部：核心指标 */}
      <div className="grid grid-cols-4 divide-x divide-border/60 border-t border-border/60 bg-muted/30 text-center">
        <FooterStat icon={<Activity className="size-3.5" />} label="今日决策完成率" value="98.6%" trend="+0.4pp" />
        <FooterStat icon={<Cpu className="size-3.5" />} label="单户成本" value="¥256" trend="-91.5%" />
        <FooterStat icon={<Sparkles className="size-3.5" />} label="审批等待时长" value="8 分 12 秒" trend="-93%" />
        <FooterStat icon={<Workflow className="size-3.5" />} label="人在环节点" value="3 / 客户" trend="法规要求" />
      </div>
    </Card>
  );
}

function RuntimeBadge({
  label,
  value,
  dotClass,
}: {
  label: string;
  value: number | string;
  dotClass: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('size-1.5 rounded-full', dotClass)} />
      <span className="font-mono font-semibold tabular-nums">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

function FooterStat({
  icon,
  label,
  value,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <div className="px-2 py-3">
      <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-display text-base font-semibold tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground/80">{trend}</div>
    </div>
  );
}
