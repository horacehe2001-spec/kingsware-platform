'use client';

import { Activity, CheckCircle2, Cpu, Database, GitBranch, HardDrive, MessageSquare, Server } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { ClientOnly } from '@/components/shared/client-only';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ServiceHealth {
  name: string;
  icon: React.ReactNode;
  status: '正常' | '警告' | '故障';
  uptime: string;
  metric1: { label: string; value: string };
  metric2: { label: string; value: string };
  metric3?: { label: string; value: string };
}

const SERVICES: ServiceHealth[] = [
  {
    name: 'Agent 运行时',
    icon: <Cpu className="size-4" />,
    status: '正常',
    uptime: '12 天 4 小时',
    metric1: { label: '在跑实例', value: '4 / 16' },
    metric2: { label: '今日完成', value: '187 笔' },
    metric3: { label: '平均耗时', value: '38.4s' },
  },
  {
    name: '业务数据库（PG）',
    icon: <Database className="size-4" />,
    status: '正常',
    uptime: '32 天 18 小时',
    metric1: { label: 'QPS', value: '142' },
    metric2: { label: '连接池', value: '38 / 100' },
    metric3: { label: 'P95 延迟', value: '8.4ms' },
  },
  {
    name: '审计存储（OSS）',
    icon: <HardDrive className="size-4" />,
    status: '正常',
    uptime: '90 天+',
    metric1: { label: '已用空间', value: '142 GB / 1 TB' },
    metric2: { label: '快照数', value: '4,820' },
    metric3: { label: '保留期', value: '5 年' },
  },
  {
    name: '消息队列（Kafka）',
    icon: <MessageSquare className="size-4" />,
    status: '正常',
    uptime: '24 天 6 小时',
    metric1: { label: '今日入队', value: '12,348' },
    metric2: { label: 'Lag', value: '0' },
    metric3: { label: '消费组', value: '8' },
  },
  {
    name: 'Redis 缓存',
    icon: <Server className="size-4" />,
    status: '警告',
    uptime: '8 天 12 小时',
    metric1: { label: '内存使用', value: '4.2 / 8 GB' },
    metric2: { label: '命中率', value: '94.5%' },
    metric3: { label: 'Eviction', value: '近 1h: 18' },
  },
  {
    name: '反向代理（Nginx）',
    icon: <GitBranch className="size-4" />,
    status: '正常',
    uptime: '90 天+',
    metric1: { label: 'RPS', value: '38' },
    metric2: { label: '5xx 率', value: '0.04%' },
    metric3: { label: 'P99 延迟', value: '120ms' },
  },
];

function genTimeSeries(base: number, volatility: number, len = 24): Array<{ h: string; v: number }> {
  return Array.from({ length: len }).map((_, i) => ({
    h: `${(i - 23 + 24) % 24}:00`,
    v: Math.max(0, Math.round(base + Math.sin((i + 0.7) * 0.6) * volatility + (Math.random() - 0.5) * volatility * 0.3)),
  }));
}

const CPU_DATA = genTimeSeries(38, 12);
const MEM_DATA = genTimeSeries(62, 8);
const QPS_DATA = genTimeSeries(140, 35);

export function TabSystemHealth() {
  return (
    <div className="grid gap-4">
      {/* 6 服务健康卡 */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s) => {
          const isOk = s.status === '正常';
          const isWarn = s.status === '警告';
          return (
            <Card key={s.name} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'flex size-8 items-center justify-center rounded-md',
                    isOk ? 'bg-emerald-50 text-emerald-600' : isWarn ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600',
                  )}>
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold">{s.name}</p>
                    <p className="text-[10.5px] text-muted-foreground">运行 {s.uptime}</p>
                  </div>
                </div>
                <span className={cn(
                  'flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium',
                  isOk ? 'bg-emerald-50 text-emerald-700' :
                  isWarn ? 'bg-amber-50 text-amber-700' :
                  'bg-rose-50 text-rose-700',
                )}>
                  <span className={cn(
                    'size-1.5 rounded-full',
                    isOk ? 'bg-emerald-500 animate-pulse' :
                    isWarn ? 'bg-amber-500' :
                    'bg-rose-500',
                  )} />
                  {s.status}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-1 border-t border-border/40 pt-2.5 text-[10.5px]">
                <Mini label={s.metric1.label} value={s.metric1.value} />
                <Mini label={s.metric2.label} value={s.metric2.value} />
                {s.metric3 && <Mini label={s.metric3.label} value={s.metric3.value} />}
              </div>
            </Card>
          );
        })}
      </div>

      {/* 24 小时性能曲线 */}
      <div className="grid gap-3 lg:grid-cols-3">
        <PerfChart title="CPU 使用率" subtitle="近 24 小时" unit="%" data={CPU_DATA} color="oklch(0.55 0.21 263)" />
        <PerfChart title="内存使用率" subtitle="近 24 小时" unit="%" data={MEM_DATA} color="oklch(0.62 0.16 158)" />
        <PerfChart title="数据库 QPS" subtitle="近 24 小时" unit="次/s" data={QPS_DATA} color="oklch(0.7 0.18 70)" />
      </div>

      {/* 健康检查列表 */}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-primary" />
          <h3 className="text-[14px] font-semibold tracking-tight">健康检查（最近 5 次）</h3>
        </div>
        <ul className="mt-3 space-y-1.5 font-mono text-[11px]">
          <CheckLine ok time="刚刚" who="DeepSeek API" detail="GET /chat/completions · 200 OK · 1.2s" />
          <CheckLine ok time="2 分钟前" who="正菱 · 企业综合查询" detail="GET /api/qy/info · 200 OK · 280ms" />
          <CheckLine ok time="5 分钟前" who="Agent 运行时" detail="LE-A04 财务诊断 · success · 12.4s" />
          <CheckLine warn time="8 分钟前" who="Redis 缓存" detail="evictPolicy=allkeys-lru · 内存使用 80%+" />
          <CheckLine ok time="11 分钟前" who="审计存储 OSS" detail="snapshot 写入 · snap_20260505_104 · 12.4 MB" />
        </ul>
      </Card>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-mono font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function PerfChart({
  title,
  subtitle,
  unit,
  data,
  color,
}: {
  title: string;
  subtitle: string;
  unit: string;
  data: Array<{ h: string; v: number }>;
  color: string;
}) {
  const cur = data[data.length - 1].v;
  const avg = Math.round(data.reduce((s, d) => s + d.v, 0) / data.length);
  return (
    <Card className="p-4">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <h4 className="text-[13px] font-semibold tracking-tight">{title}</h4>
          <p className="text-[10.5px] text-muted-foreground">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-lg font-semibold tabular-nums" style={{ color }}>{cur}{unit}</p>
          <p className="text-[10px] text-muted-foreground">均值 {avg}{unit}</p>
        </div>
      </div>
      <div className="mt-2 h-[110px] w-full">
        <ClientOnly>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.32} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(0.94 0.01 257)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="h" tick={{ fill: 'oklch(0.5 0.04 257)', fontSize: 9 }} interval={5} />
              <YAxis tick={{ fill: 'oklch(0.5 0.04 257)', fontSize: 9 }} />
              <Tooltip cursor={{ stroke: 'oklch(0.92 0.01 257)' }} contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid oklch(0.92 0.01 257)' }} />
              <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#grad-${title})`} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ClientOnly>
      </div>
    </Card>
  );
}

function CheckLine({ ok, warn, time, who, detail }: { ok?: boolean; warn?: boolean; time: string; who: string; detail: string }) {
  return (
    <li className="flex items-center gap-2">
      {ok && <CheckCircle2 className="size-3 shrink-0 text-emerald-500" />}
      {warn && <CheckCircle2 className="size-3 shrink-0 text-amber-500" />}
      <span className="text-muted-foreground">{time}</span>
      <span className="font-semibold">{who}</span>
      <span className="text-muted-foreground">·</span>
      <span className="text-foreground/70">{detail}</span>
    </li>
  );
}
