'use client';

import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Cpu,
  GitBranch,
  Loader2,
  MinusCircle,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';

import { AgentDag } from '@/components/report/agent-dag';
import { AgentDetailSheet } from '@/components/report/agent-detail-sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type {
  AgentDefinition,
  AgentNamespace,
  AgentRunState,
  AgentStatus,
} from '@/data/types';
import { cn } from '@/lib/utils';

interface AgentPipelineProps {
  agents: AgentDefinition[];
  states: AgentRunState[];
  namespace: AgentNamespace;
  totalApiCalls?: number;
}

// L0→L3 协同设计文档定义的层级（与 SDAFI 五阶段是互补视角）
const STAGE_LABELS: Record<number, { num: string; name: string; desc: string }> = {
  1: { num: 'L0', name: '编排层', desc: '一票否决前置 + 授权门控 + 数据池快照' },
  2: { num: 'L2', name: '章节分析层', desc: '扇出并行 · 各 Agent 互不依赖' },
  3: { num: 'L2.5', name: '横向分析层', desc: '屏障同步后并行 · 跨 Agent 综合' },
  4: { num: 'L3', name: '决策与质检层', desc: '串行 + Critic 回路（最多 2 轮）' },
  5: { num: 'Act', name: '报告组装', desc: '唯一写业务库 · docx 渲染 + 推审批官' },
  6: { num: '闭环', name: 'Feedback / Improve', desc: '贷后回写 + 季度模型治理' },
};

function statusIcon(status: AgentStatus) {
  const cls = 'size-3.5';
  switch (status) {
    case 'success':
      return <CheckCircle2 className={cn(cls, 'text-grade-a')} />;
    case 'running':
      return <Loader2 className={cn(cls, 'animate-spin text-ai-from')} />;
    case 'failed':
      return <AlertCircle className={cn(cls, 'text-grade-d')} />;
    case 'skipped':
      return <MinusCircle className={cn(cls, 'text-muted-foreground/60')} />;
    case 'queued':
      return <Circle className={cn(cls, 'text-muted-foreground/40')} />;
    default:
      return <Circle className={cn(cls, 'text-muted-foreground/40')} />;
  }
}

function statusRingClass(status: AgentStatus) {
  switch (status) {
    case 'success':
      return 'border-grade-a/40 bg-grade-a-bg/40';
    case 'running':
      return 'border-ai-from/50 bg-ai-from/10 ai-glow';
    case 'failed':
      return 'border-grade-d/40 bg-grade-d-bg/40';
    case 'skipped':
      return 'border-border bg-muted/40 opacity-60';
    case 'queued':
      return 'border-dashed border-border bg-muted/20';
    default:
      return 'border-border bg-card';
  }
}

export function AgentPipeline({
  agents,
  states,
  namespace,
  totalApiCalls,
}: AgentPipelineProps) {
  const [dagOpen, setDagOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const selectAgent = (id: string) => {
    setSelectedAgentId(id);
    setDagOpen(false); // 在 DAG 里点节点时关闭 dialog，让 sheet 独占焦点
  };

  const stateMap = new Map(states.map((s) => [s.agentId, s]));
  const stageGroups = new Map<number, AgentDefinition[]>();
  for (const a of agents) {
    if (!stageGroups.has(a.stage)) stageGroups.set(a.stage, []);
    stageGroups.get(a.stage)!.push(a);
  }
  const sortedStages = [...stageGroups.keys()].sort((a, b) => a - b);

  const completed = states.filter((s) => s.status === 'success').length;
  const running = states.filter((s) => s.status === 'running').length;
  const total = agents.length;

  // 真实总耗时 = max(finishedAt) - min(startedAt)
  const elapsedMs = (() => {
    const starts = states
      .map((s) => (s.startedAt ? new Date(s.startedAt).getTime() : NaN))
      .filter((n) => !isNaN(n));
    const ends = states
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
    <Card className="ai-gradient-border overflow-hidden p-0">
      {/* 头部 */}
      <header className="border-b border-border bg-gradient-to-br from-ai-from/5 to-transparent p-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md ai-gradient text-white shadow-sm">
            <Sparkles className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold tracking-tight">Agent 协作流水线</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {namespace === 'LE' ? '法人版' : '个体户版'} {agents.length} 个 Agent · L0→L3 + Act + 闭环
            </p>
          </div>
          {running > 0 && (
            <div className="flex items-center gap-1 rounded-md bg-ai-from/10 px-2 py-1 text-[10.5px] font-semibold text-ai-from">
              <span className="agent-pulse">●</span>
              {running} 运行中
            </div>
          )}
        </div>

        {/* 协作图触发按钮 */}
        <Dialog open={dagOpen} onOpenChange={setDagOpen}>
          <DialogTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full gap-1.5 border-ai-from/30 bg-ai-from/5 text-ai-from hover:bg-ai-from/10 hover:text-ai-from"
              >
                <GitBranch className="size-3.5" />
                查看 Agent 协作图
              </Button>
            }
          />
          <DialogContent
            className="!max-w-[min(96vw,1400px)] !p-0 !gap-0 !rounded-lg"
            showCloseButton={false}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <DialogTitle className="flex items-center gap-2 text-[13px]">
                <GitBranch className="size-4 text-ai-from" />
                Agent 协作图 · L0 → 闭环
              </DialogTitle>
              <button
                type="button"
                onClick={() => setDagOpen(false)}
                className="rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                关闭 (Esc)
              </button>
            </div>
            <div className="h-[min(85vh,820px)] w-full">
              <AgentDag
                agents={agents}
                states={states}
                namespace={namespace}
                onSelectAgent={selectAgent}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* 进度条 */}
        <div className="mt-3 space-y-1">
          <div className="flex items-baseline justify-between text-[11px]">
            <span className="text-muted-foreground">总进度</span>
            <span className="font-mono font-semibold tabular-nums">
              {completed} / {total}
              <span className="ml-1.5 text-muted-foreground">
                ({((completed / total) * 100).toFixed(0)}%)
              </span>
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full ai-gradient transition-all duration-500"
              style={{ width: `${(completed / total) * 100}%` }}
            />
          </div>
        </div>

        {/* 统计 */}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Stat label="API 调用" value={totalApiCalls?.toString() ?? '—'} />
          <Stat
            label="LLM Token"
            value={
              states
                .reduce((s, x) => s + (x.tokenUsage ?? 0), 0)
                .toLocaleString('zh-CN') || '—'
            }
          />
          <Stat label="总耗时" value={elapsedLabel} mono />
        </div>
      </header>

      {/* 阶段列表 */}
      <ScrollArea className="h-[calc(100vh-26rem)]">
        <div className="space-y-0">
          {sortedStages.map((stage, idx) => {
            const stageAgents = stageGroups.get(stage)!;
            const stageInfo = STAGE_LABELS[stage];
            const stageStates = stageAgents.map((a) => stateMap.get(a.id));
            const stageDone = stageStates.every(
              (s) => s?.status === 'success' || s?.status === 'skipped',
            );
            const stageRunning = stageStates.some((s) => s?.status === 'running');

            return (
              <div key={stage} className="relative">
                {/* 阶段头 */}
                <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border/60 bg-card/95 px-4 py-2 backdrop-blur">
                  <span
                    className={cn(
                      'inline-flex size-5 shrink-0 items-center justify-center rounded-md font-mono text-[10px] font-bold',
                      stageDone
                        ? 'bg-grade-a text-white'
                        : stageRunning
                          ? 'ai-gradient text-white'
                          : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {stage}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold leading-tight">
                      {stageInfo?.name ?? `阶段 ${stage}`}
                    </p>
                    <p className="text-[10.5px] text-muted-foreground">
                      {stageInfo?.desc}
                    </p>
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {stageStates.filter((s) => s?.status === 'success').length}/
                    {stageAgents.length}
                  </span>
                </div>

                {/* Agent 列表 */}
                <ul className="divide-y divide-border/40">
                  {stageAgents.map((agent) => {
                    const state = stateMap.get(agent.id);
                    const status = state?.status ?? 'queued';
                    return (
                      <li key={agent.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedAgentId(agent.id)}
                          className={cn(
                            'group flex w-full items-start gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-muted/50',
                            selectedAgentId === agent.id && 'bg-primary/5',
                          )}
                        >
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <div
                                  className={cn(
                                    'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border',
                                    statusRingClass(status),
                                  )}
                                >
                                  <Cpu className="size-3 text-foreground/70" />
                                </div>
                              }
                            />
                            <TooltipContent side="right">
                              <span className="font-mono text-[11px]">{agent.id}</span> ·{' '}
                              {agent.humanRole}
                            </TooltipContent>
                          </Tooltip>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10.5px] font-semibold text-muted-foreground">
                                {agent.id}
                              </span>
                              <span className="text-[12px] font-medium text-foreground">
                                {agent.name}
                              </span>
                              <span className="ml-auto">{statusIcon(status)}</span>
                            </div>
                            <p className="mt-0.5 truncate text-[10.5px] text-muted-foreground">
                              ↳ {agent.humanRole}
                            </p>
                            {state?.outputPreview && status === 'success' && (
                              <p className="mt-1 line-clamp-2 rounded bg-muted/40 px-1.5 py-1 text-[10.5px] leading-snug text-muted-foreground">
                                {state.outputPreview}
                              </p>
                            )}
                            {status === 'running' && (
                              <div className="mt-1.5 flex items-center gap-1 text-[10px] text-ai-from">
                                <span className="data-flow-line h-0.5 flex-1 rounded-full" />
                                <span className="font-mono tabular-nums">
                                  {state?.apiCalls ?? 0} API · {state?.tokenUsage ?? 0} tk
                                </span>
                              </div>
                            )}
                            {status === 'success' && state?.durationMs && (
                              <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground/80">
                                <span className="font-mono tabular-nums">
                                  {(state.durationMs / 1000).toFixed(1)}s
                                </span>
                                <span>·</span>
                                <span className="font-mono tabular-nums">
                                  {state.apiCalls} API
                                </span>
                                <span>·</span>
                                <span className="font-mono tabular-nums">
                                  {state.tokenUsage?.toLocaleString('zh-CN')} tk
                                </span>
                              </div>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {/* 阶段间连接线 */}
                {idx < sortedStages.length - 1 && (
                  <div className="flex justify-center py-1">
                    <div
                      className={cn(
                        'h-3 w-px',
                        stageDone
                          ? 'bg-grade-a/40'
                          : stageRunning
                            ? 'bg-ai-from'
                            : 'bg-border',
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Agent 节点详情抽屉（list 点击 + DAG 节点点击 共用） */}
      <AgentDetailSheet
        agentId={selectedAgentId}
        onClose={() => setSelectedAgentId(null)}
        agents={agents}
        states={states}
        onSelectAgent={selectAgent}
      />
    </Card>
  );
}

function Stat({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-2 py-1.5">
      <p className="text-[9.5px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          'mt-0.5 text-[12px] font-semibold tabular-nums',
          mono && 'font-mono',
        )}
      >
        {value}
      </p>
    </div>
  );
}
