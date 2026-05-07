/**
 * 打印报告 · 共用组件
 * 用于把"模板里的元素"映射到 React：
 *   - SectionTitle（章节/子节）
 *   - PrintKv（键值表，左灰右值）
 *   - PrintTable（标准表格）
 *   - AgentBlock（🤖 Agent 生成区，标主责 Agent + prompt + 实际内容）
 *   - ChartPlaceholder（📊 图表占位）
 *   - DataSource（数据来源行）
 */

import type { ReactNode } from 'react';
import { Fragment } from 'react';

import { getAgentContent, parseInlineBold } from '@/data/agent-content';
import { findPrompt } from '@/lib/agent-prompts';

export function SectionH1({ children }: { children: ReactNode }) {
  return <h1 className="print-h1">{children}</h1>;
}

export function SectionH2({
  number,
  title,
  agentId,
}: {
  number?: string;
  title: string;
  agentId?: string;
}) {
  return (
    <div className="print-h2-wrap">
      <h2 className="print-h2">
        {number ? `${number}  ` : ''}
        {title}
      </h2>
      {agentId && (
        <span className="print-agent-tag">主责 {agentId}</span>
      )}
    </div>
  );
}

export function SectionH3({
  number,
  title,
  agentId,
}: {
  number?: string;
  title: string;
  agentId?: string;
}) {
  return (
    <div className="print-h2-wrap">
      <h3 className="print-h3">
        {number ? `${number}  ` : ''}
        {title}
      </h3>
      {agentId && (
        <span className="print-agent-tag">主责 {agentId}</span>
      )}
    </div>
  );
}

export function DataSource({ children }: { children: ReactNode }) {
  return <p className="print-meta">数据来源：{children}</p>;
}

export function PrintKv({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <table className="print-kv">
      <tbody>
        {rows.map(([k, v], i) => (
          <tr key={`${k}-${i}`}>
            <td className="print-kv-key">{k}</td>
            <td className="print-kv-val">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function PrintTable({
  header,
  rows,
  caption,
}: {
  header: string[];
  rows: ReactNode[][];
  caption?: string;
}) {
  return (
    <>
      {caption && <p className="print-table-caption">{caption}</p>}
      <table className="print-table">
        <thead>
          <tr>
            {header.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/**
 * 🤖 Agent 生成区
 * 模板里的特殊单元格——标注主责 Agent + prompt 元数据 + 实际内容。
 *
 * 内容来源：data/agent-content.ts 字典（按 customerId × blockId 索引）。
 * 字典初始为人工 mock；scripts/generate-agent-content.mjs 调 DeepSeek 重写后实现"真 LLM 生成"。
 *
 * 落到组件里只传 blockId + customerId，prompt 元数据从 agent-prompts.ts 反查。
 * 找不到内容时回退到 children（兜底）或显示"待生成"提示。
 */
export function AgentBlock({
  blockId,
  customerId,
  children,
}: {
  blockId: string;
  customerId: string;
  /** 兜底渲染：当字典里没有该 blockId 的内容时使用 */
  children?: ReactNode;
}) {
  const prompt = findPrompt(blockId);
  const content = getAgentContent(customerId, blockId);

  const agentId = prompt?.agentId ?? '—';
  const agentName = prompt?.agentName ?? blockId;

  const sourceTag =
    content?.source === 'mock' ? 'mock' :
    content?.source ? `${content.source}${content.model ? ` · ${content.model}` : ''}` :
    '待生成';

  return (
    <div className="print-agent-block">
      <div className="print-agent-block-head">
        <span className="print-agent-block-icon">🤖</span>
        <span className="print-agent-block-title">
          Agent 生成区 · {agentName}
        </span>
        <span className="print-agent-block-id">{agentId}</span>
      </div>
      {prompt && (
        <div className="print-agent-block-meta">
          <p>· 输入数据：{prompt.inputs}</p>
          <p>· 输出格式：{prompt.outputFormat}</p>
          <p>· 预期篇幅：{prompt.expectedLength}　·　来源：{sourceTag}</p>
        </div>
      )}
      <div className="print-agent-block-body">
        {content ? renderParagraphs(content.paragraphs) : children}
      </div>
    </div>
  );
}

function renderParagraphs(paragraphs: string[]): ReactNode {
  return paragraphs.map((p, i) => (
    <p key={i}>
      {parseInlineBold(p).map((tok, j) => (
        <Fragment key={j}>
          {tok.bold ? <strong>{tok.text}</strong> : tok.text.split('\n').flatMap((line, li, arr) =>
            li < arr.length - 1 ? [line, <br key={`br-${j}-${li}`} />] : [line],
          )}
        </Fragment>
      ))}
    </p>
  ));
}

/**
 * 📊 图表占位
 * 模板里的图表（雷达/柱图/折线/股权穿透/风险地图等），
 * 在打印版里以"占位 + 文字描述"形式呈现。
 */
export function ChartPlaceholder({
  type,
  title,
  description,
}: {
  type: '雷达图' | '柱状图' | '折线图' | '饼图' | '矩阵图' | '网络图' | '穿透图';
  title: string;
  description?: string;
}) {
  return (
    <div className="print-chart-ph">
      <div className="print-chart-ph-head">
        <span>📊 {type}</span>
        <span className="print-chart-ph-title">{title}</span>
      </div>
      {description && <p className="print-chart-ph-desc">{description}</p>}
    </div>
  );
}

export function PageBreak() {
  return <div className="print-page-break" />;
}
