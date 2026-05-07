'use client';

import { Activity, Brain, CheckCircle2, Eye, EyeOff, Sparkles, Zap } from 'lucide-react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { ClientOnly } from '@/components/shared/client-only';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ModelInfo {
  id: string;
  name: string;
  vendor: string;
  status: 'primary' | 'standby' | 'disabled';
  context: string;
  costPerMillion: string;
  todayCalls: number;
  weekCalls: number;
  avgLatency: string;
  errorRate: string;
}

const MODELS: ModelInfo[] = [
  {
    id: 'deepseek-v4-flash',
    name: 'DeepSeek V4 Flash',
    vendor: 'DeepSeek',
    status: 'primary',
    context: '128K',
    costPerMillion: '¥0.5 / M tokens',
    todayCalls: 348,
    weekCalls: 2_104,
    avgLatency: '11.4s',
    errorRate: '0.18%',
  },
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek Reasoner',
    vendor: 'DeepSeek',
    status: 'standby',
    context: '64K',
    costPerMillion: '¥4 / M tokens',
    todayCalls: 12,
    weekCalls: 86,
    avgLatency: '32.1s',
    errorRate: '0.10%',
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat (V3)',
    vendor: 'DeepSeek',
    status: 'standby',
    context: '64K',
    costPerMillion: '¥1 / M tokens',
    todayCalls: 0,
    weekCalls: 4,
    avgLatency: '8.5s',
    errorRate: '0.32%',
  },
  {
    id: 'qwen-max',
    name: '通义千问 Qwen-Max',
    vendor: '阿里云',
    status: 'standby',
    context: '32K',
    costPerMillion: '¥40 / M tokens',
    todayCalls: 0,
    weekCalls: 0,
    avgLatency: '—',
    errorRate: '—',
  },
];

interface PromptTemplate {
  agentId: string;
  agentName: string;
  version: string;
  updatedAt: string;
  tokens: string;
  status: '生产' | '灰度';
}

const PROMPT_TEMPLATES: PromptTemplate[] = [
  { agentId: 'LE-A04', agentName: '财务诊断', version: 'v2.6.1', updatedAt: '2026-04-29', tokens: '~2,400', status: '生产' },
  { agentId: 'LE-A03', agentName: '行业经营 (RAG)', version: 'v2.6.0', updatedAt: '2026-04-25', tokens: '~3,800', status: '生产' },
  { agentId: 'LE-A07', agentName: '交叉验证', version: 'v2.5.4', updatedAt: '2026-04-22', tokens: '~1,600', status: '生产' },
  { agentId: 'LE-A10', agentName: '决策与建议', version: 'v2.6.2', updatedAt: '2026-05-02', tokens: '~2,100', status: '灰度' },
  { agentId: 'SP-A04', agentName: '反欺诈流水线', version: 'v2.6.0', updatedAt: '2026-04-29', tokens: '~1,200', status: '生产' },
  { agentId: 'SP-A06', agentName: '四维评分', version: 'v2.6.1', updatedAt: '2026-04-29', tokens: '~1,400', status: '生产' },
];

function buildWeekCalls(): Array<{ day: string; primary: number; standby: number }> {
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '今日'];
  return days.map((day, i) => {
    const isWeekend = i === 5;
    const seed = Math.sin((i + 1.7) * 1.3) * 60 + 220;
    return {
      day,
      primary: isWeekend ? 28 : Math.round(seed + i * 12),
      standby: isWeekend ? 2 : Math.round(seed * 0.06),
    };
  });
}

export function TabModels() {
  const [showKey, setShowKey] = useState(false);
  const weekCalls = buildWeekCalls();

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      {/* 模型列表 + 调用统计 */}
      <div className="grid gap-4 lg:col-span-12 xl:col-span-8">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <Brain className="size-4 text-ai-from" />
              <h3 className="text-[14px] font-semibold tracking-tight">大语言模型（4 个已接入）</h3>
            </div>
            <Button size="sm" variant="outline" className="h-7 gap-1 text-[12px]">
              <Sparkles className="size-3.5" />
              接入新模型
            </Button>
          </div>
          <ul className="divide-y divide-border/40">
            {MODELS.map((m) => (
              <li key={m.id} className="grid grid-cols-12 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/20">
                <div className="col-span-12 sm:col-span-5">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold">{m.name}</span>
                    {m.status === 'primary' && (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                        <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                        主用
                      </span>
                    )}
                    {m.status === 'standby' && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">备用</span>
                    )}
                    {m.status === 'disabled' && (
                      <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700">禁用</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {m.vendor} · 上下文 {m.context} · {m.costPerMillion}
                  </p>
                </div>
                <Stat label="今日调用" value={m.todayCalls.toLocaleString('zh-CN')} className="col-span-3 sm:col-span-2" />
                <Stat label="本周调用" value={m.weekCalls.toLocaleString('zh-CN')} className="col-span-3 sm:col-span-2" />
                <Stat label="平均耗时" value={m.avgLatency} className="col-span-3 sm:col-span-2" />
                <Stat label="错误率" value={m.errorRate} className="col-span-3 sm:col-span-1" tone={parseFloat(m.errorRate) > 0.5 ? 'warn' : 'ok'} />
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              <h3 className="text-[14px] font-semibold tracking-tight">近 7 日模型调用</h3>
            </div>
            <p className="text-[11px] text-muted-foreground">主用 + 备用合计</p>
          </div>
          <div className="mt-2 h-[200px] w-full">
            <ClientOnly>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekCalls} margin={{ top: 8, right: 10, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke="oklch(0.92 0.01 257)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: 'oklch(0.5 0.04 257)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'oklch(0.5 0.04 257)', fontSize: 10 }} />
                  <Tooltip cursor={{ fill: 'oklch(0.96 0.005 257)' }} contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid oklch(0.92 0.01 257)' }} />
                  <Bar dataKey="primary" name="主用 V4 Flash" stackId="a" fill="oklch(0.55 0.21 263)" isAnimationActive={false} />
                  <Bar dataKey="standby" name="备用" stackId="a" fill="oklch(0.7 0.18 70)" isAnimationActive={false} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ClientOnly>
          </div>
        </Card>
      </div>

      {/* 右侧：API Key + Prompt 模板 */}
      <div className="grid gap-4 lg:col-span-12 xl:col-span-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-amber-500" />
            <h3 className="text-[13px] font-semibold tracking-tight">DeepSeek API Key</h3>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            存储于 .env.local，重启 dev server 生效
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Input
              readOnly
              value={showKey ? (process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY_DISPLAY ?? 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') : 'sk-xxxxxx•••••••••••••••••••••••••••xxx'}
              className="h-8 flex-1 font-mono text-[11.5px]"
            />
            <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setShowKey((s) => !s)}>
              {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </Button>
          </div>
          <ul className="mt-3 space-y-1 text-[11px] text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3 text-emerald-500" />
              连接已验证 · 配额 5,000 / 日
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3 text-emerald-500" />
              上次成功调用 5 分钟前
            </li>
          </ul>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-border/60 px-4 py-3">
            <h3 className="text-[13px] font-semibold tracking-tight">Agent Prompt 模板</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">25 个 Agent 块 · 见 src/lib/agent-prompts.ts</p>
          </div>
          <ul className="divide-y divide-border/40 max-h-[420px] overflow-y-auto">
            {PROMPT_TEMPLATES.map((p) => (
              <li key={p.agentId} className="px-4 py-2.5 transition-colors hover:bg-muted/30">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-semibold">{p.agentId}</span>
                  <span className={cn(
                    'rounded px-1.5 py-0.5 text-[10px] font-medium',
                    p.status === '生产' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
                  )}>
                    {p.status} · {p.version}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {p.agentName} · {p.tokens} · {p.updatedAt}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, className, tone }: { label: string; value: string; className?: string; tone?: 'ok' | 'warn' }) {
  return (
    <div className={cn('text-right', className)}>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={cn(
        'font-mono text-[12.5px] font-semibold tabular-nums',
        tone === 'warn' && 'text-amber-600',
        tone === 'ok' && 'text-emerald-600',
      )}>
        {value}
      </p>
    </div>
  );
}
