import type { CreditGrade } from '@/data/types';

/** 分数 → 等级 */
export function scoreToGrade(score: number): CreditGrade {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

/** 等级 → Tailwind class（前景文字色） */
export function gradeColorClass(grade?: CreditGrade): string {
  if (!grade) return 'text-muted-foreground';
  return {
    A: 'text-grade-a',
    B: 'text-grade-b',
    C: 'text-grade-c',
    D: 'text-grade-d',
  }[grade];
}

/** 等级 → 徽章背景+文字 */
export function gradeBadgeClass(grade?: CreditGrade): string {
  if (!grade) return 'bg-muted text-muted-foreground border-border';
  return {
    A: 'bg-grade-a-bg text-grade-a border-grade-a/20',
    B: 'bg-grade-b-bg text-grade-b border-grade-b/20',
    C: 'bg-grade-c-bg text-grade-c border-grade-c/20',
    D: 'bg-grade-d-bg text-grade-d border-grade-d/20',
  }[grade];
}

/** 风险等级颜色 */
export function riskColorClass(
  level: 'low' | 'medium' | 'high' | 'critical' | 'info' | 'warning',
): string {
  const map: Record<string, string> = {
    low: 'text-risk-low',
    info: 'text-risk-low',
    medium: 'text-risk-medium',
    warning: 'text-risk-medium',
    high: 'text-risk-high',
    critical: 'text-risk-critical',
  };
  return map[level] ?? 'text-muted-foreground';
}

export function riskBgClass(
  level: 'low' | 'medium' | 'high' | 'critical' | 'info' | 'warning',
): string {
  const map: Record<string, string> = {
    low: 'bg-risk-low/10 text-risk-low border-risk-low/20',
    info: 'bg-risk-low/10 text-risk-low border-risk-low/20',
    medium: 'bg-risk-medium/10 text-risk-medium border-risk-medium/20',
    warning: 'bg-risk-medium/10 text-risk-medium border-risk-medium/20',
    high: 'bg-risk-high/10 text-risk-high border-risk-high/20',
    critical: 'bg-risk-critical/10 text-risk-critical border-risk-critical/20',
  };
  return map[level] ?? 'bg-muted text-muted-foreground border-border';
}

export function severityLabel(s: 'low' | 'medium' | 'high' | 'critical'): string {
  return { low: '低', medium: '中', high: '高', critical: '极高' }[s];
}
