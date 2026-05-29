'use client';

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';

import { ClientOnly } from '@/components/shared/client-only';
import { Card } from '@/components/ui/card';
import { ScoreBadge } from '@/components/shared/score-badge';
import { scoreToLabel } from '@/data/analysis-labels';
import type { CreditGrade } from '@/data/types';

interface ScoreRadarProps {
  title: string;
  subtitle?: string;
  totalScore?: number;
  grade?: CreditGrade;
  data: { dimension: string; score: number; weight: number }[];
  /** 'analysis' = 纯分析版：用定性档位代替分数/等级 */
  mode?: 'score' | 'analysis';
  /** 纯分析版下右上角展示的综合档位（如 较好） */
  overallLabel?: string;
}

export function ScoreRadar({
  title,
  subtitle,
  totalScore,
  grade,
  data,
  mode = 'score',
  overallLabel,
}: ScoreRadarProps) {
  const isAnalysis = mode === 'analysis';
  const chartData = data.map((d) => ({
    dimension: d.dimension,
    fullMark: 100,
    score: d.score,
  }));

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {isAnalysis
          ? overallLabel && (
              <div className="text-right">
                <span className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  综合 {overallLabel}
                </span>
              </div>
            )
          : grade && (
              <div className="text-right">
                <ScoreBadge grade={grade} size="lg" />
                {totalScore !== undefined && (
                  <p className="mt-1 font-mono text-[11px] tabular-nums text-muted-foreground">
                    综合 {totalScore} / 100
                  </p>
                )}
              </div>
            )}
      </div>

      <div className="mt-2 h-[240px] w-full">
        <ClientOnly>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData} outerRadius="72%">
              <PolarGrid
                gridType="polygon"
                stroke="oklch(0.92 0.01 257)"
                strokeOpacity={0.6}
              />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fill: 'oklch(0.5 0.04 257)', fontSize: 11 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={false}
                axisLine={false}
              />
              <Radar
                name={isAnalysis ? '维度表现' : '得分'}
                dataKey="score"
                stroke="oklch(0.55 0.21 263)"
                fill="oklch(0.55 0.21 263)"
                fillOpacity={0.18}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </ClientOnly>
      </div>

      <ul className="mt-2 space-y-1.5 border-t border-border/60 pt-3">
        {data.map((d) => (
          <li
            key={d.dimension}
            className="flex items-center justify-between text-[11.5px]"
          >
            <span className="text-muted-foreground">
              <span className="text-foreground/80">{d.dimension}</span>
              <span className="ml-1.5 font-mono text-[10px]">({d.weight}%)</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full bg-primary"
                  style={{ width: `${d.score}%` }}
                />
              </span>
              <span className="w-9 text-right font-semibold tabular-nums">
                {isAnalysis ? scoreToLabel(d.score) : d.score}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
