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

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type {
  AgentDefinition,
  AgentRunState,
  AgentStatus,
} from '@/data/types';
import { cn } from '@/lib/utils';

const STAGE_LABELS: Record<number, string> = {
  1: 'L0 编排层',
  2: 'L2 章节分析',
  3: 'L2.5 横向分析',
  4: 'L3 决策与质检',
  5: 'Act 报告组装',
  6: '闭环 Feedback / Improve',
};

const STATUS_META: Record<
  AgentStatus,
  { label: string; Icon: React.ComponentType<{ className?: string }>; cls: string }
> = {
  idle: { label: '空闲', Icon: Circle, cls: 'text-muted-foreground/60' },
  queued: { label: '排队中', Icon: Circle, cls: 'text-muted-foreground/60' },
  running: { label: '运行中', Icon: Loader2, cls: 'text-ai-from animate-spin' },
  success: { label: '已完成', Icon: CheckCircle2, cls: 'text-grade-a' },
  failed: { label: '失败', Icon: AlertCircle, cls: 'text-grade-d' },
  skipped: { label: '已跳过', Icon: MinusCircle, cls: 'text-muted-foreground/60' },
};

interface Props {
  agentId: string | null;
  onClose: () => void;
  agents: AgentDefinition[];
  states: AgentRunState[];
  onSelectAgent?: (id: string) => void;
}

export function AgentDetailSheet({
  agentId,
  onClose,
  agents,
  states,
  onSelectAgent,
}: Props) {
  const open = Boolean(agentId);
  const agent = agentId ? agents.find((a) => a.id === agentId) : null;
  const state = agentId ? states.find((s) => s.agentId === agentId) : null;
  const statusMeta = STATUS_META[state?.status ?? 'queued'];
  const StatusIcon = statusMeta.Icon;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full !max-w-md p-0 sm:!max-w-md"
        showCloseButton
      >
        {agent && (
          <>
            <SheetHeader className="border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-md ai-gradient text-white shadow-sm">
                  <Cpu className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="flex items-center gap-2">
                    <span className="font-mono text-[12px] font-bold text-primary">
                      {agent.id}
                    </span>
                    <span className="text-[14px] font-semibold">{agent.name}</span>
                  </SheetTitle>
                  <SheetDescription className="mt-0.5 text-[11px]">
                    {STAGE_LABELS[agent.stage]} · {agent.importance}
                  </SheetDescription>
                </div>
              </div>
              <p className="mt-2 text-[12px] text-muted-foreground">
                <span className="text-foreground/70">人类对应角色 </span>
                <span className="font-medium text-foreground">{agent.humanRole}</span>
              </p>
            </SheetHeader>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
              {/* 当前运行状态：catalog 模式（无 states 数组）下整段隐藏 */}
              {state && (
                <Section title="当前运行状态">
                  <div
                    className={cn(
                      'flex items-center gap-2 rounded-md border px-3 py-2',
                      state.status === 'success'
                        ? 'border-grade-a/30 bg-grade-a-bg/50'
                        : state.status === 'running'
                          ? 'border-ai-from/40 bg-ai-from/5'
                          : state.status === 'failed'
                            ? 'border-grade-d/30 bg-grade-d-bg/50'
                            : 'border-border bg-muted/40',
                    )}
                  >
                    <StatusIcon className={cn('size-4 shrink-0', statusMeta.cls)} />
                    <span className="text-[13px] font-semibold">{statusMeta.label}</span>
                    {state.status === 'success' && state.durationMs !== undefined && (
                      <span className="ml-auto font-mono text-[11px] tabular-nums text-muted-foreground">
                        耗时 {(state.durationMs / 1000).toFixed(1)}s
                      </span>
                    )}
                  </div>
                  {state.status === 'success' && (
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <Stat label="API 调用" value={state.apiCalls?.toString() ?? '—'} />
                      <Stat
                        label="LLM Token"
                        value={state.tokenUsage?.toLocaleString('zh-CN') ?? '—'}
                      />
                      <Stat
                        label="开始时间"
                        value={state.startedAt?.slice(11, 19) ?? '—'}
                        mono
                      />
                    </div>
                  )}
                  {state.outputPreview && (
                    <div className="mt-2 rounded-md border border-dashed border-border bg-muted/30 p-2.5">
                      <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        输出片段
                      </p>
                      <p className="text-[11.5px] leading-relaxed text-foreground/85">
                        {state.outputPreview}
                      </p>
                    </div>
                  )}
                  {state.errorMessage && (
                    <p className="mt-2 rounded-md border border-grade-d/30 bg-grade-d-bg/50 px-2.5 py-1.5 text-[11.5px] text-grade-d">
                      {state.errorMessage}
                    </p>
                  )}
                </Section>
              )}

              {/* Agent 定义 */}
              <Section title="职责描述">
                <p className="text-[12.5px] leading-relaxed text-foreground/85">
                  {agent.description}
                </p>
              </Section>

              <Section title="输入数据">
                <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                  {agent.inputs}
                </p>
              </Section>

              <Section title="输出形态">
                <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                  {agent.outputFormat}
                </p>
                <p className="mt-1 font-mono text-[10.5px] text-muted-foreground/70">
                  预期长度：{agent.expectedLength}
                </p>
              </Section>

              {/* 依赖 */}
              {agent.dependencies.length > 0 && (
                <Section title={`上游依赖（${agent.dependencies.length}）`}>
                  <ul className="flex flex-wrap gap-1.5">
                    {agent.dependencies.map((depId) => {
                      const depAgent = agents.find((a) => a.id === depId);
                      return (
                        <li key={depId}>
                          <button
                            type="button"
                            onClick={() => onSelectAgent?.(depId)}
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1 text-[11px] font-medium hover:bg-muted hover:text-primary"
                          >
                            <GitBranch className="size-3 text-muted-foreground" />
                            <span className="font-mono">{depId}</span>
                            {depAgent && (
                              <span className="text-muted-foreground">
                                {depAgent.name}
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </Section>
              )}

              {/* SDAFI 提示 */}
              <div className="flex items-start gap-2 rounded-md bg-ai-from/5 p-2.5">
                <Sparkles className="mt-0.5 size-3.5 shrink-0 text-ai-from" />
                <p className="text-[10.5px] leading-relaxed text-muted-foreground">
                  {agent.id === 'AC-01'
                    ? 'AC-01 是唯一允许写业务库的 Agent；其他 Agent 只读 cycle_log + 数据池快照（SDAFI 纪律）'
                    : agent.id === 'SE-01'
                      ? 'SE-01 在 Sense 阶段冻结数据池快照，其余 Agent 全部从同一份不可变快照读取，确保决策可重现'
                      : agent.id.endsWith('A12') || agent.id.endsWith('A10')
                        ? 'Critic 不通过将退回上游 Agent，最多 2 轮，超过转人工'
                        : '本 Agent 严格遵守 SDAFI 纪律三：不直接调用其他 Agent，只通过数据池协作'}
                </p>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
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
