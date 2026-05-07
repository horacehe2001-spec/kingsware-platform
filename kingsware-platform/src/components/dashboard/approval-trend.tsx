'use client';

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { ClientOnly } from '@/components/shared/client-only';
import { Card } from '@/components/ui/card';

interface DayData {
  day: string;
  approved: number;
  conditional: number;
  rejected: number;
}

/** 7 日合成数据：以"今天"为锚点回推 */
function buildWeekData(): DayData[] {
  const labels = ['一', '二', '三', '四', '五', '六', '日'];
  const today = new Date();
  const todayDow = (today.getDay() + 6) % 7; // Mon=0
  const out: DayData[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dow = (d.getDay() + 6) % 7;
    const isWeekend = dow >= 5;
    // 工作日 ~ 35-50 笔，周末 ~ 5-12 笔
    const seed = Math.sin((d.getDate() + 1.7) * 1.3) * 10;
    const approved = isWeekend ? 4 + Math.floor(Math.abs(seed * 0.3)) : 28 + Math.floor(Math.abs(seed) + 8);
    const conditional = isWeekend ? 1 + Math.floor(Math.abs(seed * 0.2)) : 6 + Math.floor(Math.abs(seed * 0.4));
    const rejected = isWeekend ? Math.floor(Math.abs(seed * 0.1)) : 3 + Math.floor(Math.abs(seed * 0.2));
    out.push({
      day: `${dow === todayDow ? '今 ' : ''}${labels[dow]}`,
      approved,
      conditional,
      rejected,
    });
  }
  return out;
}

export function ApprovalTrend() {
  const data = buildWeekData();
  const totalApproved = data.reduce((s, d) => s + d.approved, 0);
  const totalConditional = data.reduce((s, d) => s + d.conditional, 0);
  const totalRejected = data.reduce((s, d) => s + d.rejected, 0);
  const total = totalApproved + totalConditional + totalRejected;

  return (
    <Card className="flex h-full flex-col p-4">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <h3 className="text-[14px] font-semibold tracking-tight">近 7 日审批趋势</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">按授信决策类型堆叠</p>
        </div>
        <div className="text-right">
          <p className="font-display text-lg font-semibold tabular-nums">{total}</p>
          <p className="text-[10px] text-muted-foreground">总笔数</p>
        </div>
      </div>

      <div className="mt-2 h-[210px] w-full">
        <ClientOnly>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="oklch(0.92 0.01 257)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'oklch(0.5 0.04 257)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'oklch(0.5 0.04 257)', fontSize: 10 }} />
              <Tooltip
                cursor={{ fill: 'oklch(0.96 0.005 257)' }}
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 6,
                  border: '1px solid oklch(0.92 0.01 257)',
                  background: 'oklch(1 0 0)',
                }}
              />
              <Bar dataKey="approved" stackId="a" name="批准" fill="oklch(0.62 0.16 158)" isAnimationActive={false} radius={[0, 0, 0, 0]} />
              <Bar dataKey="conditional" stackId="a" name="有条件" fill="oklch(0.7 0.18 70)" isAnimationActive={false} />
              <Bar dataKey="rejected" stackId="a" name="否决" fill="oklch(0.6 0.22 22)" isAnimationActive={false} radius={[3, 3, 0, 0]} />
              <Legend
                iconType="square"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
              />
            </BarChart>
          </ResponsiveContainer>
        </ClientOnly>
      </div>

      <div className="mt-1 grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-center">
        <Stat color="oklch(0.62 0.16 158)" label="批准" value={totalApproved} pct={totalApproved / total} />
        <Stat color="oklch(0.7 0.18 70)" label="有条件" value={totalConditional} pct={totalConditional / total} />
        <Stat color="oklch(0.6 0.22 22)" label="否决" value={totalRejected} pct={totalRejected / total} />
      </div>
    </Card>
  );
}

function Stat({ color, label, value, pct }: { color: string; label: string; value: number; pct: number }) {
  return (
    <div>
      <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
        <span className="size-1.5 rounded-full" style={{ background: color }} />
        {label}
      </div>
      <div className="mt-0.5 font-display text-base font-semibold tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground/80 tabular-nums">{(pct * 100).toFixed(0)}%</div>
    </div>
  );
}
