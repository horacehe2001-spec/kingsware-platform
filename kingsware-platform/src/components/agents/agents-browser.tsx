'use client';

import { Building2, Cpu, GitBranch, Star, Store } from 'lucide-react';
import { useState } from 'react';

import { AgentDetailSheet } from '@/components/report/agent-detail-sheet';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AgentDefinition } from '@/data/types';
import { cn } from '@/lib/utils';

interface Props {
  leAgents: AgentDefinition[];
  spAgents: AgentDefinition[];
  stageNames: Record<number, string>;
}

export function AgentsBrowser({ leAgents, spAgents, stageNames }: Props) {
  const [tab, setTab] = useState<'LE' | 'SP'>('LE');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 当前 tab 对应的 Agent 集合（供 sheet 解析依赖名）
  const currentAgents = tab === 'LE' ? leAgents : spAgents;

  return (
    <>
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'LE' | 'SP')}>
        <TabsList className="h-9 bg-muted/60">
          <TabsTrigger value="LE" className="gap-1.5">
            <Building2 className="size-3.5" />
            法人小微 · 16 个
          </TabsTrigger>
          <TabsTrigger value="SP" className="gap-1.5">
            <Store className="size-3.5" />
            个体工商户 · 14 个
          </TabsTrigger>
        </TabsList>

        <TabsContent value="LE" className="mt-4">
          <AgentGrid
            agents={leAgents}
            stageNames={stageNames}
            onSelect={setSelectedId}
            selectedId={selectedId}
          />
        </TabsContent>
        <TabsContent value="SP" className="mt-4">
          <AgentGrid
            agents={spAgents}
            stageNames={stageNames}
            onSelect={setSelectedId}
            selectedId={selectedId}
          />
        </TabsContent>
      </Tabs>

      {/* 共用详情抽屉，无 run state（catalog 模式） */}
      <AgentDetailSheet
        agentId={selectedId}
        onClose={() => setSelectedId(null)}
        agents={currentAgents}
        states={[]}
        onSelectAgent={setSelectedId}
      />
    </>
  );
}

function AgentGrid({
  agents,
  stageNames,
  onSelect,
  selectedId,
}: {
  agents: AgentDefinition[];
  stageNames: Record<number, string>;
  onSelect: (id: string) => void;
  selectedId: string | null;
}) {
  // 按 stage 分组
  const byStage = new Map<number, AgentDefinition[]>();
  for (const a of agents) {
    if (!byStage.has(a.stage)) byStage.set(a.stage, []);
    byStage.get(a.stage)!.push(a);
  }
  const stages = [...byStage.keys()].sort((a, b) => a - b);

  return (
    <div className="space-y-5">
      {stages.map((stage) => {
        const items = byStage.get(stage)!;
        return (
          <div key={stage}>
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/10 font-mono text-[10px] font-bold text-primary">
                {stage}
              </span>
              <h3 className="text-[12.5px] font-semibold tracking-tight">
                {stageNames[stage] ?? `阶段 ${stage}`}
              </h3>
              <span className="text-[10.5px] text-muted-foreground">
                {items.length} 个 Agent
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  selected={selectedId === agent.id}
                  onClick={() => onSelect(agent.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AgentCard({
  agent,
  selected,
  onClick,
}: {
  agent: AgentDefinition;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex flex-col gap-1.5 rounded-lg border bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-sm',
        selected
          ? 'border-primary/50 bg-primary/5 ring-2 ring-primary/20'
          : 'border-border',
      )}
    >
      <Card className="border-0 p-0 shadow-none">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md border border-border bg-muted/40">
            <Cpu className="size-3.5 text-foreground/70" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] font-bold text-primary">
                {agent.id}
              </span>
              <span className="truncate text-[12.5px] font-semibold">{agent.name}</span>
            </div>
            <p className="text-[10.5px] text-muted-foreground">{agent.humanRole}</p>
          </div>
          <ImportanceMark importance={agent.importance} />
        </div>
        <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
          {agent.description}
        </p>
        {agent.dependencies.length > 0 && (
          <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
            <GitBranch className="size-3" />
            依赖 {agent.dependencies.length} 个上游
          </div>
        )}
      </Card>
    </button>
  );
}

function ImportanceMark({ importance }: { importance: AgentDefinition['importance'] }) {
  const count = importance.length;
  return (
    <div className="flex shrink-0 items-center gap-0.5" title={`重要性 ${importance}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'size-2.5',
            count === 3
              ? 'fill-grade-d/70 text-grade-d/70'
              : count === 2
                ? 'fill-grade-c/70 text-grade-c/70'
                : 'fill-muted-foreground/40 text-muted-foreground/40',
          )}
        />
      ))}
    </div>
  );
}
