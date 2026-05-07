/**
 * docx builder · 共用元素
 * - h1/h2/h3：章节标题（每个 H1 强制分页）
 * - kv：键值表（左灰右值）
 * - dt：标准数据表
 * - agentBlock：🤖 Agent 生成区（含主责 Agent / 输入 / 输出 / 来源 + 字典内容）
 * - chartPlaceholder：📊 图表占位
 * - dataSource：数据来源行
 *
 * 元素生成函数都返回 (Paragraph | Table)[]，由章节模块按顺序拼。
 */

import {
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  type ParagraphChild,
} from 'docx';

import { getAgentContent, parseInlineBold } from '@/data/agent-content';
import { findPrompt } from '@/lib/agent-prompts';

// ─── 样式常量 ─────────────────────────────────
export const FONT = 'Microsoft YaHei';
export const SZ = 21; // 10.5pt 正文
export const C = {
  primary: '2563EB',
  text: '1E293B',
  muted: '64748B',
  border: 'E2E8F0',
  agentBlockBg: 'F8FAFF',
  agentTagBg: 'EFF6FF',
  agentTagBorder: 'BFDBFE',
  chartBg: 'F8FAFC',
  chartBorder: 'CBD5E1',
  a: '059669',
  c: 'B45309',
  d: 'E11D48',
};

export type DocxChild = Paragraph | Table;

// ─── 标题 ─────────────────────────────────────

/** 一级标题（章节）：自动 page-break-before */
export function h1(text: string, opts: { firstChapter?: boolean } = {}): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: !opts.firstChapter,
    spacing: { before: 400, after: 240 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: C.primary, space: 4 } },
    children: [new TextRun({ text, font: FONT, size: 36, bold: true, color: C.text })],
  });
}

/** 二级标题（节）+ 可选主责 Agent 标签 */
export function h2(num: string, title: string, agentId?: string): Paragraph {
  const children: ParagraphChild[] = [
    new TextRun({ text: `${num}  ${title}`, font: FONT, size: 28, bold: true, color: C.primary }),
  ];
  if (agentId) {
    children.push(
      new TextRun({ text: `  主责 ${agentId}`, font: FONT, size: 18, color: C.primary }),
    );
  }
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 140 },
    keepNext: true,
    children,
  });
}

/** 三级标题（小节） */
export function h3(num: string, title: string, agentId?: string): Paragraph {
  const children: ParagraphChild[] = [
    new TextRun({ text: `${num}  ${title}`, font: FONT, size: 24, bold: true, color: '334155' }),
  ];
  if (agentId) {
    children.push(
      new TextRun({ text: `  主责 ${agentId}`, font: FONT, size: 17, color: C.primary }),
    );
  }
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 100 },
    keepNext: true,
    children,
  });
}

// ─── 段落 ─────────────────────────────────────

/** 普通段落 */
export function p(text: string, opts: { bold?: boolean; sz?: number; color?: string } = {}): Paragraph {
  return new Paragraph({
    spacing: { after: 120, line: 360 },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: opts.sz ?? SZ,
        bold: opts.bold,
        color: opts.color ?? C.text,
      }),
    ],
  });
}

/** 数据来源行（小灰字） */
export function dataSource(s: string): Paragraph {
  return new Paragraph({
    spacing: { before: 40, after: 100 },
    children: [
      new TextRun({ text: '数据来源：', font: FONT, size: 18, color: C.muted }),
      new TextRun({ text: s, font: FONT, size: 18, color: C.muted }),
    ],
  });
}

/** 段间空白 */
export function sp(pts = 120): Paragraph {
  return new Paragraph({ spacing: { after: pts } });
}

// ─── 表格 ─────────────────────────────────────

/** 键值表：左灰键 + 右值 */
export function kv(rows: Array<{ k: string; v: string; hl?: boolean }>): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map((r) =>
      new TableRow({
        children: [
          tc(r.k, { w: 30, mu: true }),
          tc(r.v, { w: 70, b: r.hl, c: r.hl ? C.primary : undefined }),
        ],
      }),
    ),
  });
}

/** 标准数据表：第一行表头 */
export function dt(hd: string[], rows: string[][]): Table {
  const w = Math.floor(100 / hd.length);
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: hd.map((h) => tc(h, { w, b: true, hd: true })),
      }),
      ...rows.map(
        (r) =>
          new TableRow({
            children: r.map((cell) => tc(cell, { w })),
          }),
      ),
    ],
  });
}

/** 表格单元格 */
export function tc(
  t: string,
  opts: {
    w?: number;
    b?: boolean;
    mu?: boolean;
    c?: string;
    hd?: boolean;
    fill?: string;
  } = {},
): TableCell {
  return new TableCell({
    width: opts.w ? { size: opts.w, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.hd
      ? { fill: 'F1F5F9' }
      : opts.fill
        ? { fill: opts.fill }
        : undefined,
    children: [
      new Paragraph({
        spacing: { before: 30, after: 30 },
        children: [
          new TextRun({
            text: t,
            font: FONT,
            size: opts.hd ? 19 : 20,
            bold: opts.b ?? opts.hd,
            color: opts.c ?? (opts.mu ? C.muted : C.text),
          }),
        ],
      }),
    ],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: C.border },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: C.border },
      left: { style: BorderStyle.SINGLE, size: 1, color: C.border },
      right: { style: BorderStyle.SINGLE, size: 1, color: C.border },
    },
  });
}

// ─── 🤖 Agent 生成区 ──────────────────────────

/**
 * 渲染 🤖 Agent 生成区。
 * - 标主责 Agent / 输入 / 输出 / 篇幅 / 来源（model）
 * - 实际内容来自 src/data/agent-content.ts，经 DeepSeek 生成
 *
 * 使用单格 1×1 Table 模拟边框 + 浅蓝底色。
 */
export function agentBlock(blockId: string, customerId: string): DocxChild[] {
  const prompt = findPrompt(blockId);
  const content = getAgentContent(customerId, blockId);

  const head = new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: '🤖 ', font: FONT, size: 22 }),
      new TextRun({
        text: `Agent 生成区 · ${prompt?.agentName ?? blockId}`,
        font: FONT,
        size: 22,
        bold: true,
        color: '1E40AF',
      }),
      new TextRun({
        text: `   ${prompt?.agentId ?? ''}`,
        font: FONT,
        size: 18,
        color: C.primary,
      }),
    ],
  });

  const meta: Paragraph[] = [];
  if (prompt) {
    meta.push(
      mutedLine(`· 输入数据：${prompt.inputs}`),
      mutedLine(`· 输出格式：${prompt.outputFormat}`),
      mutedLine(
        `· 预期篇幅：${prompt.expectedLength}　·　来源：${
          content?.source === 'mock' || !content?.source
            ? '待生成'
            : `${content.source}${content.model ? ` · ${content.model}` : ''}`
        }`,
      ),
    );
  }

  const body: Paragraph[] = [];
  if (content) {
    for (const para of content.paragraphs) {
      body.push(paragraphFromInline(para));
    }
  } else {
    body.push(
      p(
        `【${prompt?.agentId ?? ''} ${prompt?.agentName ?? ''} · ${prompt?.sectionNumber ?? ''} ${prompt?.sectionTitle ?? ''}】尚未由 LLM 生成`,
        { color: C.muted },
      ),
    );
  }

  // 用单格表格框住 Agent 块，呈现"卡片"视感
  const inner: Paragraph[] = [head, ...meta, sp(40), ...body];
  const wrapper = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: C.agentBlockBg },
            children: inner,
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: C.primary },
              bottom: { style: BorderStyle.DASHED, size: 4, color: C.primary },
              left: { style: BorderStyle.SINGLE, size: 24, color: C.primary },
              right: { style: BorderStyle.DASHED, size: 4, color: C.primary },
            },
          }),
        ],
      }),
    ],
  });

  return [wrapper, sp(80)];
}

function mutedLine(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 40, line: 280 },
    children: [new TextRun({ text, font: FONT, size: 17, color: C.muted })],
  });
}

/** 把"含 **粗体** 标记 + 段内 \n 换行"的字符串转成 Paragraph */
function paragraphFromInline(s: string): Paragraph {
  const tokens = parseInlineBold(s);
  const runs: TextRun[] = [];
  for (const t of tokens) {
    // 段内 \n → 换行（docx 用 break: 1）
    const lines = t.text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      runs.push(
        new TextRun({
          text: lines[i],
          font: FONT,
          size: SZ,
          bold: t.bold,
          color: C.text,
          break: i > 0 ? 1 : 0,
        }),
      );
    }
  }
  return new Paragraph({
    spacing: { after: 120, line: 360 },
    alignment: AlignmentType.JUSTIFIED,
    children: runs,
  });
}

// ─── 📊 图表占位 ──────────────────────────────

export function chartPlaceholder(
  type: '雷达图' | '柱状图' | '折线图' | '饼图' | '矩阵图' | '网络图' | '穿透图',
  title: string,
  description?: string,
): DocxChild[] {
  const inner: Paragraph[] = [
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: `📊 ${type}`, font: FONT, size: 22, bold: true, color: C.text }),
        new TextRun({ text: `   ${title}`, font: FONT, size: 19, color: C.muted }),
      ],
    }),
  ];
  if (description) {
    inner.push(
      new Paragraph({
        spacing: { after: 40, line: 280 },
        children: [new TextRun({ text: description, font: FONT, size: 18, color: C.muted })],
      }),
    );
  }
  const wrapper = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: C.chartBg },
            children: inner,
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: C.chartBorder },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: C.chartBorder },
              left: { style: BorderStyle.SINGLE, size: 4, color: C.chartBorder },
              right: { style: BorderStyle.SINGLE, size: 4, color: C.chartBorder },
            },
          }),
        ],
      }),
    ],
  });
  return [wrapper, sp(80)];
}

// ─── 强制分页 ─────────────────────────────────
export function pageBreak(): Paragraph {
  return new Paragraph({ pageBreakBefore: true, children: [] });
}

// ─── 横线 ─────────────────────────────────────
export function hr(): Paragraph {
  return new Paragraph({
    spacing: { before: 160, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' } },
  });
}

/** 表格标题（小字提示，放在表格上方） */
export function tableCaption(s: string): Paragraph {
  return new Paragraph({
    spacing: { before: 80, after: 40 },
    children: [new TextRun({ text: s, font: FONT, size: 18, color: '475569' })],
  });
}
