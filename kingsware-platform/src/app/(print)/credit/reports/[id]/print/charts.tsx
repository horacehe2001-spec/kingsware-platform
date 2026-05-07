'use client';

/**
 * 打印专用图表组件
 *
 * - 固定 width/height（不用 ResponsiveContainer）
 * - isAnimationActive=false（打印不需要动画）
 * - 浅色渐变 / 单色（适合纸面打印）
 * - 'use client'：recharts 是 client-only 库，靠浏览器 hydrate 后渲染。
 *   Chrome headless --print-to-pdf 默认会等到 onload 事件，hydrate 完成后图表可见。
 *   如打印时图未渲染，加 --virtual-time-budget=10000。
 *
 * 用作 chapters 里 ChartPlaceholder 的替代。docx 这边继续用文字占位
 * （recharts 输出 SVG，要嵌入 docx 还需要 SSR 截 PNG，先不做）。
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';

// 公共颜色（与打印 CSS 协调）
const COLOR = {
  primary: '#2563eb',
  primaryLight: '#bfdbfe',
  text: '#1e293b',
  muted: '#64748b',
  grid: '#e2e8f0',
  good: '#059669',
  warn: '#d97706',
  danger: '#e11d48',
  bg: '#f8fafc',
};

// ─── 图表外壳：标题 + 包裹 ──────────────────────
function ChartShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="print-chart-real">
      <div className="print-chart-real-head">
        <span className="print-chart-real-title">{title}</span>
        {description && <span className="print-chart-real-desc">{description}</span>}
      </div>
      <div className="print-chart-real-body">{children}</div>
    </div>
  );
}

// ─── 1. 雷达图（五维 / 四维评分）────────────────
export function PrintRadar({
  title,
  description,
  data,
}: {
  title: string;
  description?: string;
  data: { dimension: string; score: number; weight: number }[];
}) {
  const chartData = data.map((d) => ({ dimension: d.dimension, score: d.score, fullMark: 100 }));
  return (
    <ChartShell title={title} description={description}>
      <RadarChart data={chartData} width={520} height={320} outerRadius={110}>
        <PolarGrid gridType="polygon" stroke={COLOR.grid} strokeOpacity={0.7} />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fill: COLOR.text, fontSize: 11 }}
        />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          name="得分"
          dataKey="score"
          stroke={COLOR.primary}
          fill={COLOR.primary}
          fillOpacity={0.25}
          strokeWidth={2}
          isAnimationActive={false}
        />
      </RadarChart>
    </ChartShell>
  );
}

// ─── 2. 折线图（月度走势）─────────────────────
export function PrintLineTrend({
  title,
  description,
  data,
  xKey = 'month',
  yKey = 'value',
  yLabel,
}: {
  title: string;
  description?: string;
  data: Array<{ month: string; value: number }>;
  xKey?: string;
  yKey?: string;
  yLabel?: string;
}) {
  return (
    <ChartShell title={title} description={description}>
      <LineChart data={data} width={620} height={240} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
        <CartesianGrid stroke={COLOR.grid} strokeDasharray="3 3" />
        <XAxis dataKey={xKey} tick={{ fill: COLOR.muted, fontSize: 10 }} />
        <YAxis tick={{ fill: COLOR.muted, fontSize: 10 }} label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fill: COLOR.muted, fontSize: 10 } : undefined} />
        <Line
          type="monotone"
          dataKey={yKey}
          stroke={COLOR.primary}
          strokeWidth={2}
          dot={{ r: 3, fill: COLOR.primary }}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartShell>
  );
}

// ─── 3. 柱状图（月度走势 / 横向对比）────────────
export function PrintBarTrend({
  title,
  description,
  data,
  xKey = 'month',
  yKey = 'value',
  yLabel,
  color = COLOR.primary,
}: {
  title: string;
  description?: string;
  data: Array<Record<string, string | number>>;
  xKey?: string;
  yKey?: string;
  yLabel?: string;
  color?: string;
}) {
  return (
    <ChartShell title={title} description={description}>
      <BarChart data={data} width={620} height={240} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
        <CartesianGrid stroke={COLOR.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fill: COLOR.muted, fontSize: 10 }} />
        <YAxis tick={{ fill: COLOR.muted, fontSize: 10 }} label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fill: COLOR.muted, fontSize: 10 } : undefined} />
        <Bar dataKey={yKey} fill={color} radius={[3, 3, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ChartShell>
  );
}

// ─── 4. 多指标横向对比柱状图 ────────────────────
export function PrintMultiBar({
  title,
  description,
  data,
  series,
  xKey = 'metric',
}: {
  title: string;
  description?: string;
  data: Array<Record<string, string | number>>;
  series: Array<{ key: string; label: string; color: string }>;
  xKey?: string;
}) {
  return (
    <ChartShell title={title} description={description}>
      <BarChart data={data} width={620} height={280} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
        <CartesianGrid stroke={COLOR.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fill: COLOR.text, fontSize: 10 }} />
        <YAxis tick={{ fill: COLOR.muted, fontSize: 10 }} />
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} isAnimationActive={false} radius={[2, 2, 0, 0]} />
        ))}
      </BarChart>
      {/* 简易图例 */}
      <div className="print-chart-real-legend">
        {series.map((s) => (
          <span key={s.key} className="print-chart-real-legend-item">
            <span className="print-chart-real-legend-dot" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </ChartShell>
  );
}

// ─── 5. 饼图（资产负债结构）────────────────────
export function PrintPie({
  title,
  description,
  data,
}: {
  title: string;
  description?: string;
  data: Array<{ name: string; value: number; color?: string }>;
}) {
  const PIE_COLORS = [COLOR.primary, '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ChartShell title={title} description={description}>
      <div className="print-chart-real-pie-wrap">
        <PieChart width={280} height={240}>
          <Pie
            data={data}
            cx={140}
            cy={120}
            innerRadius={50}
            outerRadius={95}
            paddingAngle={2}
            dataKey="value"
            isAnimationActive={false}
          >
            {data.map((d, i) => (
              <Cell key={d.name} fill={d.color ?? PIE_COLORS[i % PIE_COLORS.length]} stroke="#fff" strokeWidth={2} />
            ))}
          </Pie>
        </PieChart>
        <ul className="print-chart-real-pie-legend">
          {data.map((d, i) => (
            <li key={d.name}>
              <span className="print-chart-real-legend-dot" style={{ background: d.color ?? PIE_COLORS[i % PIE_COLORS.length] }} />
              <span className="print-chart-real-pie-name">{d.name}</span>
              <span className="print-chart-real-pie-pct">{((d.value / total) * 100).toFixed(1)}%</span>
              <span className="print-chart-real-pie-val">{d.value.toLocaleString('zh-CN')}</span>
            </li>
          ))}
        </ul>
      </div>
    </ChartShell>
  );
}

// ─── 6. 风险地图矩阵（散点图）──────────────────
export function PrintRiskMatrix({
  title,
  description,
  risks,
}: {
  title: string;
  description?: string;
  /** likelihood: 1-4（低/中/高/极高），severity: 1-4 */
  risks: Array<{ point: string; likelihood: number; severity: number; category: string }>;
}) {
  const categoryColors: Record<string, string> = {
    经营: COLOR.primary,
    财务: '#8b5cf6',
    合规: '#10b981',
    行业: '#f59e0b',
    个人: '#06b6d4',
    失联: '#ef4444',
    欺诈: '#ef4444',
    关联方: '#a78bfa',
  };
  const points = risks.map((r) => ({
    x: r.likelihood,
    y: r.severity,
    name: r.point,
    category: r.category,
    color: categoryColors[r.category] ?? COLOR.primary,
  }));
  return (
    <ChartShell title={title} description={description}>
      <ScatterChart width={520} height={300} margin={{ top: 20, right: 20, bottom: 30, left: 30 }}>
        <CartesianGrid stroke={COLOR.grid} strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey="x"
          name="发生可能性"
          domain={[0, 5]}
          ticks={[1, 2, 3, 4]}
          tickFormatter={(v) => ['', '低', '中', '高', '极高'][v] ?? ''}
          tick={{ fill: COLOR.muted, fontSize: 10 }}
          label={{ value: '发生可能性 →', position: 'insideBottom', offset: -5, fill: COLOR.muted, fontSize: 10 }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name="影响严重性"
          domain={[0, 5]}
          ticks={[1, 2, 3, 4]}
          tickFormatter={(v) => ['', '低', '中', '高', '极高'][v] ?? ''}
          tick={{ fill: COLOR.muted, fontSize: 10 }}
          label={{ value: '影响严重性 ↑', angle: -90, position: 'insideLeft', fill: COLOR.muted, fontSize: 10 }}
        />
        <ZAxis range={[200, 200]} />
        {/* 四象限分割线 */}
        <ReferenceLine x={2.5} stroke={COLOR.grid} strokeDasharray="2 4" />
        <ReferenceLine y={2.5} stroke={COLOR.grid} strokeDasharray="2 4" />
        <Scatter data={points} isAnimationActive={false}>
          {points.map((p, i) => (
            <Cell key={i} fill={p.color} />
          ))}
        </Scatter>
      </ScatterChart>
      <ul className="print-chart-real-risk-list">
        {risks.map((r, i) => (
          <li key={`${r.point}-${i}`}>
            <span className="print-chart-real-legend-dot" style={{ background: categoryColors[r.category] ?? COLOR.primary }} />
            <span>{r.point}</span>
            <span className="print-meta">（{r.category} · {['', '低', '中', '高', '极高'][r.likelihood]} × {['', '低', '中', '高', '极高'][r.severity]}）</span>
          </li>
        ))}
      </ul>
    </ChartShell>
  );
}

// ─── 7. 股权穿透树（自定义层级图）──────────────
export function PrintEquityTree({
  title,
  description,
  rootName,
  shareholders,
  controllerNote,
}: {
  title: string;
  description?: string;
  rootName: string;
  shareholders: Array<{ name: string; ratio: string; type: string }>;
  controllerNote?: string;
}) {
  return (
    <ChartShell title={title} description={description}>
      <div className="print-equity-tree">
        <div className="print-equity-node print-equity-root">
          <div className="print-equity-node-name">{rootName}</div>
          <div className="print-equity-node-tag">本企业</div>
        </div>
        <div className="print-equity-line" />
        <div className="print-equity-row">
          {shareholders.map((s, i) => (
            <div key={`${s.name}-${i}`} className="print-equity-shareholder">
              <div className="print-equity-edge">
                <span className="print-equity-edge-ratio">{s.ratio}</span>
              </div>
              <div className="print-equity-node">
                <div className="print-equity-node-name">{s.name}</div>
                <div className="print-equity-node-tag">{s.type}</div>
              </div>
            </div>
          ))}
        </div>
        {controllerNote && <div className="print-equity-note">{controllerNote}</div>}
      </div>
    </ChartShell>
  );
}

// ─── 8. 关联方网络（径向图，简化版）─────────────
export function PrintRelatedNetwork({
  title,
  description,
  rootName,
  related,
}: {
  title: string;
  description?: string;
  rootName: string;
  related: Array<{ name: string; type: string; tag: string }>;
}) {
  // 用极坐标分布
  const N = related.length;
  return (
    <ChartShell title={title} description={description}>
      <svg width={520} height={300} viewBox="0 0 520 300" xmlns="http://www.w3.org/2000/svg">
        {/* 中心节点 */}
        <circle cx={260} cy={150} r={55} fill={COLOR.primary} fillOpacity={0.12} stroke={COLOR.primary} strokeWidth={1.5} />
        <text x={260} y={148} textAnchor="middle" fontSize={11} fill={COLOR.text} fontWeight={600}>
          {rootName.length > 10 ? rootName.slice(0, 9) + '…' : rootName}
        </text>
        <text x={260} y={163} textAnchor="middle" fontSize={9} fill={COLOR.muted}>本企业</text>
        {/* 周边关联 */}
        {related.map((r, i) => {
          const angle = (i / Math.max(N, 1)) * 2 * Math.PI - Math.PI / 2;
          const x = 260 + Math.cos(angle) * 110;
          const y = 150 + Math.sin(angle) * 95;
          const isAttention = r.tag.includes('关注') || r.tag.includes('需审查');
          const fillColor = isAttention ? '#fef3c7' : '#ecfdf5';
          const strokeColor = isAttention ? COLOR.warn : COLOR.good;
          return (
            <g key={`${r.name}-${i}`}>
              <line x1={260} y1={150} x2={x} y2={y} stroke={COLOR.grid} strokeDasharray="3 3" strokeWidth={1} />
              <ellipse cx={x} cy={y} rx={55} ry={20} fill={fillColor} stroke={strokeColor} strokeWidth={1} />
              <text x={x} y={y - 2} textAnchor="middle" fontSize={9} fill={COLOR.text}>
                {r.name.length > 12 ? r.name.slice(0, 11) + '…' : r.name}
              </text>
              <text x={x} y={y + 10} textAnchor="middle" fontSize={8} fill={COLOR.muted}>
                {r.type}
              </text>
            </g>
          );
        })}
      </svg>
      <ul className="print-chart-real-risk-list">
        {related.map((r, i) => (
          <li key={`${r.name}-${i}`}>
            <span className="print-chart-real-legend-dot" style={{ background: r.tag.includes('关注') || r.tag.includes('需审查') ? COLOR.warn : COLOR.good }} />
            <span>{r.name}</span>
            <span className="print-meta">（{r.type} · {r.tag}）</span>
          </li>
        ))}
      </ul>
    </ChartShell>
  );
}

// ─── 9. 数据辅助：把"年合计"派生成"月度数据" ─────
/**
 * 给定 12 月总量 + 波动系数，按季节性分布生成月度数据。
 * 用于打印图表的视觉填充，不是真实数据。
 */
export function syntheticMonthly(yearTotal: number, volatility = 0.18, seed = 1): Array<{ month: string; value: number }> {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const base = yearTotal / 12;
  // 简单伪随机：基于 seed 的正弦扰动 + 季节性峰值（Q3-Q4 高）
  return months.map((m, i) => {
    const seasonal = 1 + Math.sin(((i - 2) / 12) * 2 * Math.PI) * 0.12;
    const noise = Math.sin((i + seed) * 1.7) * volatility;
    return {
      month: m,
      value: Math.max(0, Math.round(base * seasonal * (1 + noise))),
    };
  });
}
