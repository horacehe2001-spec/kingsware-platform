/**
 * 法人小微企业 docx 章节
 * 与 src/app/(print)/credit/reports/[id]/print/le-chapters.tsx 对齐：
 * 10 章 + 7 附录 + 93 张表，每个 Agent 生成区从 agent-content.ts 字典读。
 */

import { getLeProfile } from '@/data/customer-profiles';
import type { LegalEntityCustomer, DueDiligenceReport } from '@/data/types';

import {
  agentBlock,
  chartPlaceholder,
  C,
  dataSource,
  dt,
  type DocxChild,
  h1,
  h2,
  h3,
  hr,
  kv,
  p,
  pageBreak,
  sp,
} from './shared';

import { Paragraph, TextRun, AlignmentType } from 'docx';

const FONT = 'Microsoft YaHei';

export function leChapters(
  customer: LegalEntityCustomer,
  report: DueDiligenceReport,
): DocxChild[] {
  const v = customer.fiveDimensionScores!;
  const profile = getLeProfile(customer);
  const totalScore = report.totalScore ?? 78;
  const grade = report.creditGrade ?? 'B';
  const out: DocxChild[] = [];

  // ═══ 第一部分 ═══
  out.push(h1('第一部分　报告摘要与授信意见', { firstChapter: true }));
  out.push(
    p(
      '本部分为本报告的核心结论摘要，授信审批人员可通过本部分快速掌握企业整体信用画像、风险等级、核心风险点及授信建议。详细数据支撑见后续各部分。',
    ),
  );

  out.push(h2('1.1', '五维综合评分摘要', 'LE-A06'));
  out.push(
    dt(
      ['评分维度', '权重', '得分(0-100)', '加权分', '评级', '本维度备注'],
      [
        ['经营稳定性', '30%', String(v.operationStability), (v.operationStability * 0.3).toFixed(1), gradeOf(v.operationStability), '近三年营收复合增长 16%，管理层稳定'],
        ['财务健康度', '25%', String(v.financialHealth), (v.financialHealth * 0.25).toFixed(1), gradeOf(v.financialHealth), '资产负债率 48.6%，应收账款周转偏长'],
        ['履约能力', '25%', String(v.performance), (v.performance * 0.25).toFixed(1), gradeOf(v.performance), '近 36 月融资 6 笔均已结清'],
        ['合规性', '15%', String(v.compliance), (v.compliance * 0.15).toFixed(1), gradeOf(v.compliance), '无重大行政处罚、无失信记录'],
        ['成长性', '5%', String(v.growth), (v.growth * 0.05).toFixed(1), gradeOf(v.growth), '行业景气度上行，研发投入 7.2%'],
        ['综合得分', '100%', String(totalScore), String(totalScore), grade, '—'],
      ],
    ),
  );
  out.push(sp(80));
  out.push(...chartPlaceholder('雷达图', '五维评分雷达图',
    `经营稳定性 ${v.operationStability} / 财务健康度 ${v.financialHealth} / 履约能力 ${v.performance} / 合规性 ${v.compliance} / 成长性 ${v.growth}`));

  out.push(h2('1.2', '信用等级与授信建议'));
  out.push(h3('1.2.1', '信用等级标准'));
  out.push(
    dt(
      ['等级', '分数区间', '授信建议', '标识'],
      [
        ['A', '85-100', '建议批准（优质客户，可适当放宽）', '★★★'],
        ['B', '70-84', '建议批准（标准条件）', '★★'],
        ['C', '55-69', '有条件批准（须强化担保或限额）', '★'],
        ['D', '<55', '建议否决', '×'],
      ],
    ),
  );
  out.push(sp());

  out.push(h3('1.2.2', '本次授信建议', 'LE-A10'));
  if (report.recommendation) {
    const r = report.recommendation;
    out.push(
      kv([
        { k: '综合风险评级', v: `${grade}（${gradeText(grade)}）`, hl: true },
        { k: '授信决策', v: r.decision, hl: true },
        { k: '建议金额', v: `${r.amount.toLocaleString('zh-CN')} 万元`, hl: true },
        { k: '建议期限', v: `${r.term} 个月` },
        { k: '建议利率', v: r.rate },
        { k: '担保方式', v: r.guarantee },
        { k: '还款方式', v: '按月付息，到期还本' },
        { k: '关键风控条件', v: r.conditions.join('；') },
      ]),
    );
  }

  out.push(h2('1.3', '一票否决项检查', 'SE-01'));
  const vetoHit = report.oneVoteVeto.filter((x) => x.triggered);
  out.push(
    p(
      `本节列示监管要求和银行内部规定下的一票否决项，共 ${report.oneVoteVeto.length} 项。任一项命中，授信申请直接拒绝。本次核查：触发 ${vetoHit.length} 项，通过 ${report.oneVoteVeto.length - vetoHit.length} 项。`,
    ),
  );
  out.push(
    dt(
      ['否决项', '数据来源接口', '检查结果', '是否触发'],
      report.oneVoteVeto.map((it) => [
        it.item,
        it.apiSource,
        it.triggered ? '命中' : '未命中',
        it.triggered ? '✗ 触发' : '✓ 通过',
      ]),
    ),
  );

  out.push(h2('1.4', '核心风险点提示', 'LE-A10'));
  out.push(...agentBlock('LE-1.4-core-risks', customer.id));

  out.push(h2('1.5', '授信结构性建议', 'LE-A10'));
  out.push(...agentBlock('LE-1.5-credit-structure', customer.id));

  // ═══ 第二部分 LE-A01 ═══
  out.push(h1('第二部分　企业概况与历史沿革'));
  out.push(p('本部分系统呈现企业的工商基本信息、股权结构、发展历史、商业模式、核心产品与经营场所。整章主责 Agent：LE-A01 企业画像。'));

  out.push(h2('2.1', '工商登记基本信息', 'LE-A01'));
  out.push(dataSource('工商信息综合查询（大工商）+ 企业工商基本信息接口'));
  out.push(
    kv([
      { k: '企业名称', v: customer.name },
      { k: '曾用名', v: profile.formerName },
      { k: '统一社会信用代码', v: customer.unifiedSocialCreditCode },
      { k: '企业类型', v: profile.enterpriseType },
      { k: '法定代表人', v: customer.legalRepresentative },
      { k: '注册资本', v: `${customer.registeredCapital} 万元（实缴 ${customer.registeredCapital} 万元）` },
      { k: '注册日期', v: customer.registeredAt },
      { k: '登记机关', v: profile.registrationAuthority },
      { k: '登记状态', v: profile.registrationStatus },
      { k: '注册地址', v: profile.registeredAddress },
    ]),
  );

  out.push(h3('2.1.1', '经营范围', 'LE-A01'));
  out.push(p(profile.businessScope));

  out.push(h3('2.1.2', '分支机构', 'LE-A01'));
  out.push(dataSource('企业分支机构接口'));
  out.push(
    dt(
      ['序号', '分支机构名称', '类型', '成立日期', '登记状态'],
      profile.branches.length > 0
        ? profile.branches.map((b, i) => [String(i + 1), b.name, b.type, b.foundedAt, b.status])
        : [['—', '本企业暂无登记分支机构', '—', '—', '—']],
    ),
  );

  out.push(h3('2.1.3', '历史工商变更（近三年）', 'LE-A01'));
  out.push(dataSource('企业工商变更接口 | 显示近三年内重大变更'));
  out.push(
    dt(
      ['变更日期', '变更项', '变更前', '变更后'],
      profile.historyChanges.length > 0
        ? profile.historyChanges.map((c) => [c.date, c.item, c.before, c.after])
        : [['—', '近三年无重大工商变更', '—', '—']],
    ),
  );

  out.push(h2('2.2', '股权结构与穿透', 'LE-A01'));

  out.push(h3('2.2.1', '股东出资明细'));
  out.push(dataSource('企业股东及出资 + 企业股东信息（工商公示）接口'));
  out.push(
    dt(
      ['股东名称', '股东类型', '出资额(万)', '持股比例', '出资方式', '实缴情况'],
      profile.shareholders.map((s) => [s.name, s.type, s.amount, s.ratio, s.method, s.paidIn]),
    ),
  );

  out.push(h3('2.2.2', '股权穿透分析'));
  out.push(dataSource('企业股权透视 + 企业股权穿透查询 + 企业最终控制方 + 企业受益所有人'));
  out.push(
    ...chartPlaceholder(
      '穿透图',
      '股权穿透图（三层穿透）',
      `${profile.controllerName}直接持股 ${profile.controllerDirectStake}${
        profile.controllerIndirectStake !== '0%'
          ? ` + 通过${profile.controllerIndirectVehicle}间接持有 ${profile.controllerIndirectStake}`
          : ''
      }，合计穿透持有 ${profile.controllerTotalStake} 受益权`,
    ),
  );
  out.push(
    kv([
      { k: '最终控制方', v: `${profile.controllerName} 持股 ${profile.controllerTotalStake}（穿透）` },
      { k: '实际控制人识别依据', v: '央行 235 号文受益所有人识别标准' },
      { k: '是否多层嵌套', v: profile.controllerIndirectStake === '0%' ? '否（直接持有）' : '否（最多两层）' },
      { k: '是否存在代持嫌疑', v: '否' },
    ]),
  );

  out.push(h3('2.2.3', '股权特殊事项'));
  out.push(dataSource('企业股权冻结 + 企业股权出质'));
  out.push(
    dt(
      ['事项类型', '标的股东', '金额/比例', '状态', '起止时间'],
      profile.shareholderEvents.length > 0
        ? profile.shareholderEvents.map((e) => [e.kind, e.subject, e.amount, e.status, e.period])
        : [['—', '—', '—', '本企业股权未发生冻结、出质', '—']],
    ),
  );

  out.push(h2('2.3', '企业历史沿革与发展', 'LE-A01'));
  out.push(...agentBlock('LE-2.3-history', customer.id));

  out.push(h2('2.4', '主营业务与商业模式', 'LE-A01'));
  out.push(...agentBlock('LE-2.4-business-model', customer.id));

  out.push(h2('2.5', '核心产品与服务', 'LE-A01'));
  out.push(dataSource('企业产品信息查询 + 企业资质证书 + 企业商标信息'));
  out.push(
    dt(
      ['产品/服务', '类别', '占营收比例', '核心客户群', '竞争力描述'],
      profile.products.length > 0
        ? profile.products.map((p) => [p.name, p.category, p.revenueShare, p.customers, p.competitiveness])
        : [['—', '—', '—', '产品信息待补充', '—']],
    ),
  );

  out.push(h3('2.5.1', '企业资质与许可'));
  out.push(dataSource('企业资质证书 + 企业行政许可'));
  out.push(
    dt(
      ['资质名称', '颁发机关', '证书编号', '颁发日期', '有效期'],
      profile.certifications.length > 0
        ? profile.certifications.map((c) => [c.name, c.issuer, c.certNumber, c.issuedAt, c.validTill])
        : [['—', '—', '—', '资质信息待补充', '—']],
    ),
  );

  out.push(h2('2.6', '经营场所与产能', 'LE-A01'));
  out.push(dataSource('企业土地信息 + 企业用电数据标签 + 企业海关登记'));
  out.push(
    kv([
      { k: '注册地址', v: profile.registeredAddress },
      { k: '经营地址', v: profile.factoryArea > 0 ? `同注册地址，自有厂房 ${profile.factoryArea.toLocaleString('zh-CN')} 平方米` : '同注册地址' },
      { k: '产权状态', v: profile.realEstateRights !== '—' ? `自有，${profile.realEstateRights}` : '—' },
      { k: '生产线 / 产能', v: profile.productionLines > 0 ? `${profile.productionLines} 条生产线，设计年产能 ${profile.capacity}，当前利用率约 ${profile.capacityUtilization}` : '—' },
      { k: '仓储', v: profile.warehouse },
      { k: '进出口', v: profile.customsRegistration },
      { k: '用电稳定性指数', v: `${profile.electricityStability} / 100（近 24 月波动系数 ${profile.electricityVolatility}）` },
    ]),
  );

  // ═══ 第三部分 LE-A02 ═══
  out.push(h1('第三部分　实控人与管理团队'));
  out.push(p('"人即企业"。整章主责 Agent：LE-A02 实控人画像。'));

  out.push(h2('3.1', '法定代表人画像', 'LE-A02'));
  out.push(dataSource('个人综合涉诉（全量版）+ 限制高消费 + 银行卡涉赌涉诈 + 企业法人对外投资'));

  out.push(h3('3.1.1', '基本信息'));
  out.push(
    dt(
      ['项', '内容', '项', '内容'],
      [
        ['姓名', customer.legalRepresentative, '性别', profile.legalRepGender],
        ['年龄', `${profile.legalRepAge} 岁`, '学历', profile.legalRepEducation],
        ['身份证（脱敏）', profile.legalRepIdMasked, '行业从业年限', `${profile.legalRepYearsInIndustry} 年`],
        ['个人征信', profile.legalRepCreditStatus, '限制高消费', '无'],
        ['银行卡涉赌涉诈', '未命中', '个人涉诉案件', '无'],
        ['失信被执行', '否', '限制出境', '否'],
      ],
    ),
  );

  out.push(h3('3.1.2', '对外投资与任职情况'));
  out.push(dataSource('企业法定代表人对外投资 + 企业法定代表人其他公司任职'));
  out.push(
    dt(
      ['关联企业', '角色', '持股比例', '经营状态', '成立日期'],
      profile.legalRepForeignInvestments.length > 0
        ? profile.legalRepForeignInvestments.map((r) => [r.name, r.role, r.ratio, r.status, r.foundedAt])
        : [[customer.name, '法定代表人 / 股东', '—', '存续', customer.registeredAt]],
    ),
  );

  out.push(h3('3.1.3', '法人画像综合分析', 'LE-A02'));
  out.push(...agentBlock('LE-3.1.3-legal-rep-portrait', customer.id));

  out.push(h2('3.2', '实际控制人识别（央行 235 号文）', 'LE-A02'));
  out.push(dataSource('企业疑似控制人 + 企业最终控制方 + 企业受益所有人'));
  out.push(
    kv([
      { k: '疑似实际控制人', v: profile.controllerName },
      { k: '识别依据', v: '央行 235 号文 §6（直接 + 间接受益所有人 ≥ 25%）' },
      { k: '直接持股', v: profile.controllerDirectStake },
      { k: '间接受益', v: profile.controllerIndirectStake === '0%' ? '无（仅直接持股）' : `通过${profile.controllerIndirectVehicle}间接持有 ${profile.controllerIndirectStake}` },
      { k: '合计穿透受益', v: profile.controllerTotalStake },
      { k: '是否存在隐名股东', v: '否（已通过工商档案 + 受益所有人交叉核验）' },
    ]),
  );

  out.push(h2('3.3', '董监高履历与负面信息', 'LE-A02'));
  out.push(dataSource('企业主要人员 + 董监高投资任职及负面信息综合查询'));
  out.push(
    dt(
      ['姓名', '职务', '证件(脱敏)', '个人征信', '对外投资数', '负面信息', '限高/失信'],
      profile.managementTeam.length > 0
        ? profile.managementTeam.map((m) => [m.name, m.position, m.idMasked, m.credit, m.investments, m.negative, m.sanction])
        : [[customer.legalRepresentative, '董事长 / 总经理', profile.legalRepIdMasked, profile.legalRepCreditStatus, '—', '无', '无']],
    ),
  );
  out.push(h3('3.3.1', '关键人员稳定性评估'));
  out.push(p(profile.managementStabilityNote));

  out.push(h2('3.4', '关联企业网络', 'LE-A02'));
  out.push(dataSource('关联方清单查询（4 套监管规则）+ 谱系成员清单 + 企业视角接口'));

  out.push(h3('3.4.1', '关联企业清单'));
  out.push(
    dt(
      ['关联企业名称', '关联类型', '关联依据', '经营状态', '风险标签'],
      profile.relatedEnterprises.length > 0
        ? profile.relatedEnterprises.map((r) => [r.name, r.type, r.basis, r.status, r.tag])
        : [['—', '—', '—', '未识别关联企业', '—']],
    ),
  );

  out.push(h3('3.4.2', '关联方风险传导分析', 'LE-A02'));
  out.push(...agentBlock('LE-3.4.2-related-party', customer.id));
  out.push(...chartPlaceholder(
    '网络图',
    '关联方网络图',
    `以本企业为中心，二度关联 ${profile.totalRelatedCount} 家，其中股权关联 ${profile.equityRelatedCount} 家、供应链关联 ${profile.supplyChainRelatedCount} 家`,
  ));

  // ═══ 第四部分 LE-A03 ═══
  out.push(h1('第四部分　行业与经营分析'));
  out.push(p('整章主责：LE-A03 行业经营 Agent（依赖外接行业 RAG 语料库）。'));

  out.push(h2('4.1', '行业概况与景气度', 'LE-A03'));
  out.push(...agentBlock('LE-4.1-industry', customer.id));

  out.push(h2('4.2', '行业政策环境', 'LE-A03'));
  out.push(...agentBlock('LE-4.2-policy', customer.id));

  out.push(h2('4.3', '竞争格局与企业地位', 'LE-A03'));
  out.push(dataSource('企业划型 + 企业标签 + 招投标记录 + 行业舆情'));
  out.push(
    kv([
      { k: '企业划型', v: '小型企业（工信部 300-1000 人 / 营收 2000 万-4 亿）' },
      { k: '企业标签', v: '高新技术 / 专精特新（市级）' },
      { k: '全国市占率', v: '约 0.3%' },
      { k: '华南区域市占率（智能分拣）', v: '4.2%（区域 Top 3）' },
      { k: '主要竞争对手', v: '中科微至（龙头）/ 今天国际 / 本地竞品 3 家' },
      { k: '竞争优势', v: '价格较头部低 15-20%；定制化响应快；本地化服务强' },
    ]),
  );

  out.push(h2('4.4', '上下游产业链', 'LE-A03'));
  out.push(dataSource('API 发票 + 纳税（上下游汇总）+ 反欺诈接口（收入/支出真实性）'));

  out.push(h3('4.4.1', '主要客户（销项）'));
  out.push(
    dt(
      ['客户名称', '占营收比', '近12月开票额', '客户类型', '稳定性'],
      profile.topCustomers.length > 0
        ? profile.topCustomers.map((c) => [c.name, c.share, c.amount, c.type, c.stability])
        : [['—', '—', '—', '客户信息待补充', '—']],
    ),
  );

  out.push(h3('4.4.2', '主要供应商（进项）'));
  out.push(
    dt(
      ['供应商名称', '占采购比', '近12月开票额', '供应商类型', '稳定性'],
      profile.topSuppliers.length > 0
        ? profile.topSuppliers.map((s) => [s.name, s.share, s.amount, s.type, s.stability])
        : [['—', '—', '—', '供应商信息待补充', '—']],
    ),
  );

  out.push(h3('4.4.3', '上下游关系深度分析', 'LE-A03'));
  out.push(...agentBlock('LE-4.4.3-supply-chain', customer.id));

  out.push(h2('4.5', '经营波动性分析', 'LE-A03'));
  out.push(dataSource('企业用电数据标签（90 字段）+ 招聘信息 + 纳税基础信息（月度）'));

  out.push(h3('4.5.1', '用电量趋势'));
  out.push(...chartPlaceholder(
    '折线图',
    '近 12 月用电量月度走势',
    `月均用电 ${profile.electricityMonthlyAvg}，波动系数 ${profile.electricityVolatility}，同比变化 ${profile.electricity12mGrowth}`,
  ));
  out.push(
    kv([
      { k: '近 12 月用电总量', v: profile.electricity12mTotal },
      { k: '同比变化', v: profile.electricity12mGrowth },
      { k: '月均', v: profile.electricityMonthlyAvg },
      { k: '波动系数', v: `${profile.electricityVolatility}（行业基准 0.15-0.30）` },
      { k: '用电稳定性指数', v: `${profile.electricityStability} / 100` },
    ]),
  );

  out.push(h3('4.5.2', '招聘活跃度'));
  out.push(dataSource('招聘信息接口'));
  out.push(
    p(
      profile.recruitmentCount12m > 0
        ? `近 12 月公开招聘 ${profile.recruitmentCount12m} 次，岗位包括：${profile.recruitmentPositions}。判断：经营活跃，结构以技术、销售岗位为主，与扩产能逻辑匹配。`
        : '近 12 月未识别公开招聘活动，建议结合实地走访确认经营状态。',
    ),
  );

  out.push(h3('4.5.3', '纳税申报趋势'));
  out.push(...chartPlaceholder('柱状图', '近 12 月增值税申报金额走势', '月均 38 万元，Q3-Q4 旺季月均 56 万元，全年波动符合行业季节性'));

  out.push(h2('4.6', 'SWOT 分析', 'LE-A03'));
  out.push(...agentBlock('LE-4.6-swot', customer.id));

  // ═══ 第五部分 LE-A04 ═══
  out.push(h1('第五部分　财务深度分析'));
  out.push(p('整章主责：LE-A04 财务诊断 Agent（依赖行业财务基准库）。'));

  out.push(h2('5.1', '财务报表概览', 'LE-A04'));
  out.push(dataSource('企业财务状况综合查询 + 财务基础信息 + 资产负债表/利润表/现金流表'));

  out.push(h3('5.1.1', '资产负债表（近三年）'));
  out.push(
    dt(
      ['项目（万元）', '2023 年末', '2024 年末', '2025 年末', '近一期', '同比变化'],
      profile.balanceSheet.length > 0
        ? profile.balanceSheet.map((r) => [r.item, r.y2, r.y1, r.y, r.latest ?? r.y, r.growth ?? '—'])
        : [['—', '—', '—', '—', '财务数据待补充', '—']],
    ),
  );

  out.push(h3('5.1.2', '利润表（近三年）'));
  out.push(
    dt(
      ['项目（万元）', '2023', '2024', '2025', '近一期', '同比变化'],
      profile.incomeStatement.length > 0
        ? profile.incomeStatement.map((r) => [r.item, r.y2, r.y1, r.y, r.latest ?? r.y, r.growth ?? '—'])
        : [['—', '—', '—', '—', '财务数据待补充', '—']],
    ),
  );

  out.push(h3('5.1.3', '现金流量表（近三年）'));
  out.push(
    dt(
      ['项目（万元）', '2023', '2024', '2025', '近一期', '同比变化'],
      profile.cashFlowStatement.length > 0
        ? profile.cashFlowStatement.map((r) => [r.item, r.y2, r.y1, r.y, r.latest ?? r.y, r.growth ?? '—'])
        : [['—', '—', '—', '—', '财务数据待补充', '—']],
    ),
  );

  out.push(h2('5.2', '资产负债结构分析', 'LE-A04'));
  out.push(...agentBlock('LE-5.2-balance-sheet', customer.id));
  out.push(...chartPlaceholder('饼图', '近一期资产 / 负债结构饼图', '资产端：流动资产 76.2% + 非流动资产 23.8%；负债端：经营性负债 73.3% + 金融负债 26.7%'));

  out.push(h3('5.2.1', '关键比率'));
  out.push(
    dt(
      ['指标', '2023', '2024', '2025', '行业均值', '评价'],
      profile.liquidityRatios.length > 0
        ? profile.liquidityRatios.map((r) => [r.metric, r.y2, r.y1, r.y, r.industry ?? '—', r.evaluation])
        : [['—', '—', '—', '—', '—', '比率数据待补充']],
    ),
  );

  out.push(h2('5.3', '盈利能力分析', 'LE-A04'));
  out.push(...agentBlock('LE-5.3-profitability', customer.id));

  out.push(h3('5.3.1', '关键比率'));
  out.push(
    dt(
      ['指标', '2023', '2024', '2025', '行业均值', '评价'],
      profile.profitabilityRatios.length > 0
        ? profile.profitabilityRatios.map((r) => [r.metric, r.y2, r.y1, r.y, r.industry ?? '—', r.evaluation])
        : [['—', '—', '—', '—', '—', '比率数据待补充']],
    ),
  );

  out.push(h2('5.4', '现金流分析', 'LE-A04'));
  out.push(...agentBlock('LE-5.4-cashflow', customer.id));
  out.push(
    dt(
      ['指标', '2023', '2024', '2025', '评价'],
      profile.cashFlowRatios.length > 0
        ? profile.cashFlowRatios.map((r) => [r.metric, r.y2, r.y1, r.y, r.evaluation])
        : [['—', '—', '—', '—', '现金流比率待补充']],
    ),
  );

  out.push(h2('5.5', '营运能力分析', 'LE-A04'));
  out.push(dataSource('核心财务指标 + 财务分析报告查询'));
  out.push(
    dt(
      ['指标', '2023', '2024', '2025', '行业均值', '评价'],
      profile.operationRatios.length > 0
        ? profile.operationRatios.map((r) => [r.metric, r.y2, r.y1, r.y, r.industry ?? '—', r.evaluation])
        : [['—', '—', '—', '—', '—', '营运比率待补充']],
    ),
  );

  out.push(h2('5.6', '发票流水深度分析', 'LE-A04'));
  out.push(dataSource('API 发票基础信息 + API 发票+纳税基础信息 + 发票基础信息'));

  out.push(h3('5.6.1', '发票总览'));
  out.push(
    dt(
      ['指标', '2023', '2024', '2025', '近一期'],
      profile.invoiceOverview.length > 0
        ? profile.invoiceOverview.map((r) => [r.item, r.y2, r.y1, r.y, r.latest ?? r.y])
        : [['—', '—', '—', '—', '发票数据待补充']],
    ),
  );
  out.push(...chartPlaceholder('柱状图', '销项发票月度走势（近 24 月）', '月均 1,820 万，Q3-Q4 旺季月均 2,710 万，符合行业季节性'));

  out.push(h3('5.6.2', '发票深度分析', 'LE-A04'));
  out.push(...agentBlock('LE-5.6.2-invoice', customer.id));

  out.push(h2('5.7', '纳税申报与税负分析', 'LE-A04'));
  out.push(dataSource('纳税基础信息 + 企业税务综合查询 + 纳税信用 + 企业所得税'));
  out.push(
    dt(
      ['指标', '2023', '2024', '2025'],
      profile.taxFiling.length > 0
        ? profile.taxFiling.map((r) => [r.item, r.y2, r.y1, r.y])
        : [['—', '—', '—', '纳税数据待补充']],
    ),
  );

  out.push(h2('5.8', '关键财务比率横向对比', 'LE-A04'));
  out.push(p('将企业关键财务比率与行业均值、行业领先企业、同区域同规模企业进行对比。'));
  out.push(...chartPlaceholder('柱状图', '关键财务比率横向对比', '本企业 vs 行业均值 vs 行业领先 vs 同区域同规模，6 个关键指标'));

  out.push(h2('5.9', '财务异动与解释', 'LE-A04'));
  out.push(...agentBlock('LE-5.9-finance-anomaly', customer.id));

  // ═══ 第六部分 LE-A05 ═══
  out.push(h1('第六部分　履约能力与征信表现'));
  out.push(p('整章主责：LE-A05 履约征信 Agent。'));

  out.push(h2('6.1', '历史融资记录', 'LE-A05'));
  out.push(dataSource('融资综合查询（7 类融资记录）'));
  out.push(
    dt(
      ['融资类型', '笔数', '总金额(万)', '在贷余额(万)', '履约状态'],
      profile.financingHistory.length > 0
        ? profile.financingHistory.map((f) => [f.type, f.count, f.total, f.balance, f.status])
        : [['—', '—', '—', '—', '融资记录待补充']],
    ),
  );

  out.push(h2('6.2', '多头借贷分析', 'LE-A05'));
  out.push(dataSource('企业多机构查询统计（36 月）+ 短时版'));

  out.push(h3('6.2.1', '长期多头（36 月）'));
  out.push(...chartPlaceholder(
    '折线图',
    '近 36 月被查询次数月度走势',
    `累计 ${profile.longInquiryTotal}，覆盖 ${profile.longInquiryInstitutions} 机构，融资周期前后峰值，无异常聚集`,
  ));
  out.push(
    kv([
      { k: '近 36 月总查询次数', v: profile.longInquiryTotal },
      { k: '查询机构数', v: profile.longInquiryInstitutions },
      { k: '银行查询次数', v: profile.longInquiryBank },
      { k: '非银查询次数', v: profile.longInquiryNonBank },
    ]),
  );

  out.push(h3('6.2.2', '短时多头（近 1/3/7/15 天）'));
  out.push(
    dt(
      ['时间窗口', '查询次数', '查询机构数', '预警等级'],
      profile.shortInquiries.length > 0
        ? profile.shortInquiries.map((s) => [s.window, s.count, s.institutions, s.alert])
        : [['—', '—', '—', '短时查询数据待补充']],
    ),
  );

  out.push(h2('6.3', '招投标与履约表现', 'LE-A05'));
  out.push(dataSource('企业招投标信息 + 招投标详情查询 + 企业海关登记'));
  out.push(
    kv([
      { k: '近三年投标次数', v: `${profile.bidsCount} 次` },
      { k: '中标次数', v: `${profile.bidsWonCount} 次` },
      { k: '中标率', v: profile.bidsWinRate },
      { k: '中标金额合计', v: profile.bidsWonAmount },
      { k: '履约率', v: profile.bidsPerformanceRate },
      { k: '核心客户续约率', v: profile.bidsRenewRate },
      { k: '海关进出口额', v: profile.importExportAmount },
    ]),
  );

  out.push(h2('6.4', '资产抵质押情况', 'LE-A05'));
  out.push(dataSource('企业动产抵押 + 知识产权出质 + 不动产相关 + POS 商户数据'));
  out.push(h3('6.4.1', '抵押资产清单'));
  out.push(
    dt(
      ['资产类型', '标的描述', '抵押权人', '金额(万)', '状态'],
      profile.collateralAssets.length > 0
        ? profile.collateralAssets.map((c) => [c.type, c.description, c.mortgagee, c.amount, c.status])
        : [['—', '—', '—', '—', '抵押资产数据待补充']],
    ),
  );
  out.push(h3('6.4.2', 'POS 商户经营数据'));
  out.push(p('本企业以 B2B 业务为主，无 POS 商户数据。/ 不适用。'));

  // ═══ 第七部分 LE-A06/A07 ═══
  out.push(h1('第七部分　五维信用评分明细'));
  out.push(p('LE-A06 主责评分，LE-A07 主责交叉验证。两个 Agent 是 D 阶段最后两个，消费 LE-A01-A05 的产物。'));

  const fiveDims: Array<[string, string, Array<[string, string, string, string, string, string]>, number]> = [
    ['7.1', '维度一：经营稳定性（30%）', [
      ['企业存续年限', '8%', '工商基本信息', '≥5 年=100 / 3-5=70 / <3=40', '7.5 年', '100'],
      ['注册资本实缴率', '6%', '企业股东及出资', '100% 实缴=100', '100%', '100'],
      ['营收增长率', '8%', '核心财务指标', '>15%=100 / 5-15=80 / <5=50', '15.3%', '100'],
      ['用电稳定性', '4%', '企业用电数据标签', '指数 ≥ 70', '76', '85'],
      ['核心团队稳定性', '4%', '企业主要人员', '近 3 年 0 离职=100', '0 离职', '100'],
      ['维度合计', '30%', '—', '—', '—', String(v.operationStability)],
    ], v.operationStability],
    ['7.2', '维度二：财务健康度（25%）', [
      ['资产负债率', '6%', '资产负债表', '< 50%=100', '48.6%', '95'],
      ['流动比率', '5%', '资产负债表', '≥ 1.5=100', '1.73', '100'],
      ['毛利率', '5%', '利润表', '高于行业=100', '22.4%', '100'],
      ['应收账款周转', '5%', '核心财务指标', '行业内', '142 天', '40'],
      ['现金流健康度', '4%', '现金流量表', '净现比 > 1=100', '1.23', '95'],
      ['维度合计', '25%', '—', '—', '—', String(v.financialHealth)],
    ], v.financialHealth],
    ['7.3', '维度三：履约能力（25%）', [
      ['历史融资履约', '7%', '融资综合查询', '0 逾期=100', '0 逾期', '100'],
      ['招投标履约', '6%', '招投标信息', '履约率 ≥ 95%=100', '100%', '100'],
      ['纳税信用', '5%', '纳税信用', 'A=100 / B=80 / C=50', 'B', '80'],
      ['多头借贷', '4%', '多机构查询', '正常=100', '正常', '90'],
      ['抵押资产可控性', '3%', '动产抵押', '抵押率 < 70%=100', '60%', '90'],
      ['维度合计', '25%', '—', '—', '—', String(v.performance)],
    ], v.performance],
    ['7.4', '维度四：合规性（15%）', [
      ['失信被执行', '5%', '失信被执行', '0=100', '0', '100'],
      ['行政处罚', '4%', '企业行政处罚', '近 2 年 0=100', '1 起轻微', '85'],
      ['法人个人风险', '3%', '个人综合涉诉', '0=100', '0', '100'],
      ['司法涉诉', '3%', '企业涉诉', '0=100 / <3=80', '0', '100'],
      ['维度合计', '15%', '—', '—', '—', String(v.compliance)],
    ], v.compliance],
    ['7.5', '维度五：成长性（5%）', [
      ['行业景气度', '2%', '行业 RAG', '上行=80 / 中性=60', '中性偏积极', '70'],
      ['研发投入比', '1.5%', '利润表', '> 5%=100', '7.2%', '85'],
      ['专利数量', '1%', '企业商标 / 专利', '≥ 10=80', '21 项', '80'],
      ['核心团队学历结构', '0.5%', '社保 + 招聘', '本科以上 50%=80', '本科 60%', '80'],
      ['维度合计', '5%', '—', '—', '—', String(v.growth)],
    ], v.growth],
  ];

  for (const [num, title, rows] of fiveDims) {
    out.push(h2(num, title, 'LE-A06'));
    out.push(dt(['子指标', '权重', '数据接口', '评分规则', '原始数据', '得分'], rows.map((r) => [...r])));
  }

  out.push(h2('7.6', '五对交叉验证结果', 'LE-A07'));
  out.push(p('交叉验证是发现单一维度评分难以察觉的潜在风险的核心手段，五对验证规则覆盖了财务真实性、规模真实性、贸易真实性、资金链紧张等关键风险点。'));
  if (report.crossValidations) {
    out.push(
      dt(
        ['验证对', '数据源 A', '数据源 B', '本次差异', '阈值', '结论'],
        report.crossValidations.map((cv) => [
          cv.pair,
          cv.sourceA,
          cv.sourceB,
          cv.deviation,
          cv.pair.includes('纳税×用电') ? '40%' : cv.pair.includes('发票×营收') ? '30%' : cv.pair.includes('社保') ? '50%' : cv.pair.includes('反欺诈') ? '20%' : '—',
          cv.result,
        ]),
      ),
    );
  }

  out.push(h3('7.6.1', '交叉验证综合结论', 'LE-A07'));
  out.push(...agentBlock('LE-7.6.1-cross-validation', customer.id));

  // ═══ 第八部分 LE-A09 ═══
  out.push(h1('第八部分　授信用途与还款来源'));
  out.push(p('"借多少、用在哪、怎么还"是审批的核心问题。整章主责：LE-A09 授信用途与还款 Agent。'));

  out.push(h2('8.1', '授信用途分析', 'LE-A09'));
  out.push(
    kv([
      { k: '申请用途', v: '流动资金贷款' },
      { k: '资金具体用途', v: '原材料采购 500 万 + 扩产能设备 200 万 + 补充流动资金 100 万' },
      { k: '用途合理性', v: '匹配企业经营计划，与销项预测一致' },
      { k: '用途监控建议', v: '受托支付，按用途分批放款' },
      { k: '替代融资可行性', v: '可（自有现金 + 应收账款保理）' },
      { k: '行业用途惯例', v: '原材料采购为流贷主要用途' },
    ]),
  );

  out.push(h2('8.2', '第一还款来源测算', 'LE-A09'));
  out.push(...agentBlock('LE-8.2-repayment', customer.id));
  out.push(
    kv([
      { k: '年度经营性现金流（净）', v: '2,340 万元' },
      { k: '年度净利润', v: '1,900 万元' },
      { k: '年度税后留存', v: '1,420 万元' },
      { k: '本次本息合计（年）', v: '860 万元' },
      { k: '偿债保障倍数', v: '2.7×（基准 1.5-2.0×）' },
      { k: '敏感度（营收 -20%）', v: '1.4×' },
      { k: '敏感度（营收 -30%）', v: '1.1×' },
    ]),
  );

  out.push(h2('8.3', '第二还款来源（担保 / 抵押）', 'LE-A09'));
  out.push(
    dt(
      ['担保方式', '标的', '评估价值(万)', '抵质押率', '净覆盖额(万)'],
      profile.collateralProposals.length > 0
        ? profile.collateralProposals.map((c) => [c.type, c.description, c.amount, '—', c.status])
        : [['—', '—', '—', '—', '担保方案待审批人员根据具体业务确认']],
    ),
  );
  out.push(p(profile.collateralRationale));

  out.push(h2('8.4', '压力测试', 'LE-A09'));
  out.push(
    dt(
      ['压力情景', '假设条件', '经营现金流变化', '偿债保障倍数', '结论'],
      [
        ['基准场景', '现状', '2,340 万', '2.7×', '充裕'],
        ['情景一', '营收 -20%', '1,210 万', '1.4×', '可承受'],
        ['情景二', '营收 -30%', '950 万', '1.1×', '勉强'],
        ['情景三', '营收 -35%（预警阈值）', '700 万', '0.8×', '触发预警'],
        ['情景四', '主要客户逾期 + 营收 -10%', '1,050 万', '1.2×', '可承受'],
      ],
    ),
  );

  // ═══ 第九部分 LE-A08 ═══
  out.push(h1('第九部分　风险评估与缓释'));
  out.push(p('整章主责：LE-A08 风险地图 Agent。'));

  out.push(h2('9.1', '风险地图总览', 'LE-A08'));
  out.push(...agentBlock('LE-9.1-risk-map', customer.id));
  out.push(...chartPlaceholder('矩阵图', '风险地图矩阵', 'X 轴：发生可能性，Y 轴：影响严重性，4 项识别风险点已标注象限位置'));

  out.push(h2('9.2', '行业风险与缓释', 'LE-A08'));
  out.push(
    dt(
      ['风险点', '风险描述', '可能性', '严重性', '缓释措施'],
      profile.industryRisks.length > 0
        ? profile.industryRisks.map((r) => [r.point, r.description, r.likelihood, r.severity, r.mitigation])
        : [['—', '—', '—', '—', '行业风险数据待补充']],
    ),
  );

  out.push(h2('9.3', '经营风险与缓释', 'LE-A08'));
  out.push(
    dt(
      ['风险点', '风险描述', '可能性', '严重性', '缓释措施'],
      profile.operationRisks.length > 0
        ? profile.operationRisks.map((r) => [r.point, r.description, r.likelihood, r.severity, r.mitigation])
        : [['—', '—', '—', '—', '经营风险数据待补充']],
    ),
  );

  out.push(h2('9.4', '财务风险与缓释', 'LE-A08'));
  out.push(
    dt(
      ['风险点', '风险描述', '可能性', '严重性', '缓释措施'],
      profile.financeRisks.length > 0
        ? profile.financeRisks.map((r) => [r.point, r.description, r.likelihood, r.severity, r.mitigation])
        : [['—', '—', '—', '—', '财务风险数据待补充']],
    ),
  );

  out.push(h2('9.5', '法律合规风险与缓释', 'LE-A08'));
  out.push(
    dt(
      ['风险点', '风险描述', '可能性', '严重性', '缓释措施'],
      profile.complianceRisks.length > 0
        ? profile.complianceRisks.map((r) => [r.point, r.description, r.likelihood, r.severity, r.mitigation])
        : [['—', '—', '—', '—', '合规风险数据待补充']],
    ),
  );

  // ═══ 第十部分 LE-A11 ═══
  out.push(h1('第十部分　贷后管理方案'));
  out.push(p('整章主责：LE-A11 贷后监控设计 Agent。'));

  out.push(h2('10.1', '事件驱动监控配置', 'LE-A11'));
  out.push(dataSource('企业监控信息更新查询 + 企业监控配置接口'));
  out.push(
    dt(
      ['监控维度', '推送条件', '通知对象', '处置级别'],
      [
        ['工商变更', '法定代表人 / 注册资本 / 经营范围变更', '客户经理 + 风控', '黄'],
        ['司法涉诉', '新增涉诉案件', '风控 + 法务', '红'],
        ['失信被执行', '新增失信记录', '风控 + 客户经理', '红'],
        ['限制高消费', '法人 / 实控人新增限高', '风控', '红'],
        ['行政处罚', '新增重大行政处罚', '风控 + 合规', '黄'],
        ['关联方风险', '关联方新增失信 / 涉诉', '风控', '黄'],
        ['用电 / 纳税异常', '连续 3 月归零 / 异常下降', '风控', '红'],
      ],
    ),
  );

  out.push(h2('10.2', '定期复核监控清单', 'LE-A11'));
  out.push(
    dt(
      ['监控项', '数据来源', '频率', '黄灯条件', '红灯条件'],
      [
        ['财务季报', '客户经理报送', '季频', '资产负债率 +5pp', '资产负债率 > 55%'],
        ['销项发票', 'API 发票', '月频', '环比 -10%', '环比 -25% 或归零'],
        ['用电量', '企业用电数据标签', '月频', '环比 -20%', '连续 3 月 -50%'],
        ['多头查询', '企业多机构查询', '月频', '月新增 > 3 家', '月新增 > 5 家'],
        ['关联交易', '关联方清单 + 发票', '月频', '占比 > 25%', '占比 > 35%'],
        ['纳税信用', '纳税信用', '季频', '降至 C', '降至 D'],
        ['社保人数', '社保实缴人数', '月频', '-10%', '-30%'],
        ['应收账款周转', '核心财务指标', '季频', '160 天', '180 天'],
      ],
    ),
  );

  out.push(h2('10.3', '预警分级与处置流程', 'LE-A11'));
  out.push(
    dt(
      ['预警级别', '触发条件', '响应时限', '处置措施', '升级条件'],
      [
        ['红（严重）', '失信 / 用电归零 / 经营异常', '24h', '24h 内启动处置', '7 日未缓解 → 风险经理'],
        ['黄（关注）', '财务异常 / 多头新增 / 关联交易', '3 日', '客户经理回访', '处置无效 → 升红'],
        ['蓝（提示）', '行业政策 / 轻微财务波动', '月度', '月报跟踪', '—'],
        ['绿（正常）', '常态', '—', '常规跟踪', '—'],
      ],
    ),
  );

  out.push(h2('10.4', '授权管理说明', 'LE-A11'));
  out.push(
    dt(
      ['授权类别', '数据范围', '授权要求', '授权有效期'],
      [
        ['企业数据授权', '纳税 / 发票 / 财务 / 用电 / 社保', '法人盖章 + 电子签约', '授信存续期'],
        ['法人个人授权', '身份核验 / 涉诉 / 限高 / 银行卡', 'H5 实人核身 + 电签', '授信存续期'],
        ['关联方扫描', '关联方清单内主体', '关联方主体单独授权', '授信存续期'],
        ['贷后监控', '事件驱动 + 定期复核', '客户授权监控合同', '授信存续期'],
      ],
    ),
  );

  // ═══ 调查结论与签字 ═══
  out.push(h1('调查结论与签字'));
  out.push(
    p(
      `综合上述企业经营、财务、合规、行业及关联方多维度分析，以及五维信用评分（综合得分 ${totalScore} 分，信用等级 ${grade} 级）、五对交叉验证结果（关注 2 项 / 异常 0 项）、一票否决项检查（${vetoHit.length === 0 ? '全部通过' : `触发 ${vetoHit.length} 项`}），本次调查的最终结论为：`,
    ),
  );
  out.push(
    p(
      `建议批准本次授信申请。${
        report.recommendation
          ? `授信金额 ${report.recommendation.amount} 万元，期限 ${report.recommendation.term} 个月，利率 ${report.recommendation.rate}，担保方式 ${report.recommendation.guarantee}。`
          : ''
      }核心风险已通过结构性条款（季报报送、关联交易披露、TOP5 客户回款月报）覆盖。建议放款前完成不动产抵押登记，存续期内执行月度关联交易披露 + 季度财务报表复核。`,
    ),
  );
  out.push(sp(120));
  out.push(
    dt(
      ['调查人签字', '复核人签字', '部门负责人签字'],
      [
        [customer.manager, '—', '—'],
        ['日期：____年____月____日', '日期：____年____月____日', '日期：____年____月____日'],
      ],
    ),
  );

  // ═══ 附录 A-G ═══
  out.push(h1('附录'));

  out.push(h2('附录 A', '数据接口清单与字段说明'));
  out.push(p('本报告引用的所有数据接口及关键字段如下，数据均来自正菱（珠海）数据服务有限公司 API 平台。共调用 90 个接口，涉及 SE-01 / LE-A01-A11 / FB-01 五类调用方。'));

  out.push(h3('A.1', '企业综合数据'));
  out.push(
    dt(
      ['接口名称', '用途章节', '调用频次', '授权要求'],
      [
        ['工商信息综合查询（大工商）', '2.1 / 2.2', '一次性', '无'],
        ['企业工商基本信息', '2.1', '一次性', '无'],
        ['企业股东及出资', '2.2.1', '一次性', '无'],
        ['企业股东信息（工商公示）', '2.2.1', '一次性', '无'],
        ['企业股权透视', '2.2.2', '一次性', '无'],
        ['企业股权穿透查询', '2.2.2', '一次性', '无'],
        ['企业最终控制方', '2.2.2 / 3.2', '一次性', '无'],
        ['企业受益所有人', '2.2.2 / 3.2', '一次性', '无'],
        ['企业分支机构', '2.1.2', '一次性', '无'],
      ],
    ),
  );

  out.push(h3('A.2', '司法涉诉数据'));
  out.push(
    dt(
      ['接口名称', '用途章节', '调用频次', '授权要求'],
      [
        ['企业涉诉', '7.4 / 9.5', '一次性 + 推送', '无'],
        ['失信被执行', '1.3 / 7.4', '实时', '无'],
        ['限制高消费', '1.3 / 3.1.1', '实时', '无'],
        ['企业严重违法', '1.3', '实时', '无'],
        ['司法解析（涉诉详情）', '7.4', '一次性', '无'],
      ],
    ),
  );

  out.push(h3('A.3', '企业财税数据'));
  out.push(
    dt(
      ['接口名称', '用途章节', '调用频次', '授权要求'],
      [
        ['核心财务指标', '5.1 / 5.5', '一次性', '需企业授权'],
        ['财务分析报告', '5.2 / 5.3 / 5.4', '一次性', '需企业授权'],
        ['API 发票基础信息', '5.6', '一次性', '需企业授权'],
        ['API 发票 + 纳税基础信息', '4.4 / 5.6', '一次性', '需企业授权'],
        ['纳税信用', '5.7', '一次性', '需企业授权'],
      ],
    ),
  );

  out.push(h3('A.4', '其他重要数据'));
  out.push(
    dt(
      ['接口名称', '用途章节', '调用频次', '授权要求'],
      [
        ['企业用电数据标签（90 字段）', '4.5 / 9.3', '月频', '需企业授权'],
        ['企业招聘信息', '4.5.2', '月频', '无'],
        ['企业海关登记', '6.3', '一次性', '无'],
        ['企业动产抵押', '6.4', '一次性', '无'],
        ['企业监控信息更新查询', '10.1', '推送', '需企业授权'],
      ],
    ),
  );

  out.push(h2('附录 B', '评分算法详解'));
  out.push(h3('B.1', '评分计算公式'));
  out.push(p('综合得分 = Σ(维度得分 × 维度权重)；维度得分 = Σ(子指标得分 × 子指标权重)；子指标得分 = 评分规则(原始数据) → [0, 100]。'));
  out.push(h3('B.2', '权重设计依据'));
  out.push(p('五维权重 30/25/25/15/5 的设计依据：① 法人小微"企业独立于人"，企业经营是核心；② 财务和履约直接对应偿债能力；③ 合规和成长性权重适中。权重经 50,000+ 历史样本回测验证。'));
  out.push(h3('B.3', '阈值设定原则'));
  out.push(p('各子指标阈值依据：① 行业基准；② 监管要求（银保监普惠金融评估办法）；③ 历史样本回测。'));
  out.push(h3('B.4', '一票否决规则'));
  out.push(p('共 10 项一票否决，分四大类：① 企业经营底线 4 项；② 法人个人风险 3 项；③ 监管底线 2 项；④ 经营异常 1 项。法规依据：《征信业务管理办法》《商业银行授信工作尽职指引》。'));

  out.push(h2('附录 C', '原始数据快照（脱敏）'));
  out.push(p(`本报告所有评分结果均可追溯到原始数据快照。完整脱敏数据快照存储于客户银行私有存储，数据时点 ${report.generatedAt ?? customer.updatedAt}，可应银保监及内部审计核查。`));
  out.push(
    dt(
      ['数据类别', '记录数', '数据时点', '存储位置'],
      [
        ['工商档案', '32 项', customer.updatedAt, 'snap_20260429_001'],
        ['财务三表', '近三年 + 近一期', customer.updatedAt, '同上'],
        ['发票数据', '近 36 月 6,790 张', customer.updatedAt, '同上'],
        ['纳税申报', '近三年 36 期', customer.updatedAt, '同上'],
        ['司法涉诉', '0 项', customer.updatedAt, '同上'],
        ['用电 / 社保 / 招聘', '近 24 月', customer.updatedAt, '同上'],
      ],
    ),
  );

  out.push(h2('附录 D', '数据合规授权链条'));
  out.push(h3('D.1', '数据源合规授权'));
  out.push(p('正菱（珠海）数据服务有限公司作为本报告核心数据源，具备数据要素流通资质和合规能力。各类数据采集均符合《数据安全法》《个人信息保护法》《征信业务管理办法》要求。'));
  out.push(h3('D.2', '企业数据授权'));
  out.push(p(`贷前授权：${customer.name} 于 2026-04-26 签署《数据使用授权书》，授权客户银行通过金智维平台调用其纳税、发票、财务、用电、社保等需授权数据。授权范围：本次授信申请的尽职调查及授信存续期内的贷后监控。授权期限：授权之日起至贷款全部清偿之日止。`));
  out.push(h3('D.3', '个人数据授权'));
  out.push(p(`法定代表人 ${customer.legalRepresentative} 于 2026-04-26 签署《个人信息处理同意书》，授权方式：H5 实人核身 + 电子签约，完整签约日志保存于客户银行私有存储。`));
  out.push(h3('D.4', '数据使用边界'));
  out.push(
    dt(
      ['使用方', '使用目的', '数据范围', '保留期限'],
      [
        ['客户银行授信审批', '本次授信审批', '完整脱敏快照', '授信存续期 + 5 年'],
        ['客户银行风控', '贷后监控', '事件驱动 + 月度复核', '授信存续期'],
        ['内部审计', '合规审查', '快照查询权限', '存续期 + 10 年'],
        ['监管报送', '银保监 / 央行', '聚合统计', '按监管要求'],
      ],
    ),
  );

  out.push(h2('附录 E', '行业参考资料'));
  out.push(p('本报告引用的行业研报、政策文件、新闻舆情等参考资料：'));
  out.push(p('· 中国机械工业联合会《2025 年专用设备制造业发展报告》'));
  out.push(p('· 国务院《推动工业领域设备更新实施方案》（国办发〔2025〕XX 号）'));
  out.push(p('· 工信部《智能制造试点示范行动方案 2025-2027》'));
  out.push(p('· 广东省工信厅《制造业当家"22 条"政策汇编》'));
  out.push(p('· Wind 行业数据库 · C35 专用设备制造业 2023-2025 月度数据'));
  out.push(p('· 金智维内部行业 RAG 语料库 v2.6（2026-04 更新）'));

  out.push(h2('附录 F', '模型版本说明'));
  out.push(
    dt(
      ['项目', '内容'],
      [
        ['模型名称', '金智维法人小微企业五维信用评分模型'],
        ['模型版本', 'v2.6.1'],
        ['模型上线时间', '2026-01-15'],
        ['本次评分时间', report.generatedAt ?? customer.updatedAt],
        ['训练样本数', '50,000+'],
        ['回测准确率', 'KS 0.42 / AUC 0.81'],
        ['维度数', '5 维 / 24 个子指标'],
        ['一票否决项数', '10 项'],
        ['模型监管备案', '已备案'],
        ['人在环节点', '3 个（授权 / 报告签字 / 模型改进审批）'],
      ],
    ),
  );

  out.push(h2('附录 G', '术语表'));
  out.push(
    dt(
      ['术语', '解释'],
      [
        ['SDAFI', 'Sense-Decide-Act-Feedback-Improve 五阶段闭环框架'],
        ['Agent 数据池', 'SE-01 在 Sense 阶段冻结的不可变快照'],
        ['一票否决', '监管或银行内部规定下任一命中即直接拒绝的核查项'],
        ['五对交叉验证', '纳税×用电、发票×营收、社保×年报、反欺诈×发票、多头×融资'],
        ['五维评分', '经营稳定性 30 / 财务健康 25 / 履约能力 25 / 合规 15 / 成长 5'],
        ['偿债保障倍数', '年度经营性现金流 / 年度本息合计'],
        ['净现比', '经营性现金流 / 净利润'],
        ['CR5', '前五大客户（或供应商）合计占比'],
        ['受益所有人', '央行 235 号文定义的最终自然人受益所有人'],
        ['cycle_id', 'SDAFI 五张审计表的统一关联键'],
        ['人在环', 'Human-in-the-loop，三个强制人审批节点'],
      ],
    ),
  );

  // ═══ 结语 ═══
  out.push(hr());
  out.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
      children: [
        new TextRun({ text: '— 本报告至此结束 —', font: FONT, size: 18, color: C.muted }),
      ],
    }),
  );
  out.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({ text: '金智维 · 智慧信贷智能体平台 · KINGSWARE · 数据驱动普惠金融', font: FONT, size: 16, color: C.muted }),
      ],
    }),
  );
  out.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `报告编号 ${report.reportNumber} · 内部机密`, font: FONT, size: 14, color: C.muted }),
      ],
    }),
  );

  return out;
}

function gradeOf(score: number): string {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  return 'D';
}

function gradeText(g: string): string {
  return g === 'A' ? '优' : g === 'B' ? '良' : g === 'C' ? '中' : '差';
}
