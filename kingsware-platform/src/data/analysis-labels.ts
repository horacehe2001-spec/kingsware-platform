/**
 * 「纯分析版」档位映射（纯函数，打印预览与 Word 导出共用）
 *
 * 依据《法人小微企业授信尽职调查报告样例_纯分析版》附录 B.1：
 *   "本分析不进行数值打分或加权汇总；各维度依据多源数据形成
 *    强 / 较好 / 一般 / 偏弱 的定性判断。"
 *
 * 底层数据仍保留 0-100 的 fiveDimensionScores / creditGrade，
 * 仅在此把数值映射成定性档位，渲染层一律展示档位，不展示分数。
 */

export type AnalysisLabel = '强' | '较好' | '一般' | '偏弱';

/** 子指标 / 维度 0-100 分 → 定性档位（沿用原 85/70/55 分界） */
export function scoreToLabel(score: number): AnalysisLabel {
  if (score >= 85) return '强';
  if (score >= 70) return '较好';
  if (score >= 55) return '一般';
  return '偏弱';
}

/** 综合等级字母（A/B/C/D）→ 定性档位 */
export function gradeToLabel(grade: string): AnalysisLabel {
  switch (grade) {
    case 'A':
      return '强';
    case 'B':
      return '较好';
    case 'C':
      return '一般';
    default:
      return '偏弱';
  }
}

/** 综合评价用词（1.2.2「综合风险评价」一栏） */
export function overallVerdict(label: AnalysisLabel): string {
  switch (label) {
    case '强':
      return '优良';
    case '较好':
      return '良好';
    case '一般':
      return '一般';
    default:
      return '偏弱';
  }
}

/** 档位 → 星级标识（1.2.1） */
export function labelToStars(label: AnalysisLabel): string {
  switch (label) {
    case '强':
      return '★★★';
    case '较好':
      return '★★';
    case '一般':
      return '★';
    default:
      return '×';
  }
}

/** 档位 → 授信参考话术（1.2.1，措辞均以"供银行审批参考"收口） */
export function labelToReference(label: AnalysisLabel): string {
  switch (label) {
    case '强':
      return '经营与偿债指标整体优良，风险较低（供银行审批参考）';
    case '较好':
      return '各项指标处于正常区间，风险可控（供银行审批参考）';
    case '一般':
      return '部分指标偏弱，需关注担保与限额安排（供银行审批参考）';
    default:
      return '多项指标不达标，风险较高（供银行审批参考）';
  }
}
