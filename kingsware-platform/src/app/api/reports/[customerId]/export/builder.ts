/**
 * 授信尽职调查报告 docx 生成器（编排器）
 *
 * 结构与打印版（src/app/(print)/credit/reports/[id]/print/）严格对齐：
 *   - 封面（含报告基础信息表）
 *   - 保密声明
 *   - 目录
 *   - 法人 10 章 + 7 附录 + 93 表（le-doc.ts）
 *     或 个体户 9 章 + 6 附录 + 62 表（sp-doc.ts）
 *   - 25 个 🤖 Agent 生成区从 src/data/agent-content.ts 读
 *
 * Agent 协同的产出在 docx 里同样可视化：每个 Agent 块标主责 Agent / 输入 / 输出 / 来源（model）。
 */

import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

import type { Customer, DueDiligenceReport } from '@/data/types';

import { leChapters } from './le-doc';
import {
  C,
  type DocxChild,
  FONT,
  pageBreak,
  sp,
  SZ,
} from './shared';
import { spChapters } from './sp-doc';

// ─── 主入口 ────────────────────────────────────
export async function buildDocx(
  customer: Customer,
  report: DueDiligenceReport,
  isLE: boolean,
): Promise<Uint8Array> {
  const kids: DocxChild[] = [];

  kids.push(...buildCover(customer, report, isLE));
  kids.push(pageBreak());
  kids.push(...buildConfidentialNotice(isLE));
  kids.push(pageBreak());
  kids.push(...buildToc(isLE));

  if (customer.type === 'legal-entity') {
    kids.push(...leChapters(customer, report));
  } else {
    kids.push(...spChapters(customer, report));
  }

  const doc = new Document({
    title: report.reportNumber,
    description: `${customer.name} 授信尽职调查报告`,
    styles: {
      default: {
        document: { run: { font: FONT, size: SZ, color: C.text } },
      },
    },
    sections: [{ children: kids }],
  });

  return Packer.toBuffer(doc) as unknown as Uint8Array;
}

// ─── 封面 ──────────────────────────────────────
function buildCover(
  customer: Customer,
  report: DueDiligenceReport,
  isLE: boolean,
): DocxChild[] {
  const out: DocxChild[] = [];

  out.push(sp(800));
  out.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: isLE ? '法人小微企业' : '个体工商户',
          font: FONT,
          size: 56,
          bold: true,
          color: C.primary,
        }),
      ],
    }),
  );
  out.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: '授信尽职调查报告',
          font: FONT,
          size: 56,
          bold: true,
          color: C.primary,
        }),
      ],
    }),
  );
  out.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({ text: report.reportNumber, font: FONT, size: 24, color: C.muted }),
      ],
    }),
  );
  out.push(sp(400));

  // 报告基础信息表（封面表 1）
  const rows: Array<[string, string]> = [
    ['报告编号', report.reportNumber],
    ['客户名称', customer.name],
    ['统一社会信用代码', customer.unifiedSocialCreditCode],
    ['客户类型', isLE ? '法人小微企业' : '个体工商户'],
  ];
  if (customer.type === 'legal-entity') {
    rows.push(
      ['法定代表人', customer.legalRepresentative],
      ['注册资本', `${customer.registeredCapital} 万元`],
      ['注册日期', customer.registeredAt],
    );
  } else {
    rows.push(
      ['经营者', customer.ownerName],
      ['字号名称', customer.shopName],
      ['店铺类型', customer.shopType],
    );
  }
  rows.push(
    ['所属行业', customer.industry],
    ['所在区域', customer.region],
    ['申请金额', `${customer.appliedAmount.toLocaleString('zh-CN')} 万元`],
    ['申请产品', customer.appliedProduct],
    ['客户经理', customer.manager],
    ['报告生成时间', report.generatedAt ?? customer.updatedAt],
    ['报告方式', `金智维 SDAFI v2.0 · ${isLE ? '16' : '14'} 个 Agent 协同自动尽调 + 客户经理复核`],
  );

  out.push(
    new Table({
      width: { size: 80, type: WidthType.PERCENTAGE },
      alignment: AlignmentType.CENTER,
      rows: rows.map(
        ([k, v]) =>
          new TableRow({
            children: [
              coverCell(k, { mu: true }),
              coverCell(v, { b: true }),
            ],
          }),
      ),
    }),
  );

  out.push(sp(300));
  out.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: '密级：机密 | 仅供内部授信审批使用',
          font: FONT,
          size: 18,
          color: C.muted,
        }),
      ],
    }),
  );
  out.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: '金智维 · 智慧信贷智能体平台 · KINGSWARE',
          font: FONT,
          size: 18,
          color: C.muted,
        }),
      ],
    }),
  );

  return out;
}

function coverCell(text: string, opts: { mu?: boolean; b?: boolean } = {}): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        spacing: { before: 80, after: 80 },
        alignment: opts.mu ? AlignmentType.RIGHT : AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            font: FONT,
            size: 22,
            bold: opts.b,
            color: opts.mu ? C.muted : C.text,
          }),
        ],
      }),
    ],
    borders: {
      top: { style: 'none' as never, size: 0, color: 'FFFFFF' },
      bottom: { style: 'none' as never, size: 0, color: 'FFFFFF' },
      left: { style: 'none' as never, size: 0, color: 'FFFFFF' },
      right: { style: 'none' as never, size: 0, color: 'FFFFFF' },
    },
  });
}

// ─── 保密声明 ──────────────────────────────────
function buildConfidentialNotice(isLE: boolean): DocxChild[] {
  const out: DocxChild[] = [];
  out.push(
    new Paragraph({
      heading: 'Heading2' as never,
      spacing: { before: 200, after: 160 },
      children: [
        new TextRun({ text: '保密声明', font: FONT, size: 28, bold: true, color: C.primary }),
      ],
    }),
  );
  const para = (s: string) =>
    new Paragraph({
      spacing: { after: 120, line: 380 },
      alignment: AlignmentType.JUSTIFIED,
      children: [new TextRun({ text: s, font: FONT, size: SZ, color: C.text })],
    });

  out.push(
    para(
      `本报告由金智维智慧信贷平台基于多源数据自动生成，内容包含${
        isLE
          ? '企业经营、财务、合规及关联方等敏感信息'
          : '经营者个人信息、店铺经营信息及关联信用信息'
      }。报告由客户银行委托生成，仅用于该笔授信申请的内部审批使用。`,
    ),
  );
  out.push(
    para(
      isLE
        ? '未经客户银行书面授权，任何机构或个人不得以任何方式复制、传播、转发本报告全部或部分内容，亦不得用于本笔授信审批以外的任何用途。'
        : '个体工商户的信息特别敏感（经营者个人信息为主），本报告涉及的所有个人数据均已取得经营者本人的电子授权（授权方式：H5 实名 + 人脸识别 + 电子签约），授权链条详见附录 D。',
    ),
  );
  out.push(
    para(
      '本报告依据的数据来源均符合《数据安全法》《个人信息保护法》《征信业务管理办法》及相关法律法规要求。',
    ),
  );
  out.push(
    para(
      '本报告为决策辅助工具，不构成《征信业务管理办法》项下的征信报告。最终授信决策由客户银行授信审批人员独立做出。',
    ),
  );
  return out;
}

// ─── 目录 ──────────────────────────────────────
function buildToc(isLE: boolean): DocxChild[] {
  const out: DocxChild[] = [];
  out.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
      children: [
        new TextRun({ text: '目  录', font: FONT, size: 36, bold: true, color: C.text }),
      ],
    }),
  );

  const tocH = (s: string) =>
    new Paragraph({
      spacing: { before: 120, after: 60 },
      children: [new TextRun({ text: s, font: FONT, size: 22, bold: true, color: C.text })],
    });
  const tocI = (s: string) =>
    new Paragraph({
      spacing: { after: 30, line: 320 },
      indent: { left: 320 },
      children: [new TextRun({ text: s, font: FONT, size: 19, color: C.text })],
    });

  if (isLE) {
    out.push(tocH('第一部分　报告摘要与授信参考'));
    out.push(tocI('1.1 企业综合分析摘要'));
    out.push(tocI('1.2 综合分析档位与授信参考'));
    out.push(tocI('1.3 一票否决项检查'));
    out.push(tocI('1.4 核心风险点提示'));
    out.push(tocI('1.5 授信结构性建议'));

    out.push(tocH('第二部分　企业概况与历史沿革（LE-A01）'));
    out.push(tocI('2.1 工商登记基本信息　2.2 股权结构与穿透　2.3 企业历史沿革'));
    out.push(tocI('2.4 主营业务与商业模式　2.5 核心产品与服务　2.6 经营场所与产能'));

    out.push(tocH('第三部分　实控人与管理团队（LE-A02）'));
    out.push(tocI('3.1 法定代表人画像　3.2 实际控制人识别　3.3 董监高履历　3.4 关联企业网络'));

    out.push(tocH('第四部分　行业与经营分析（LE-A03）'));
    out.push(tocI('4.1 行业概况与景气度　4.2 行业政策环境　4.3 竞争格局'));
    out.push(tocI('4.4 上下游产业链　4.5 经营波动性　4.6 SWOT 分析'));

    out.push(tocH('第五部分　财务深度分析（LE-A04）'));
    out.push(tocI('5.1 财务报表概览　5.2 资产负债结构　5.3 盈利能力'));
    out.push(tocI('5.4 现金流分析　5.5 营运能力　5.6 发票流水深度分析'));
    out.push(tocI('5.7 纳税申报与税负　5.8 关键比率横向对比　5.9 财务异动与解释'));

    out.push(tocH('第六部分　履约能力与征信（LE-A05）'));
    out.push(tocI('6.1 历史融资记录　6.2 多头借贷分析　6.3 招投标与履约　6.4 资产抵质押'));

    out.push(tocH('第七部分　企业综合分析明细（LE-A06/A07）'));
    out.push(tocI('7.1-7.5 企业综合分析明细　7.6 五对交叉验证'));

    out.push(tocH('第八部分　授信用途与还款来源（LE-A09）'));
    out.push(tocI('8.1 授信用途　8.2 第一还款来源　8.3 第二还款来源　8.4 压力测试'));

    out.push(tocH('第九部分　风险评估与缓释（LE-A08）'));
    out.push(tocI('9.1 风险地图　9.2-9.5 行业/经营/财务/法律合规风险与缓释'));

    out.push(tocH('第十部分　贷后管理方案（LE-A11）'));
    out.push(tocI('10.1 事件驱动监控　10.2 定期复核　10.3 预警分级　10.4 授权管理'));

    out.push(tocH('附录'));
    out.push(tocI('A 数据接口清单 ・ B 分析方法 ・ C 数据快照 ・ D 授权链条 ・ E 行业参考 ・ F 模型版本 ・ G 术语表'));
  } else {
    out.push(tocH('第一部分　报告摘要与授信意见'));
    out.push(tocI('1.1 四维综合评分摘要　1.2 信用等级与授信建议　1.3 一票否决检查　1.4 核心风险点'));

    out.push(tocH('第二部分　经营者画像（SP-A01）'));
    out.push(tocI('2.1 基本信息　2.2 通讯生活　2.3 婚姻家庭　2.4 教育职业　2.5 综合画像　2.6 关联企业'));

    out.push(tocH('第三部分　店铺与经营情况（SP-A02）'));
    out.push(tocI('3.1 工商登记　3.2 经营场所　3.3 烟草数据　3.4 电商数据　3.5 经营活跃度'));

    out.push(tocH('第四部分　经济能力与还款来源（SP-A03）'));
    out.push(tocI('4.1 收入水平　4.2 银行卡　4.3 不动产　4.4 车辆　4.5 还款能力'));

    out.push(tocH('第五部分　个人信用与多头借贷（SP-A05）'));
    out.push(tocI('5.1 信用预测评分　5.2 信贷行为指数　5.3 多头借贷　5.4 还款能力综合评分'));

    out.push(tocH('第六部分　四维评分明细（SP-A06）'));
    out.push(tocI('6.1 个人信用画像　6.2 经济能力　6.3 经营存续　6.4 合规社会'));

    out.push(tocH('第七部分　反欺诈与一票否决（SP-A04）'));
    out.push(tocI('7.1 五步反欺诈　7.2 一票否决核查　7.3 反欺诈综合分析'));

    out.push(tocH('第八部分　风险评估与缓释（SP-A07）'));
    out.push(tocI('8.1 风险地图　8.2-8.5 经营/个人/财务/失联风险与缓释'));

    out.push(tocH('第九部分　贷后管理方案（SP-A09）'));
    out.push(tocI('9.1 核心认知　9.2 行为监控　9.3 分级预警　9.4 授权管理'));

    out.push(tocH('附录'));
    out.push(tocI('A 数据接口清单 ・ B 评分算法 ・ C 数据快照 ・ D 授权链条 ・ E 模型版本 ・ F 术语表'));
  }

  return out;
}
