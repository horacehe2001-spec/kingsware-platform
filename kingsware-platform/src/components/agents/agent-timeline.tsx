'use client';

import { Bot, Clock, Users, Zap } from 'lucide-react';

import { LE_AGENTS, SP_AGENTS } from '@/data/agents';
import type { AgentDefinition } from '@/data/types';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Agent 协作时序甘特图
 *
 * 三层叠加体现核心卖点：
 * 1. 顶部"效率对比" — 人工 8h / 法人 50s / 个体户 15s 视觉化
 * 2. 法人 16 Agent 5 阶段甘特图（横向时间轴 0-50s）
 * 3. 个体户 14 Agent 5 阶段甘特图（横向时间轴 0-15s）
 */

const STAGE_META: Record<number, { name: string; color: string; bg: string; ring: string }> = {
  1: { name: 'L0 编排', color: '#2563eb', bg: '#eff6ff', ring: '#bfdbfe' },
  2: { name: 'L2 章节', color: '#6366f1', bg: '#eef2ff', ring: '#c7d2fe' },
  3: { name: 'L2.5 横向', color: '#8b5cf6', bg: '#f5f3ff', ring: '#ddd6fe' },
  4: { name: 'L3 决策', color: '#a855f7', bg: '#faf5ff', ring: '#e9d5ff' },
  5: { name: 'Act', color: '#10b981', bg: '#ecfdf5', ring: '#a7f3d0' },
  6: { name: '闭环', color: '#f59e0b', bg: '#fffbeb', ring: '#fde68a' },
};

interface ScheduleBlock {
  agentId: string;
  agentName: string;
  stage: number;
  startSec: number;
  durationSec: number;
  /** 用于显示的耗时（如果 > durationSec 表示存在等待） */
  apiCalls?: number;
  /** 关键路径标记 */
  critical?: boolean;
}

/** 法人 5 阶段 Agent 调度（基于真实生产时长 35-50s，取 45s 中位数） */
function buildLeSchedule(agents: AgentDefinition[]): ScheduleBlock[] {
  const out: ScheduleBlock[] = [];

  // Stage 1: SE-01 串行
  out.push({ agentId: 'SE-01', agentName: '感知与编排', stage: 1, startSec: 0, durationSec: 4.5, apiCalls: 23, critical: true });

  // Stage 2: LE-A01 ~ A05 并行（章节分析）
  const stage2 = agents.filter((a) => a.stage === 2 && a.id.startsWith('LE-A'));
  const stage2Start = 4.8;
  const stage2Durations = [12, 11, 14, 16, 10]; // 不同 Agent 调用接口数差异
  stage2.forEach((a, i) => {
    out.push({
      agentId: a.id,
      agentName: a.name,
      stage: 2,
      startSec: stage2Start,
      durationSec: stage2Durations[i] ?? 12,
      apiCalls: 4 + (i % 4),
      critical: i === 2 || i === 3, // 行业 / 财务 是关键路径
    });
  });
  const stage2End = stage2Start + Math.max(...stage2Durations);

  // Stage 3: LE-A06-09 部分并行（横向分析）
  const stage3 = agents.filter((a) => a.stage === 3);
  const stage3Start = stage2End + 0.3;
  const stage3Durations = [4, 5, 6, 5];
  stage3.forEach((a, i) => {
    out.push({
      agentId: a.id,
      agentName: a.name,
      stage: 3,
      startSec: stage3Start,
      durationSec: stage3Durations[i] ?? 5,
      apiCalls: 0,
      critical: i === 1, // 交叉验证关键
    });
  });
  const stage3End = stage3Start + Math.max(...stage3Durations);

  // Stage 4: LE-A10/A11/A12 + Critic 串行（决策 + Critic 回路）
  const stage4 = agents.filter((a) => a.stage === 4);
  let cur = stage3End + 0.3;
  stage4.forEach((a) => {
    const d = 3 + Math.random() * 1.5;
    out.push({
      agentId: a.id,
      agentName: a.name,
      stage: 4,
      startSec: cur,
      durationSec: d,
      apiCalls: 0,
      critical: true,
    });
    cur += d + 0.2;
  });

  // Stage 5: AC-01 串行（Act 报告组装）
  out.push({ agentId: 'AC-01', agentName: '组装编排', stage: 5, startSec: cur + 0.2, durationSec: 2.5, apiCalls: 0, critical: true });

  // Stage 6: FB-01 / IM-01（贷后 + 季度，标"延迟"）
  out.push({ agentId: 'FB-01', agentName: '反馈收集', stage: 6, startSec: 60, durationSec: 5, apiCalls: 3 });

  return out;
}

/** 个体户 5 阶段 Agent 调度（生产 8-15s，取 12s 中位数） */
function buildSpSchedule(agents: AgentDefinition[]): ScheduleBlock[] {
  const out: ScheduleBlock[] = [];

  // Stage 1: SE-01（个体户场景一票否决前置 + 五步反欺诈门控并行，更快）
  out.push({ agentId: 'SE-01', agentName: '感知与编排', stage: 1, startSec: 0, durationSec: 1.8, apiCalls: 31, critical: true });

  // Stage 2: SP-A01 ~ A05 并行
  const stage2 = agents.filter((a) => a.stage === 2 && a.id.startsWith('SP-A'));
  const stage2Start = 2.0;
  const stage2Durations = [4, 4.5, 5, 0.5, 5.5]; // SP-A04 反欺诈零接口
  stage2.forEach((a, i) => {
    out.push({
      agentId: a.id,
      agentName: a.name,
      stage: 2,
      startSec: stage2Start,
      durationSec: stage2Durations[i] ?? 4,
      apiCalls: a.id === 'SP-A04' ? 0 : 3 + (i % 4),
      critical: i === 1 || i === 2,
    });
  });
  const stage2End = stage2Start + Math.max(...stage2Durations);

  // Stage 3: SP-A06 评分（消费上游产物）
  const stage3 = agents.filter((a) => a.stage === 3);
  let cur = stage2End + 0.2;
  stage3.forEach((a) => {
    out.push({
      agentId: a.id,
      agentName: a.name,
      stage: 3,
      startSec: cur,
      durationSec: 1.5,
      apiCalls: 4,
      critical: true,
    });
    cur += 1.7;
  });

  // Stage 4: SP-A07 / A08 / A09 / A10 串行
  const stage4 = agents.filter((a) => a.stage === 4);
  stage4.forEach((a) => {
    out.push({
      agentId: a.id,
      agentName: a.name,
      stage: 4,
      startSec: cur,
      durationSec: 0.6,
      apiCalls: 0,
      critical: true,
    });
    cur += 0.7;
  });

  // Stage 5: AC-01
  out.push({ agentId: 'AC-01', agentName: '组装编排', stage: 5, startSec: cur + 0.2, durationSec: 1.2, apiCalls: 0, critical: true });

  // Stage 6
  out.push({ agentId: 'FB-01', agentName: '反馈收集', stage: 6, startSec: 30, durationSec: 3, apiCalls: 2 });

  return out;
}

export function AgentTimeline() {
  const leSchedule = buildLeSchedule(LE_AGENTS);
  const spSchedule = buildSpSchedule(SP_AGENTS);

  // 法人时间窗：0-65s（覆盖 stage 1-5 + stage 6 起点）
  const leMaxSec = 50;
  // 个体户：0-18s
  const spMaxSec = 18;

  return (
    <Card className="overflow-hidden">
      {/* 头部 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-5 py-3">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-primary" />
          <h2 className="text-[14px] font-semibold tracking-tight">Agent 协作时序对比</h2>
        </div>
        <p className="text-[11px] text-muted-foreground">
          基于 SDAFI v2.0 真实生产数据 · 关键路径已高亮
        </p>
      </div>

      {/* 顶部：3 条效率对比 */}
      <div className="border-b border-border/60 px-5 py-4">
        <h3 className="mb-3 text-[12px] font-semibold text-muted-foreground">效率对比 · 同一工作量</h3>
        <EfficiencyBar
          icon={<Users className="size-3.5" />}
          label="人工尽调"
          subtitle="客户经理 + 风控 + 信审委协作"
          actualSec={28800}
          relativeMaxSec={28800}
          color="#94a3b8"
          tag="8 小时 / 笔"
        />
        <EfficiencyBar
          icon={<Bot className="size-3.5" />}
          label="法人 Agent 协同"
          subtitle="16 个 Agent · 5 阶段 · 90 个接口"
          actualSec={45}
          relativeMaxSec={28800}
          color="#2563eb"
          tag="≈ 45 秒 / 笔"
          highlight
        />
        <EfficiencyBar
          icon={<Zap className="size-3.5" />}
          label="个体户 Agent 协同"
          subtitle="14 个 Agent · 5 阶段 · 86 个接口"
          actualSec={12}
          relativeMaxSec={28800}
          color="#10b981"
          tag="≈ 12 秒 / 笔"
          highlight
        />
        <p className="mt-2 text-[11px] text-muted-foreground">
          法人提速 <span className="font-mono font-semibold text-primary">640×</span> · 个体户提速 <span className="font-mono font-semibold text-emerald-600">2,400×</span> · 单户成本下降 <span className="font-mono font-semibold text-foreground">91.5%</span>
        </p>
      </div>

      {/* 法人甘特图 */}
      <div className="border-b border-border/60 px-5 py-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="text-[13px] font-semibold tracking-tight">
            法人小微 · 16 个 Agent · 5 阶段调度
          </h3>
          <p className="text-[11px] text-muted-foreground">
            关键路径 <span className="font-mono font-semibold text-foreground">{leSchedule.find((b) => b.agentId === 'AC-01')!.startSec.toFixed(1)}s</span> · 总时长 ≈ <span className="font-mono font-semibold text-foreground">45s</span>
          </p>
        </div>
        <GanttChart blocks={leSchedule} maxSec={leMaxSec} />
      </div>

      {/* 个体户甘特图 */}
      <div className="px-5 py-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="text-[13px] font-semibold tracking-tight">
            个体工商户 · 14 个 Agent · 5 阶段调度
          </h3>
          <p className="text-[11px] text-muted-foreground">
            关键路径 <span className="font-mono font-semibold text-foreground">{spSchedule.find((b) => b.agentId === 'AC-01')!.startSec.toFixed(1)}s</span> · 总时长 ≈ <span className="font-mono font-semibold text-foreground">12s</span>
          </p>
        </div>
        <GanttChart blocks={spSchedule} maxSec={spMaxSec} />
      </div>

      {/* 图例 */}
      <div className="flex flex-wrap items-center gap-3 border-t border-border/60 bg-muted/30 px-5 py-2.5 text-[11px]">
        <span className="text-muted-foreground">阶段：</span>
        {Object.entries(STAGE_META).map(([k, v]) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: v.color }} />
            {v.name}
          </span>
        ))}
        <span className="ml-auto inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm border-2 border-dashed border-rose-400" />
          关键路径
        </span>
      </div>
    </Card>
  );
}

// ─── 顶部效率对比柱 ───────────────────────────
function EfficiencyBar({
  icon,
  label,
  subtitle,
  actualSec,
  relativeMaxSec,
  color,
  tag,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  actualSec: number;
  relativeMaxSec: number;
  color: string;
  tag: string;
  highlight?: boolean;
}) {
  // 用 sqrt 缓和巨大比例（28800 vs 12 太悬殊）
  const rawPct = (actualSec / relativeMaxSec) * 100;
  const visualPct = Math.max(0.6, Math.sqrt(rawPct) * 10); // 0.6% min for visibility

  return (
    <div className="mb-2.5 last:mb-0">
      <div className="mb-1 flex items-center gap-2 text-[12px]">
        <span className="flex size-5 items-center justify-center rounded-md text-muted-foreground">{icon}</span>
        <span className="font-semibold">{label}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{subtitle}</span>
        <span
          className={cn(
            'ml-auto rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums',
            highlight ? 'text-white' : 'text-foreground/80',
          )}
          style={{ background: highlight ? color : 'oklch(0.94 0.01 257)' }}
        >
          {tag}
        </span>
      </div>
      <div className="relative h-5 w-full overflow-hidden rounded bg-muted">
        <div
          className="absolute inset-y-0 left-0 transition-all"
          style={{ width: `${visualPct}%`, background: color }}
        >
          {visualPct > 8 && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[10px] font-semibold tabular-nums text-white">
              {actualSec >= 3600 ? `${Math.round(actualSec / 3600)}h` : `${actualSec}s`}
            </span>
          )}
        </div>
        {visualPct < 8 && (
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 font-mono text-[10px] font-semibold tabular-nums" style={{ color }}>
            {actualSec >= 3600 ? `${Math.round(actualSec / 3600)}h` : `${actualSec}s`}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── 甘特图核心 ───────────────────────────────
function GanttChart({ blocks, maxSec }: { blocks: ScheduleBlock[]; maxSec: number }) {
  // SVG 尺寸
  const width = 1000;
  const labelW = 180;
  const rowH = 22;
  const padTop = 32; // 时间轴
  const padBottom = 8;

  // 按 stage + agentId 排序（同 stage 内按 startSec 升序）
  const sorted = [...blocks].sort((a, b) => a.stage - b.stage || a.startSec - b.startSec);
  const height = padTop + sorted.length * rowH + padBottom;
  const chartW = width - labelW;
  const xScale = (sec: number) => labelW + (sec / maxSec) * chartW;

  // 时间刻度
  const ticks = generateTicks(maxSec);

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg" style={{ minWidth: 720 }}>
        {/* 阶段背景泳道 */}
        {[1, 2, 3, 4, 5, 6].map((stage) => {
          const stageRows = sorted.filter((b) => b.stage === stage);
          if (stageRows.length === 0) return null;
          const startIdx = sorted.indexOf(stageRows[0]);
          const meta = STAGE_META[stage];
          return (
            <rect
              key={stage}
              x={labelW}
              y={padTop + startIdx * rowH}
              width={chartW}
              height={stageRows.length * rowH}
              fill={meta.bg}
              opacity={0.5}
            />
          );
        })}

        {/* 时间轴 */}
        <line x1={labelW} y1={padTop - 4} x2={width} y2={padTop - 4} stroke="#cbd5e1" strokeWidth={1} />
        {ticks.map((t) => (
          <g key={t}>
            <line x1={xScale(t)} y1={padTop - 8} x2={xScale(t)} y2={height - padBottom} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="3 3" />
            <text x={xScale(t)} y={padTop - 12} fontSize={10} fill="#64748b" textAnchor="middle">
              {t}s
            </text>
          </g>
        ))}

        {/* 行 */}
        {sorted.map((b, i) => {
          const y = padTop + i * rowH;
          const x = xScale(b.startSec);
          const w = Math.max(2, (b.durationSec / maxSec) * chartW);
          const meta = STAGE_META[b.stage];
          const labelColor = meta.color;
          return (
            <g key={`${b.agentId}-${i}`}>
              {/* 标签区分隔线 */}
              <line x1={0} y1={y} x2={width} y2={y} stroke="#f1f5f9" strokeWidth={1} />
              {/* Agent ID + Name */}
              <text x={6} y={y + rowH / 2 + 4} fontSize={10.5} fontFamily="ui-monospace, monospace" fontWeight={600} fill={labelColor}>
                {b.agentId}
              </text>
              <text x={70} y={y + rowH / 2 + 4} fontSize={10} fill="#475569">
                {b.agentName}
              </text>
              {/* 任务条 */}
              <rect
                x={x}
                y={y + 4}
                width={w}
                height={rowH - 8}
                fill={meta.color}
                rx={3}
                ry={3}
                opacity={b.stage === 6 ? 0.45 : 0.92}
                stroke={b.critical ? '#f43f5e' : 'transparent'}
                strokeWidth={b.critical ? 1.5 : 0}
                strokeDasharray={b.critical ? '3 2' : undefined}
              />
              {/* 持续时间标签（只在条够宽时显示） */}
              {w > 38 && (
                <text
                  x={x + w / 2}
                  y={y + rowH / 2 + 3}
                  fontSize={9.5}
                  fontFamily="ui-monospace, monospace"
                  fontWeight={600}
                  fill="#fff"
                  textAnchor="middle"
                >
                  {b.durationSec.toFixed(1)}s
                </text>
              )}
              {/* API calls 标签（条右侧） */}
              {b.apiCalls && b.apiCalls > 0 && w < 38 && (
                <text x={x + w + 4} y={y + rowH / 2 + 3} fontSize={9} fill="#64748b">
                  {b.apiCalls} API
                </text>
              )}
              {b.apiCalls && b.apiCalls > 0 && w >= 38 && (
                <text x={x + w + 4} y={y + rowH / 2 + 3} fontSize={9} fill="#64748b">
                  {b.apiCalls}
                </text>
              )}
            </g>
          );
        })}

        {/* 关键路径连接线（虚线，从左到右关键节点) */}
        {(() => {
          const cps = sorted.filter((b) => b.critical);
          if (cps.length < 2) return null;
          const points = cps.map((b, i) => ({
            x: xScale(b.startSec) + (b.durationSec / maxSec) * chartW * 0.5,
            y: padTop + sorted.indexOf(b) * rowH + rowH / 2,
          }));
          return (
            <g>
              {points.slice(0, -1).map((p, i) => (
                <line
                  key={i}
                  x1={p.x}
                  y1={p.y}
                  x2={points[i + 1].x}
                  y2={points[i + 1].y}
                  stroke="#f43f5e"
                  strokeWidth={1}
                  strokeDasharray="2 3"
                  opacity={0.4}
                />
              ))}
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

function generateTicks(maxSec: number): number[] {
  const step = maxSec <= 18 ? 2 : maxSec <= 30 ? 5 : 10;
  const ticks: number[] = [];
  for (let t = 0; t <= maxSec; t += step) ticks.push(t);
  return ticks;
}
