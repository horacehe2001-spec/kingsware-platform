'use client';

import '@xyflow/react/dist/style.css';

import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  type Node,
  type NodeProps,
  Panel,
  Position,
  ReactFlow,
} from '@xyflow/react';
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Cpu,
  Loader2,
  MinusCircle,
  Sparkles,
} from 'lucide-react';
import { memo, useMemo } from 'react';

import type {
  AgentDefinition,
  AgentNamespace,
  AgentRunState,
  AgentStatus,
} from '@/data/types';
import { cn } from '@/lib/utils';

// ─── 阶段定义（与 L0→L3 协同设计文档对齐）───────────────────
const STAGE_LABELS: Record<number, { tag: string; name: string }> = {
  1: { tag: 'L0', name: '编排层' },
  2: { tag: 'L2', name: '章节分析' },
  3: { tag: 'L2.5', name: '横向分析' },
  4: { tag: 'L3', name: '决策与质检' },
  5: { tag: 'Act', name: '报告组装' },
  6: { tag: '闭环', name: 'Feedback / Improve' },
};

// ─── 布局参数 ──────────────────────────────────────────────
const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
const NODE_GAP_X = 28;
const STAGE_GAP_Y = 140;
const STAGE_LABEL_X = -120;

interface AgentNodeData extends Record<string, unknown> {
  agentId: string;
  name: string;
  humanRole: string;
  importance: AgentDefinition['importance'];
  status: AgentStatus;
  durationMs?: number;
  apiCalls?: number;
  tokenUsage?: number;
}

interface StageLabelData extends Record<string, unknown> {
  tag: string;
  name: string;
}

// ─── Agent 节点 ────────────────────────────────────────────
const AgentNode = memo(({ data }: NodeProps<Node<AgentNodeData>>) => {
  const { agentId, name, humanRole, status, durationMs, apiCalls } = data;

  const ringClass = (() => {
    switch (status) {
      case 'success':
        return 'border-grade-a/50 bg-grade-a-bg/60';
      case 'running':
        return 'border-ai-from/60 bg-ai-from/10 ai-glow';
      case 'failed':
        return 'border-grade-d/50 bg-grade-d-bg/60';
      case 'skipped':
        return 'border-border bg-muted/40 opacity-60';
      case 'queued':
        return 'border-dashed border-border bg-muted/20';
      default:
        return 'border-border bg-card';
    }
  })();

  const StatusIcon = (() => {
    switch (status) {
      case 'success':
        return CheckCircle2;
      case 'running':
        return Loader2;
      case 'failed':
        return AlertCircle;
      case 'skipped':
        return MinusCircle;
      default:
        return Circle;
    }
  })();

  const statusColor = (() => {
    switch (status) {
      case 'success':
        return 'text-grade-a';
      case 'running':
        return 'text-ai-from';
      case 'failed':
        return 'text-grade-d';
      case 'skipped':
        return 'text-muted-foreground/60';
      default:
        return 'text-muted-foreground/40';
    }
  })();

  return (
    <div
      className={cn(
        'rounded-md border-2 px-2.5 py-2 shadow-sm transition-all',
        ringClass,
      )}
      style={{ width: NODE_WIDTH, minHeight: NODE_HEIGHT }}
    >
      <Handle type="target" position={Position.Top} className="!size-2 !bg-border" />
      <div className="flex items-center gap-1.5">
        <Cpu className="size-3 shrink-0 text-foreground/70" />
        <span className="font-mono text-[10px] font-bold text-muted-foreground">
          {agentId}
        </span>
        <StatusIcon
          className={cn(
            'ml-auto size-3.5 shrink-0',
            statusColor,
            status === 'running' && 'animate-spin',
          )}
        />
      </div>
      <div className="mt-0.5 line-clamp-1 text-[12px] font-medium leading-tight">
        {name}
      </div>
      <div className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">
        ↳ {humanRole}
      </div>
      {status === 'success' && durationMs !== undefined && (
        <div className="mt-1 flex items-center gap-1.5 text-[9.5px] tabular-nums text-muted-foreground/80">
          <span className="font-mono">{(durationMs / 1000).toFixed(1)}s</span>
          {apiCalls !== undefined && apiCalls > 0 && (
            <>
              <span>·</span>
              <span className="font-mono">{apiCalls} API</span>
            </>
          )}
        </div>
      )}
      {status === 'running' && (
        <div className="mt-1.5 flex items-center gap-1 text-[9.5px] text-ai-from">
          <span className="data-flow-line h-0.5 flex-1 rounded-full" />
          <span className="font-mono tabular-nums">{apiCalls ?? 0} API</span>
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!size-2 !bg-border" />
    </div>
  );
});
AgentNode.displayName = 'AgentNode';

// ─── 阶段标签节点（左侧静态标签）────────────────────────────
const StageLabelNode = memo(({ data }: NodeProps<Node<StageLabelData>>) => {
  return (
    <div className="flex flex-col items-end gap-0.5 pr-2 text-right">
      <span className="font-mono text-[14px] font-bold text-primary">{data.tag}</span>
      <span className="text-[10px] tracking-wider text-muted-foreground">
        {data.name}
      </span>
    </div>
  );
});
StageLabelNode.displayName = 'StageLabelNode';

const NODE_TYPES = {
  agent: AgentNode,
  stageLabel: StageLabelNode,
};

// ─── 主组件 ────────────────────────────────────────────────
interface AgentDagProps {
  agents: AgentDefinition[];
  states: AgentRunState[];
  namespace: AgentNamespace;
  onSelectAgent?: (id: string) => void;
}

export function AgentDag({ agents, states, namespace, onSelectAgent }: AgentDagProps) {
  const { nodes, edges, summary } = useMemo(() => {
    // 1. 按 stage 分组并计算坐标
    const byStage = new Map<number, AgentDefinition[]>();
    for (const a of agents) {
      if (!byStage.has(a.stage)) byStage.set(a.stage, []);
      byStage.get(a.stage)!.push(a);
    }
    const stages = [...byStage.keys()].sort((a, b) => a - b);
    const maxCount = Math.max(...stages.map((s) => byStage.get(s)!.length));
    const totalWidth = maxCount * NODE_WIDTH + (maxCount - 1) * NODE_GAP_X;

    const stateMap = new Map(states.map((s) => [s.agentId, s]));
    const positions = new Map<string, { x: number; y: number }>();

    const flowNodes: Node[] = [];
    stages.forEach((stage, stageIdx) => {
      const items = byStage.get(stage)!;
      const stageWidth = items.length * NODE_WIDTH + (items.length - 1) * NODE_GAP_X;
      const startX = (totalWidth - stageWidth) / 2;
      const y = stageIdx * STAGE_GAP_Y;

      // 阶段标签
      flowNodes.push({
        id: `stage-${stage}`,
        type: 'stageLabel',
        position: { x: STAGE_LABEL_X, y: y + 24 },
        data: STAGE_LABELS[stage] ?? { tag: `S${stage}`, name: '' },
        draggable: false,
        selectable: false,
      });

      // Agent 节点
      items.forEach((agent, i) => {
        const x = startX + i * (NODE_WIDTH + NODE_GAP_X);
        positions.set(agent.id, { x, y });
        const state = stateMap.get(agent.id);
        flowNodes.push({
          id: agent.id,
          type: 'agent',
          position: { x, y },
          data: {
            agentId: agent.id,
            name: agent.name,
            humanRole: agent.humanRole,
            importance: agent.importance,
            status: state?.status ?? 'queued',
            durationMs: state?.durationMs,
            apiCalls: state?.apiCalls,
            tokenUsage: state?.tokenUsage,
          } satisfies AgentNodeData,
        });
      });
    });

    // 2. 由 dependencies 推边
    const flowEdges = agents.flatMap((agent) =>
      agent.dependencies
        .filter((dep) => positions.has(dep))
        .map((dep) => {
          const targetState = stateMap.get(agent.id);
          const sourceState = stateMap.get(dep);
          const isActiveEdge =
            targetState?.status === 'running' ||
            (sourceState?.status === 'success' && targetState?.status === 'queued');
          const isCompletedEdge =
            sourceState?.status === 'success' && targetState?.status === 'success';

          return {
            id: `${dep}->${agent.id}`,
            source: dep,
            target: agent.id,
            type: 'smoothstep',
            animated: isActiveEdge,
            style: {
              stroke: isCompletedEdge
                ? 'oklch(0.62 0.16 158)'
                : isActiveEdge
                  ? 'oklch(0.55 0.21 280)'
                  : 'oklch(0.85 0.01 257)',
              strokeWidth: isCompletedEdge || isActiveEdge ? 1.5 : 1,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 14,
              height: 14,
              color: isCompletedEdge
                ? 'oklch(0.62 0.16 158)'
                : isActiveEdge
                  ? 'oklch(0.55 0.21 280)'
                  : 'oklch(0.7 0.01 257)',
            },
          };
        }),
    );

    // 3. 概况统计
    const sm = {
      total: agents.length,
      success: states.filter((s) => s.status === 'success').length,
      running: states.filter((s) => s.status === 'running').length,
      queued: states.filter((s) => s.status === 'queued').length,
      failed: states.filter((s) => s.status === 'failed').length,
      apiCalls: states.reduce((s, x) => s + (x.apiCalls ?? 0), 0),
    };

    return { nodes: flowNodes, edges: flowEdges, summary: sm };
  }, [agents, states]);

  return (
    <div className="relative size-full bg-app">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.15, minZoom: 0.5, maxZoom: 1.5 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={!!onSelectAgent}
        minZoom={0.4}
        maxZoom={1.8}
        onNodeClick={(_, node) => {
          // stage label 节点不可点
          if (node.type === 'agent' && onSelectAgent) onSelectAgent(node.id);
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="oklch(0.85 0.01 257)"
        />
        <Controls position="bottom-right" showInteractive={false} />

        {/* 顶部说明 */}
        <Panel position="top-left" className="!m-3">
          <div className="rounded-lg border border-border bg-card/95 p-3 shadow-sm backdrop-blur">
            <div className="flex items-center gap-1.5">
              <div className="flex size-6 items-center justify-center rounded ai-gradient text-white">
                <Sparkles className="size-3.5" />
              </div>
              <span className="text-[12px] font-semibold tracking-tight">
                {namespace === 'LE' ? '法人小微' : '个体工商户'} ·{' '}
                {summary.total} Agent 协作图
              </span>
            </div>
            <p className="mt-1 text-[10.5px] text-muted-foreground">
              SDAFI v2.0 · L0→L3 + Act + 闭环 · 共 {edges.length} 条依赖边
            </p>
          </div>
        </Panel>

        {/* 状态图例 + 数字 */}
        <Panel position="top-right" className="!m-3">
          <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-card/95 p-2.5 shadow-sm backdrop-blur">
            <Stat label="已完成" value={summary.success} accent="text-grade-a" />
            <Stat label="运行中" value={summary.running} accent="text-ai-from" />
            <Stat label="排队" value={summary.queued} />
            {summary.failed > 0 && (
              <Stat label="失败" value={summary.failed} accent="text-grade-d" />
            )}
            <div className="mt-1 border-t border-border/60 pt-1.5 text-[9.5px] text-muted-foreground">
              累计 API 调用{' '}
              <span className="font-mono font-semibold text-foreground">
                {summary.apiCalls}
              </span>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = 'text-foreground',
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-[10.5px]">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-mono font-semibold tabular-nums', accent)}>
        {value}
      </span>
    </div>
  );
}
