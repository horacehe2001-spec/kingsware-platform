'use client';

import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

import { ALL_CUSTOMERS } from '@/data/customers';
import type { CreditGrade } from '@/data/types';

import { ClientOnly } from '@/components/shared/client-only';
import { Card } from '@/components/ui/card';

const GRADE_COLORS: Record<CreditGrade, string> = {
  A: 'oklch(0.62 0.16 158)', // 绿
  B: 'oklch(0.55 0.21 263)', // 蓝
  C: 'oklch(0.7 0.18 70)',   // 橙
  D: 'oklch(0.6 0.22 22)',   // 红
};

const GRADE_LABEL: Record<CreditGrade, string> = {
  A: 'A · 优',
  B: 'B · 良',
  C: 'C · 关注',
  D: 'D · 否决',
};

interface GradeDistributionProps {
  /** 可选 props 覆盖：默认聚合 ALL_CUSTOMERS */
  customers?: typeof ALL_CUSTOMERS;
}

export function GradeDistribution({ customers = ALL_CUSTOMERS }: GradeDistributionProps) {
  const counts: Record<CreditGrade, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const c of customers) {
    if (c.creditGrade) counts[c.creditGrade]++;
  }
  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  const data = (['A', 'B', 'C', 'D'] as CreditGrade[])
    .map((g) => ({ grade: g, name: GRADE_LABEL[g], value: counts[g], color: GRADE_COLORS[g] }))
    .filter((d) => d.value > 0);

  // 关注 + 否决 = 高风险占比
  const highRiskRatio = total > 0 ? (counts.C + counts.D) / total : 0;

  return (
    <Card className="flex h-full flex-col p-4">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <h3 className="text-[14px] font-semibold tracking-tight">信用等级分布</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">本月在审 {total} 户</p>
        </div>
        <div className="text-right">
          <p className="font-display text-lg font-semibold tabular-nums">
            {(highRiskRatio * 100).toFixed(0)}%
          </p>
          <p className="text-[10px] text-muted-foreground">高风险占比 (C+D)</p>
        </div>
      </div>

      <div className="my-2 h-[180px] w-full">
        <ClientOnly>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
                isAnimationActive={false}
                stroke="oklch(1 0 0)"
                strokeWidth={2}
              >
                {data.map((d) => (
                  <Cell key={d.grade} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ClientOnly>
      </div>

      <ul className="space-y-1.5 border-t border-border/60 pt-3 text-[12px]">
        {data.map((d) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0;
          return (
            <li key={d.grade} className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-sm" style={{ background: d.color }} />
                <span className="font-medium">{d.name}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{pct.toFixed(0)}%</span>
                <span className="font-mono font-semibold tabular-nums">{d.value} 户</span>
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
