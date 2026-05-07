/**
 * 业务格式化工具
 */

/** 万元 → 中文显示，自动判断万/亿 */
export function formatAmount(wan: number): string {
  if (wan >= 10000) return `${(wan / 10000).toFixed(2)} 亿元`;
  if (wan >= 100) return `${wan.toFixed(0)} 万元`;
  return `${wan.toFixed(1)} 万元`;
}

/** 数字千分位 */
export function formatNumber(n: number, decimals = 0): string {
  return n.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** 百分比 */
export function formatPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

/** 相对时间（简化版） */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 30) return `${days} 天前`;
  return dateStr.slice(0, 10);
}

/** 评分等级中文标签 */
export function gradeLabel(grade?: 'A' | 'B' | 'C' | 'D'): string {
  switch (grade) {
    case 'A':
      return '优';
    case 'B':
      return '良';
    case 'C':
      return '中';
    case 'D':
      return '差';
    default:
      return '—';
  }
}

/** 状态中文 */
export function statusLabel(s: string): string {
  const map: Record<string, string> = {
    draft: '草稿',
    'in-progress': '尽调中',
    'pending-review': '待审批',
    approved: '已通过',
    rejected: '已拒绝',
    'on-hold': '已挂起',
    generating: '生成中',
    completed: '已完成',
    failed: '失败',
    reviewing: '复核中',
    idle: '空闲',
    queued: '队列中',
    running: '运行中',
    success: '成功',
    skipped: '跳过',
  };
  return map[s] ?? s;
}

/** 优先级标签 */
export function priorityLabel(p: 'low' | 'medium' | 'high'): string {
  return { low: '低', medium: '中', high: '高' }[p];
}
