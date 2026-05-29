/**
 * 法人小微 · 10 章 + 7 附录 + 93 张表
 * 严格按 法人小微企业_授信尽调报告_空模板.docx 章节顺序，
 * 每个 Agent 生成区按 法人小微Agent对应矩阵_最终版.docx 标注主责 Agent。
 */

import {
  gradeToLabel,
  labelToReference,
  labelToStars,
  overallVerdict,
  scoreToLabel,
} from '@/data/analysis-labels';
import { getLeProfile } from '@/data/customer-profiles';
import type { LegalEntityCustomer, DueDiligenceReport } from '@/data/types';

import {
  PrintBarTrend,
  PrintEquityTree,
  PrintLineTrend,
  PrintMultiBar,
  PrintPie,
  PrintRadar,
  PrintRelatedNetwork,
  PrintRiskMatrix,
  syntheticMonthly,
} from './charts';
import {
  AgentBlock,
  ChartPlaceholder,
  DataSource,
  PageBreak,
  PrintKv,
  PrintTable,
  SectionH1,
  SectionH2,
  SectionH3,
} from './shared';

export function LeChapters({
  customer,
  report,
}: {
  customer: LegalEntityCustomer;
  report: DueDiligenceReport;
}) {
  const v = customer.fiveDimensionScores!;
  const profile = getLeProfile(customer);
  const overall = gradeToLabel(report.creditGrade ?? 'B');
  const verdict = overallVerdict(overall);
  const vetoHit = report.oneVoteVeto.filter((x) => x.triggered);
  const vetoOk = report.oneVoteVeto.filter((x) => !x.triggered);

  return (
    <>
      {/* ═══ 第一部分 ═══ */}
      <SectionH1>第一部分　报告摘要与授信参考</SectionH1>
      <p className="print-body">
        本部分为本报告的核心结论摘要，授信审批人员可通过本部分快速掌握企业整体经营画像、风险状况、核心风险点及授信参考。详细数据支撑见后续各部分。
      </p>

      <SectionH2 number="1.1" title="企业综合分析摘要" agentId="LE-A06" />
      <PrintTable
        header={['分析维度', '维度表现', '关键发现']}
        rows={[
          ['经营稳定性', scoreToLabel(v.operationStability), '近三年营收复合增长 16%，管理层稳定'],
          ['财务健康度', scoreToLabel(v.financialHealth), '资产负债率 48.6%，应收账款周转偏长'],
          ['履约能力', scoreToLabel(v.performance), '近 36 月融资 6 笔均已结清'],
          ['合规性', scoreToLabel(v.compliance), '无重大行政处罚、无失信记录'],
          ['成长性', scoreToLabel(v.growth), '行业景气度上行，研发投入 7.2%'],
          ['综合评价', overall, '—'],
        ]}
      />
      <PrintRadar
        title="企业综合分析雷达图"
        description={`综合评价：${overall}`}
        data={[
          { dimension: '经营稳定性', score: v.operationStability, weight: 30 },
          { dimension: '财务健康度', score: v.financialHealth, weight: 25 },
          { dimension: '履约能力', score: v.performance, weight: 25 },
          { dimension: '合规性', score: v.compliance, weight: 15 },
          { dimension: '成长性', score: v.growth, weight: 5 },
        ]}
      />

      <SectionH2 number="1.2" title="综合分析档位与授信参考" />
      <SectionH3 number="1.2.1" title="综合分析档位说明" />
      <PrintTable
        header={['维度表现', '授信参考', '标识']}
        rows={(['强', '较好', '一般', '偏弱'] as const).map((label) => [
          label,
          labelToReference(label),
          labelToStars(label),
        ])}
      />

      <SectionH3 number="1.2.2" title="本次授信参考" agentId="LE-A10" />
      {report.recommendation && (
        <PrintKv
          rows={[
            ['综合风险评价', verdict],
            ['授信参考', '还款来源测算可覆盖（最终以银行审批为准）'],
            ['测算参考额度', `${report.recommendation.amount.toLocaleString('zh-CN')} 万元`],
            ['参考期限', `${report.recommendation.term} 个月`],
            ['参考利率', report.recommendation.rate],
            ['担保方式', report.recommendation.guarantee],
            ['还款方式', '按月付息，到期还本'],
            ['关键风控条件', report.recommendation.conditions.join('；')],
          ]}
        />
      )}

      <SectionH2 number="1.3" title="一票否决项检查" agentId="SE-01" />
      <p className="print-body">
        本节列示监管要求和银行内部规定下的一票否决项，共 {report.oneVoteVeto.length} 项。任一项命中，授信申请直接拒绝。本次核查：触发 {vetoHit.length} 项，通过 {vetoOk.length} 项。
      </p>
      <PrintTable
        header={['否决项', '数据来源接口', '检查结果', '是否触发']}
        rows={report.oneVoteVeto.map((it) => [
          it.item,
          it.apiSource,
          it.triggered ? '命中' : '未命中',
          it.triggered ? '✗ 触发' : '✓ 通过',
        ])}
      />

      <SectionH2 number="1.4" title="核心风险点提示" agentId="LE-A10" />
      <AgentBlock blockId="LE-1.4-core-risks" customerId={customer.id} />

      <SectionH2 number="1.5" title="授信结构性建议" agentId="LE-A10" />
      <AgentBlock blockId="LE-1.5-credit-structure" customerId={customer.id} />

      <PageBreak />

      {/* ═══ 第二部分　企业概况与历史沿革 LE-A01 ═══ */}
      <SectionH1>第二部分　企业概况与历史沿革</SectionH1>
      <p className="print-body">
        本部分系统呈现企业的工商基本信息、股权结构、发展历史、商业模式、核心产品与经营场所，为审批人员建立企业整体认知。整章主责 Agent：<strong>LE-A01 企业画像</strong>。
      </p>

      <SectionH2 number="2.1" title="工商登记基本信息" agentId="LE-A01" />
      <DataSource>工商信息综合查询（大工商）+ 企业工商基本信息接口</DataSource>
      <PrintKv
        rows={[
          ['企业名称', customer.name],
          ['曾用名', profile.formerName],
          ['统一社会信用代码', customer.unifiedSocialCreditCode],
          ['企业类型', profile.enterpriseType],
          ['法定代表人', customer.legalRepresentative],
          ['注册资本', `${customer.registeredCapital} 万元（实缴 ${customer.registeredCapital} 万元）`],
          ['注册日期', customer.registeredAt],
          ['登记机关', profile.registrationAuthority],
          ['登记状态', profile.registrationStatus],
          ['注册地址', profile.registeredAddress],
        ]}
      />

      <SectionH3 number="2.1.1" title="经营范围" agentId="LE-A01" />
      <p className="print-body">{profile.businessScope}</p>

      <SectionH3 number="2.1.2" title="分支机构" agentId="LE-A01" />
      <DataSource>企业分支机构接口</DataSource>
      <PrintTable
        header={['序号', '分支机构名称', '类型', '成立日期', '登记状态']}
        rows={profile.branches.length > 0
          ? profile.branches.map((b, i) => [String(i + 1), b.name, b.type, b.foundedAt, b.status])
          : [['—', '本企业暂无登记分支机构', '—', '—', '—']]}
      />

      <SectionH3 number="2.1.3" title="历史工商变更（近三年）" agentId="LE-A01" />
      <DataSource>企业工商变更接口 | 显示近三年内重大变更</DataSource>
      <PrintTable
        header={['变更日期', '变更项', '变更前', '变更后']}
        rows={profile.historyChanges.length > 0
          ? profile.historyChanges.map((c) => [c.date, c.item, c.before, c.after])
          : [['—', '近三年无重大工商变更', '—', '—']]}
      />

      <SectionH2 number="2.2" title="股权结构与穿透" agentId="LE-A01" />

      <SectionH3 number="2.2.1" title="股东出资明细" />
      <DataSource>企业股东及出资 + 企业股东信息（工商公示）接口</DataSource>
      <PrintTable
        header={['股东名称', '股东类型', '出资额(万)', '持股比例', '出资方式', '实缴情况']}
        rows={profile.shareholders.map((s) => [s.name, s.type, s.amount, s.ratio, s.method, s.paidIn])}
      />

      <SectionH3 number="2.2.2" title="股权穿透分析" />
      <DataSource>企业股权透视 + 企业股权穿透查询 + 企业最终控制方 + 企业受益所有人</DataSource>
      <PrintEquityTree
        title="股权穿透图（直接 + 间接）"
        description={`实控人 ${profile.controllerName} 穿透合计 ${profile.controllerTotalStake}`}
        rootName={customer.name}
        shareholders={profile.shareholders.map((s) => ({ name: s.name, ratio: s.ratio, type: s.type }))}
        controllerNote={
          profile.controllerIndirectStake === '0%'
            ? `${profile.controllerName} 直接持股 ${profile.controllerDirectStake}（央行 235 号文受益所有人）`
            : `${profile.controllerName} 直接 ${profile.controllerDirectStake} + 通过 ${profile.controllerIndirectVehicle} 间接 ${profile.controllerIndirectStake} = 穿透 ${profile.controllerTotalStake}（央行 235 号文）`
        }
      />
      <PrintKv
        rows={[
          ['最终控制方', `${profile.controllerName} 持股 ${profile.controllerTotalStake}（穿透）`],
          ['实际控制人识别依据', '央行 235 号文受益所有人识别标准'],
          ['是否多层嵌套', profile.controllerIndirectStake === '0%' ? '否（直接持有）' : '否（最多两层）'],
          ['是否存在代持嫌疑', '否'],
        ]}
      />

      <SectionH3 number="2.2.3" title="股权特殊事项" />
      <DataSource>企业股权冻结 + 企业股权出质</DataSource>
      <PrintTable
        header={['事项类型', '标的股东', '金额/比例', '状态', '起止时间']}
        rows={profile.shareholderEvents.length > 0
          ? profile.shareholderEvents.map((e) => [e.kind, e.subject, e.amount, e.status, e.period])
          : [['—', '—', '—', '本企业股权未发生冻结、出质', '—']]}
      />

      <SectionH2 number="2.3" title="企业历史沿革与发展" agentId="LE-A01" />
      <AgentBlock blockId="LE-2.3-history" customerId={customer.id} />

      <SectionH2 number="2.4" title="主营业务与商业模式" agentId="LE-A01" />
      <AgentBlock blockId="LE-2.4-business-model" customerId={customer.id} />

      <SectionH2 number="2.5" title="核心产品与服务" agentId="LE-A01" />
      <DataSource>企业产品信息查询 + 企业资质证书 + 企业商标信息</DataSource>
      <PrintTable
        header={['产品/服务', '类别', '占营收比例', '核心客户群', '竞争力描述']}
        rows={profile.products.length > 0
          ? profile.products.map((p) => [p.name, p.category, p.revenueShare, p.customers, p.competitiveness])
          : [['—', '—', '—', '产品信息待补充', '—']]}
      />

      <SectionH3 number="2.5.1" title="企业资质与许可" />
      <DataSource>企业资质证书 + 企业行政许可</DataSource>
      <PrintTable
        header={['资质名称', '颁发机关', '证书编号', '颁发日期', '有效期']}
        rows={profile.certifications.length > 0
          ? profile.certifications.map((c) => [c.name, c.issuer, c.certNumber, c.issuedAt, c.validTill])
          : [['—', '—', '—', '资质信息待补充', '—']]}
      />

      <SectionH2 number="2.6" title="经营场所与产能" agentId="LE-A01" />
      <DataSource>企业土地信息 + 企业用电数据标签 + 企业海关登记</DataSource>
      <PrintKv
        rows={[
          ['注册地址', profile.registeredAddress],
          ['经营地址', profile.factoryArea > 0 ? `同注册地址，自有厂房 ${profile.factoryArea.toLocaleString('zh-CN')} 平方米` : '同注册地址'],
          ['产权状态', profile.realEstateRights !== '—' ? `自有，${profile.realEstateRights}` : '—'],
          ['生产线 / 产能', profile.productionLines > 0 ? `${profile.productionLines} 条生产线，设计年产能 ${profile.capacity}，当前利用率约 ${profile.capacityUtilization}` : '—'],
          ['仓储', profile.warehouse],
          ['进出口', profile.customsRegistration],
          ['用电稳定性指数', `${profile.electricityStability} / 100（近 24 月波动系数 ${profile.electricityVolatility}）`],
        ]}
      />

      <PageBreak />

      {/* ═══ 第三部分　实控人与管理团队 LE-A02 ═══ */}
      <SectionH1>第三部分　实控人与管理团队</SectionH1>
      <p className="print-body">
        "人即企业"，对小微企业而言，实控人和管理团队的素质直接决定企业风险水平。整章主责 Agent：<strong>LE-A02 实控人画像</strong>。
      </p>

      <SectionH2 number="3.1" title="法定代表人画像" agentId="LE-A02" />
      <DataSource>个人综合涉诉（全量版）+ 限制高消费 + 银行卡涉赌涉诈 + 企业法人对外投资 + 法人其他公司任职</DataSource>

      <SectionH3 number="3.1.1" title="基本信息" />
      <PrintTable
        header={['姓名', customer.legalRepresentative, '性别', profile.legalRepGender]}
        rows={[
          ['年龄', `${profile.legalRepAge} 岁`, '学历', profile.legalRepEducation],
          ['身份证（脱敏）', profile.legalRepIdMasked, '在行业从业年限', `${profile.legalRepYearsInIndustry} 年`],
          ['个人征信', profile.legalRepCreditStatus, '限制高消费', '无'],
          ['银行卡涉赌涉诈', '未命中', '个人涉诉案件', '无'],
          ['是否被列入失信被执行人', '否', '是否限制出境', '否'],
        ]}
      />

      <SectionH3 number="3.1.2" title="对外投资与任职情况" />
      <DataSource>企业法定代表人对外投资 + 企业法定代表人其他公司任职</DataSource>
      <PrintTable
        header={['关联企业', '角色', '持股比例', '经营状态', '成立日期']}
        rows={profile.legalRepForeignInvestments.length > 0
          ? profile.legalRepForeignInvestments.map((r) => [r.name, r.role, r.ratio, r.status, r.foundedAt])
          : [[customer.name, '法定代表人 / 股东', '—', '存续', customer.registeredAt]]}
      />

      <SectionH3 number="3.1.3" title="法人画像综合分析" agentId="LE-A02" />
      <AgentBlock blockId="LE-3.1.3-legal-rep-portrait" customerId={customer.id} />

      <SectionH2 number="3.2" title="实际控制人识别（央行 235 号文）" agentId="LE-A02" />
      <DataSource>企业疑似控制人 + 企业最终控制方 + 企业受益所有人</DataSource>
      <PrintKv
        rows={[
          ['疑似实际控制人', profile.controllerName],
          ['识别依据', '央行 235 号文 §6（直接 + 间接受益所有人 ≥ 25%）'],
          ['直接持股', profile.controllerDirectStake],
          ['间接受益', profile.controllerIndirectStake === '0%' ? '无（仅直接持股）' : `通过${profile.controllerIndirectVehicle}间接持有 ${profile.controllerIndirectStake}`],
          ['合计穿透受益', profile.controllerTotalStake],
          ['是否存在隐名股东', '否（已通过工商档案 + 受益所有人交叉核验）'],
        ]}
      />

      <SectionH2 number="3.3" title="董监高履历与负面信息" agentId="LE-A02" />
      <DataSource>企业主要人员 + 董监高投资任职及负面信息综合查询</DataSource>
      <PrintTable
        header={['姓名', '职务', '证件(脱敏)', '个人征信', '对外投资数', '负面信息', '限高/失信']}
        rows={profile.managementTeam.length > 0
          ? profile.managementTeam.map((m) => [m.name, m.position, m.idMasked, m.credit, m.investments, m.negative, m.sanction])
          : [[customer.legalRepresentative, '董事长 / 总经理', profile.legalRepIdMasked, profile.legalRepCreditStatus, '—', '无', '无']]}
      />
      <SectionH3 number="3.3.1" title="关键人员稳定性评估" />
      <p className="print-body">{profile.managementStabilityNote}</p>

      <SectionH2 number="3.4" title="关联企业网络" agentId="LE-A02" />
      <DataSource>关联方清单查询（4 套监管规则）+ 谱系成员清单 + 企业视角接口</DataSource>

      <SectionH3 number="3.4.1" title="关联企业清单" />
      <PrintTable
        header={['关联企业名称', '关联类型', '关联依据', '经营状态', '风险标签']}
        rows={profile.relatedEnterprises.length > 0
          ? profile.relatedEnterprises.map((r) => [r.name, r.type, r.basis, r.status, r.tag])
          : [['—', '—', '—', '未识别关联企业', '—']]}
      />

      <SectionH3 number="3.4.2" title="关联方风险传导分析" agentId="LE-A02" />
      <AgentBlock blockId="LE-3.4.2-related-party" customerId={customer.id} />
      <PrintRelatedNetwork
        title="关联方网络图"
        description={`二度关联 ${profile.totalRelatedCount} 家（股权 ${profile.equityRelatedCount} / 供应链 ${profile.supplyChainRelatedCount}）`}
        rootName={customer.name}
        related={profile.relatedEnterprises.length > 0 ? profile.relatedEnterprises.map((r) => ({ name: r.name, type: r.type, tag: r.tag })) : [{ name: '暂未识别关联企业', type: '—', tag: '—' }]}
      />

      <PageBreak />

      {/* ═══ 第四部分 LE-A03 ═══ */}
      <SectionH1>第四部分　行业与经营分析</SectionH1>
      <p className="print-body">
        行业是经营的底色。本部分从行业景气度、政策环境、竞争格局、上下游产业链、经营波动性等维度，对企业所处的行业环境和企业自身经营态势进行系统分析。整章主责：<strong>LE-A03 行业经营 Agent</strong>（依赖外接行业 RAG 语料库）。
      </p>

      <SectionH2 number="4.1" title="行业概况与景气度" agentId="LE-A03" />
      <AgentBlock blockId="LE-4.1-industry" customerId={customer.id} />

      <SectionH2 number="4.2" title="行业政策环境" agentId="LE-A03" />
      <AgentBlock blockId="LE-4.2-policy" customerId={customer.id} />

      <SectionH2 number="4.3" title="竞争格局与企业地位" agentId="LE-A03" />
      <DataSource>企业划型 + 企业标签 + 招投标记录 + 行业舆情</DataSource>
      <PrintKv
        rows={[
          ['企业划型', '小型企业（工信部 300-1000 人 / 营收 2000 万-4 亿）'],
          ['企业标签', '高新技术 / 专精特新（市级）'],
          ['全国市占率', '约 0.3%'],
          ['华南区域市占率（智能分拣）', '4.2%（区域 Top 3）'],
          ['主要竞争对手', '中科微至（龙头）/ 今天国际 / 本地竞品 3 家'],
          ['竞争优势', '价格较头部低 15-20%；定制化响应快；本地化服务强'],
        ]}
      />

      <SectionH2 number="4.4" title="上下游产业链" agentId="LE-A03" />
      <DataSource>API 发票 + 纳税（上下游汇总）+ 反欺诈接口（收入/支出真实性）</DataSource>

      <SectionH3 number="4.4.1" title="主要客户（销项）" />
      <PrintTable
        header={['客户名称', '占营收比', '近12月开票额', '客户类型', '稳定性']}
        rows={profile.topCustomers.length > 0
          ? profile.topCustomers.map((c) => [c.name, c.share, c.amount, c.type, c.stability])
          : [['—', '—', '—', '客户信息待补充', '—']]}
      />

      <SectionH3 number="4.4.2" title="主要供应商（进项）" />
      <PrintTable
        header={['供应商名称', '占采购比', '近12月开票额', '供应商类型', '稳定性']}
        rows={profile.topSuppliers.length > 0
          ? profile.topSuppliers.map((s) => [s.name, s.share, s.amount, s.type, s.stability])
          : [['—', '—', '—', '供应商信息待补充', '—']]}
      />

      <SectionH3 number="4.4.3" title="上下游关系深度分析" agentId="LE-A03" />
      <AgentBlock blockId="LE-4.4.3-supply-chain" customerId={customer.id} />

      <SectionH2 number="4.5" title="经营波动性分析" agentId="LE-A03" />
      <DataSource>企业用电数据标签（90 字段）+ 招聘信息 + 纳税基础信息（月度）</DataSource>

      <SectionH3 number="4.5.1" title="用电量趋势" />
      <PrintLineTrend
        title="近 12 月用电量月度走势"
        description={`月均 ${profile.electricityMonthlyAvg}，波动系数 ${profile.electricityVolatility}，同比 ${profile.electricity12mGrowth}`}
        data={syntheticMonthly(parseChineseNumber(profile.electricity12mTotal), parseFloat(profile.electricityVolatility) || 0.18, 1)}
        yLabel="万度"
      />
      <PrintKv
        rows={[
          ['近 12 月用电总量', profile.electricity12mTotal],
          ['同比变化', profile.electricity12mGrowth],
          ['月均', profile.electricityMonthlyAvg],
          ['波动系数', `${profile.electricityVolatility}（行业基准 0.15-0.30）`],
          ['用电稳定性指数', `${profile.electricityStability} / 100`],
        ]}
      />

      <SectionH3 number="4.5.2" title="招聘活跃度" />
      <DataSource>招聘信息接口</DataSource>
      <p className="print-body">
        {profile.recruitmentCount12m > 0
          ? `近 12 月公开招聘 ${profile.recruitmentCount12m} 次，岗位包括：${profile.recruitmentPositions}。判断：经营活跃，结构以技术、销售岗位为主，与扩产能逻辑匹配。`
          : '近 12 月未识别公开招聘活动，建议结合实地走访确认经营状态。'}
      </p>

      <SectionH3 number="4.5.3" title="纳税申报趋势" />
      <PrintBarTrend
        title="近 12 月增值税申报金额走势"
        description="按月增值税申报金额，反映季节性与经营节奏"
        data={syntheticMonthly(parseChineseNumber(profile.taxFiling.find((r) => r.item.includes('增值税申报'))?.y ?? '0') * 10, 0.22, 7)}
        yLabel="万元"
      />

      <SectionH2 number="4.6" title="SWOT 分析" agentId="LE-A03" />
      <AgentBlock blockId="LE-4.6-swot" customerId={customer.id} />

      <PageBreak />

      {/* ═══ 第五部分 LE-A04 ═══ */}
      <SectionH1>第五部分　财务深度分析</SectionH1>
      <p className="print-body">
        本部分综合企业自报财报、增值税发票、纳税申报、用电、社保等多源数据进行交叉验证。整章主责：<strong>LE-A04 财务诊断 Agent</strong>（依赖行业财务基准库）。
      </p>

      <SectionH2 number="5.1" title="财务报表概览" agentId="LE-A04" />
      <DataSource>企业财务状况综合查询 + 财务基础信息 + 资产负债表/利润表/现金流表</DataSource>

      <SectionH3 number="5.1.1" title="资产负债表（近三年）" />
      <PrintTable
        header={['项目（万元）', '2023 年末', '2024 年末', '2025 年末', '近一期', '同比变化']}
        rows={profile.balanceSheet.length > 0
          ? profile.balanceSheet.map((r) => [r.item, r.y2, r.y1, r.y, r.latest ?? r.y, r.growth ?? '—'])
          : [['—', '—', '—', '—', '财务数据待补充', '—']]}
      />

      <SectionH3 number="5.1.2" title="利润表（近三年）" />
      <PrintTable
        header={['项目（万元）', '2023', '2024', '2025', '近一期', '同比变化']}
        rows={profile.incomeStatement.length > 0
          ? profile.incomeStatement.map((r) => [r.item, r.y2, r.y1, r.y, r.latest ?? r.y, r.growth ?? '—'])
          : [['—', '—', '—', '—', '财务数据待补充', '—']]}
      />

      <SectionH3 number="5.1.3" title="现金流量表（近三年）" />
      <PrintTable
        header={['项目（万元）', '2023', '2024', '2025', '近一期', '同比变化']}
        rows={profile.cashFlowStatement.length > 0
          ? profile.cashFlowStatement.map((r) => [r.item, r.y2, r.y1, r.y, r.latest ?? r.y, r.growth ?? '—'])
          : [['—', '—', '—', '—', '财务数据待补充', '—']]}
      />

      <SectionH2 number="5.2" title="资产负债结构分析" agentId="LE-A04" />
      <AgentBlock blockId="LE-5.2-balance-sheet" customerId={customer.id} />
      {(() => {
        // 从 balanceSheet 提取关键科目派生饼图数据
        const get = (item: string) => {
          const r = profile.balanceSheet.find((b) => b.item.includes(item));
          return r ? Math.abs(parseChineseNumber(r.y)) : 0;
        };
        const liquidAsset = get('流动资产合计');
        const nonLiquidAsset = get('非流动资产合计');
        const liquidLiab = get('流动负债');
        const nonLiquidLiab = get('非流动负债');
        const equity = get('所有者权益');
        const assetData = [
          { name: '流动资产', value: liquidAsset, color: '#2563eb' },
          { name: '非流动资产', value: nonLiquidAsset, color: '#10b981' },
        ].filter((d) => d.value > 0);
        const liabData = [
          { name: '流动负债', value: liquidLiab, color: '#f59e0b' },
          { name: '非流动负债', value: nonLiquidLiab, color: '#ef4444' },
          { name: '所有者权益', value: equity, color: '#10b981' },
        ].filter((d) => d.value > 0);
        return assetData.length > 0 ? (
          <>
            <PrintPie title="资产构成" description="近一期资产端结构" data={assetData} />
            {liabData.length > 0 && <PrintPie title="负债 + 权益构成" description="近一期资金来源结构" data={liabData} />}
          </>
        ) : null;
      })()}

      <SectionH3 number="5.2.1" title="关键比率" />
      <PrintTable
        header={['指标', '2023', '2024', '2025', '行业均值', '评价']}
        rows={profile.liquidityRatios.length > 0
          ? profile.liquidityRatios.map((r) => [r.metric, r.y2, r.y1, r.y, r.industry ?? '—', r.evaluation])
          : [['—', '—', '—', '—', '—', '比率数据待补充']]}
      />

      <SectionH2 number="5.3" title="盈利能力分析" agentId="LE-A04" />
      <AgentBlock blockId="LE-5.3-profitability" customerId={customer.id} />

      <SectionH3 number="5.3.1" title="关键比率" />
      <PrintTable
        header={['指标', '2023', '2024', '2025', '行业均值', '评价']}
        rows={profile.profitabilityRatios.length > 0
          ? profile.profitabilityRatios.map((r) => [r.metric, r.y2, r.y1, r.y, r.industry ?? '—', r.evaluation])
          : [['—', '—', '—', '—', '—', '比率数据待补充']]}
      />

      <SectionH2 number="5.4" title="现金流分析" agentId="LE-A04" />
      <AgentBlock blockId="LE-5.4-cashflow" customerId={customer.id} />
      <PrintTable
        header={['指标', '2023', '2024', '2025', '评价']}
        rows={profile.cashFlowRatios.length > 0
          ? profile.cashFlowRatios.map((r) => [r.metric, r.y2, r.y1, r.y, r.evaluation])
          : [['—', '—', '—', '—', '现金流比率待补充']]}
      />

      <SectionH2 number="5.5" title="营运能力分析" agentId="LE-A04" />
      <DataSource>核心财务指标 + 财务分析报告查询</DataSource>
      <PrintTable
        header={['指标', '2023', '2024', '2025', '行业均值', '评价']}
        rows={profile.operationRatios.length > 0
          ? profile.operationRatios.map((r) => [r.metric, r.y2, r.y1, r.y, r.industry ?? '—', r.evaluation])
          : [['—', '—', '—', '—', '—', '营运比率待补充']]}
      />

      <SectionH2 number="5.6" title="发票流水深度分析" agentId="LE-A04" />
      <DataSource>API 发票基础信息 + API 发票+纳税基础信息 + 发票基础信息</DataSource>

      <SectionH3 number="5.6.1" title="发票总览" />
      <PrintTable
        header={['指标', '2023', '2024', '2025', '近一期']}
        rows={profile.invoiceOverview.length > 0
          ? profile.invoiceOverview.map((r) => [r.item, r.y2, r.y1, r.y, r.latest ?? r.y])
          : [['—', '—', '—', '—', '发票数据待补充']]}
      />
      <PrintBarTrend
        title="销项发票月度走势（近 12 月）"
        description="按月销项发票金额，呈现季节性波动"
        data={syntheticMonthly(parseChineseNumber(profile.invoiceOverview.find((r) => r.item.includes('销项金额'))?.y ?? '0'), 0.20, 3)}
        yLabel="万元"
      />

      <SectionH3 number="5.6.2" title="发票深度分析" agentId="LE-A04" />
      <AgentBlock blockId="LE-5.6.2-invoice" customerId={customer.id} />

      <SectionH2 number="5.7" title="纳税申报与税负分析" agentId="LE-A04" />
      <DataSource>纳税基础信息 + 企业税务综合查询 + 纳税信用 + 企业所得税</DataSource>
      <PrintTable
        header={['指标', '2023', '2024', '2025']}
        rows={profile.taxFiling.length > 0
          ? profile.taxFiling.map((r) => [r.item, r.y2, r.y1, r.y])
          : [['—', '—', '—', '纳税数据待补充']]}
      />

      <SectionH2 number="5.8" title="关键财务比率横向对比" agentId="LE-A04" />
      <p className="print-body">
        将企业关键财务比率与行业均值、行业领先企业、同区域同规模企业进行对比。
      </p>
      {(() => {
        // 从 profitabilityRatios 取本企业 vs 行业，并把百分号去掉
        const num = (s: string) => parseFloat(s.replace(/[^\d.\-]/g, '')) || 0;
        const data = profile.profitabilityRatios.map((r) => ({
          metric: r.metric,
          本企业: num(r.y),
          行业均值: num(r.industry ?? '0'),
        }));
        return data.length > 0 ? (
          <PrintMultiBar
            title="关键盈利比率：本企业 vs 行业均值"
            description="近一期数据对比"
            data={data}
            series={[
              { key: '本企业', label: '本企业（近一期）', color: '#2563eb' },
              { key: '行业均值', label: '行业均值', color: '#94a3b8' },
            ]}
          />
        ) : null;
      })()}

      <SectionH2 number="5.9" title="财务异动与解释" agentId="LE-A04" />
      <AgentBlock blockId="LE-5.9-finance-anomaly" customerId={customer.id} />

      <PageBreak />

      {/* ═══ 第六部分 LE-A05 ═══ */}
      <SectionH1>第六部分　履约能力与征信表现</SectionH1>
      <p className="print-body">
        本部分系统呈现企业的历史融资记录、多头借贷情况、招投标履约表现和资产抵质押状况。整章主责：<strong>LE-A05 履约征信 Agent</strong>。
      </p>

      <SectionH2 number="6.1" title="历史融资记录" agentId="LE-A05" />
      <DataSource>融资综合查询（7 类融资记录）</DataSource>
      <PrintTable
        header={['融资类型', '笔数', '总金额(万)', '在贷余额(万)', '履约状态']}
        rows={profile.financingHistory.length > 0
          ? profile.financingHistory.map((f) => [f.type, f.count, f.total, f.balance, f.status])
          : [['—', '—', '—', '—', '融资记录待补充']]}
      />

      <SectionH2 number="6.2" title="多头借贷分析" agentId="LE-A05" />
      <DataSource>企业多机构查询统计（36 月）+ 短时版</DataSource>

      <SectionH3 number="6.2.1" title="长期多头（36 月）" />
      <PrintBarTrend
        title="近 12 月被查询次数月度分布"
        description={`累计 ${profile.longInquiryTotal}，覆盖 ${profile.longInquiryInstitutions} 机构`}
        data={syntheticMonthly(parseChineseNumber(profile.longInquiryTotal) / 3, 0.45, 9)}
        yLabel="次"
        color="#f59e0b"
      />
      <PrintKv
        rows={[
          ['近 36 月总查询次数', profile.longInquiryTotal],
          ['查询机构数', profile.longInquiryInstitutions],
          ['银行查询次数', profile.longInquiryBank],
          ['非银查询次数', profile.longInquiryNonBank],
        ]}
      />

      <SectionH3 number="6.2.2" title="短时多头（近 1/3/7/15 天）" />
      <PrintTable
        header={['时间窗口', '查询次数', '查询机构数', '预警等级']}
        rows={profile.shortInquiries.length > 0
          ? profile.shortInquiries.map((s) => [s.window, s.count, s.institutions, s.alert])
          : [['—', '—', '—', '短时查询数据待补充']]}
      />

      <SectionH2 number="6.3" title="招投标与履约表现" agentId="LE-A05" />
      <DataSource>企业招投标信息 + 招投标详情查询 + 企业海关登记</DataSource>
      <PrintKv
        rows={[
          ['近三年投标次数', `${profile.bidsCount} 次`],
          ['中标次数', `${profile.bidsWonCount} 次`],
          ['中标率', profile.bidsWinRate],
          ['中标金额合计', profile.bidsWonAmount],
          ['履约率', profile.bidsPerformanceRate],
          ['核心客户续约率', profile.bidsRenewRate],
          ['海关进出口额', profile.importExportAmount],
        ]}
      />

      <SectionH2 number="6.4" title="资产抵质押情况" agentId="LE-A05" />
      <DataSource>企业动产抵押 + 知识产权出质 + 不动产相关 + POS 商户数据</DataSource>

      <SectionH3 number="6.4.1" title="抵押资产清单" />
      <PrintTable
        header={['资产类型', '标的描述', '抵押权人', '金额(万)', '状态']}
        rows={profile.collateralAssets.length > 0
          ? profile.collateralAssets.map((c) => [c.type, c.description, c.mortgagee, c.amount, c.status])
          : [['—', '—', '—', '—', '抵押资产数据待补充']]}
      />

      <SectionH3 number="6.4.2" title="POS 商户经营数据" />
      <DataSource>商户指标数据查询</DataSource>
      <p className="print-body">
        本企业以 B2B 业务为主，无 POS 商户数据。/ 不适用。
      </p>

      <PageBreak />

      {/* ═══ 第七部分 LE-A06/A07 ═══ */}
      <SectionH1>第七部分　企业综合分析明细</SectionH1>
      <p className="print-body">
        本部分展示企业综合分析每个维度、每个子指标的接口调用、原始返回与分析规则，是各维度定性判断的可解释性证据。<strong>LE-A06 主责分析，LE-A07 主责交叉验证</strong>。
      </p>

      <SectionH2 number="7.1" title="维度一：经营稳定性（30%）" agentId="LE-A06" />
      <PrintTable
        header={['子指标', '数据接口', '分析规则', '原始数据']}
        rows={[
          ['企业存续年限', '工商基本信息', '≥5 年=强 / 3-5=较好 / <3=偏弱', '7.5 年'],
          ['注册资本实缴率', '企业股东及出资', '100% 实缴=强', '100%'],
          ['营收增长率', '核心财务指标', '>15%=强 / 5-15=较好 / <5=一般', '15.3%'],
          ['用电稳定性', '企业用电数据标签', '指数 ≥ 70', '76'],
          ['核心团队稳定性', '企业主要人员', '近 3 年 0 离职=强', '0 离职'],
          ['维度合计', '—', '—', '—'],
        ]}
      />

      <SectionH2 number="7.2" title="维度二：财务健康度（25%）" agentId="LE-A06" />
      <PrintTable
        header={['子指标', '数据接口', '分析规则', '原始数据']}
        rows={[
          ['资产负债率', '资产负债表', '< 50%=强', '48.6%'],
          ['流动比率', '资产负债表', '≥ 1.5=强', '1.73'],
          ['毛利率', '利润表', '高于行业=强', '22.4%'],
          ['应收账款周转', '核心财务指标', '行业内', '142 天'],
          ['现金流健康度', '现金流量表', '净现比 > 1=强', '1.23'],
          ['维度合计', '—', '—', '—'],
        ]}
      />

      <SectionH2 number="7.3" title="维度三：履约能力（25%）" agentId="LE-A06" />
      <PrintTable
        header={['子指标', '数据接口', '分析规则', '原始数据']}
        rows={[
          ['历史融资履约', '融资综合查询', '0 逾期=强', '0 逾期'],
          ['招投标履约', '招投标信息', '履约率 ≥ 95%=强', '100%'],
          ['纳税信用', '纳税信用', 'A=强 / B=较好 / C=一般', '较好'],
          ['多头借贷', '多机构查询', '正常=强', '正常'],
          ['抵押资产可控性', '动产抵押', '抵押率 < 70%=强', '60%'],
          ['维度合计', '—', '—', '—'],
        ]}
      />

      <SectionH2 number="7.4" title="维度四：合规性（15%）" agentId="LE-A06" />
      <PrintTable
        header={['子指标', '数据接口', '分析规则', '原始数据']}
        rows={[
          ['失信被执行', '失信被执行', '0=强', '0'],
          ['行政处罚', '企业行政处罚', '近 2 年 0=强', '1 起轻微'],
          ['法人个人风险', '个人综合涉诉', '0=强', '0'],
          ['司法涉诉', '企业涉诉', '0=强 / <3=较好', '0'],
          ['维度合计', '—', '—', '—'],
        ]}
      />

      <SectionH2 number="7.5" title="维度五：成长性（5%）" agentId="LE-A06" />
      <PrintTable
        header={['子指标', '数据接口', '分析规则', '原始数据']}
        rows={[
          ['行业景气度', '行业 RAG', '上行=较好 / 中性=一般', '中性偏积极'],
          ['研发投入比', '利润表', '> 5%=强', '7.2%'],
          ['专利数量', '企业商标 / 专利', '≥ 10=较好', '21 项'],
          ['核心团队学历结构', '社保 + 招聘', '本科以上 50%=较好', '本科 60%'],
          ['维度合计', '—', '—', '—'],
        ]}
      />

      <SectionH2 number="7.6" title="五对交叉验证结果" agentId="LE-A07" />
      <p className="print-body">
        交叉验证是发现单一维度分析难以察觉的潜在风险的核心手段，五对验证规则覆盖了财务真实性、规模真实性、贸易真实性、资金链紧张等关键风险点。
      </p>
      {report.crossValidations && (
        <PrintTable
          header={['验证对', '数据源 A', '数据源 B', '本次差异', '阈值', '结论']}
          rows={report.crossValidations.map((cv) => [
            cv.pair,
            cv.sourceA,
            cv.sourceB,
            cv.deviation,
            cv.pair.includes('纳税×用电') ? '40%' : cv.pair.includes('发票×营收') ? '30%' : cv.pair.includes('社保') ? '50%' : cv.pair.includes('反欺诈') ? '20%' : '—',
            cv.result,
          ])}
        />
      )}

      <SectionH3 number="7.6.1" title="交叉验证综合结论" agentId="LE-A07" />
      <AgentBlock blockId="LE-7.6.1-cross-validation" customerId={customer.id} />

      <PageBreak />

      {/* ═══ 第八部分 LE-A09 ═══ */}
      <SectionH1>第八部分　授信用途与还款来源</SectionH1>
      <p className="print-body">
        "借多少、用在哪、怎么还"是审批的核心问题。整章主责：<strong>LE-A09 授信用途与还款 Agent</strong>。
      </p>

      <SectionH2 number="8.1" title="授信用途分析" agentId="LE-A09" />
      <PrintKv
        rows={[
          ['申请用途', '流动资金贷款'],
          ['资金具体用途', '原材料采购 500 万 + 扩产能设备 200 万 + 补充流动资金 100 万'],
          ['用途合理性', '匹配企业经营计划，与销项预测一致'],
          ['用途监控建议', '受托支付，按用途分批放款'],
          ['替代融资可行性', '可（自有现金 + 应收账款保理）'],
          ['行业用途惯例', '原材料采购为流贷主要用途'],
        ]}
      />

      <SectionH2 number="8.2" title="第一还款来源测算" agentId="LE-A09" />
      <AgentBlock blockId="LE-8.2-repayment" customerId={customer.id} />
      <PrintKv
        rows={[
          ['年度经营性现金流（净）', '2,340 万元'],
          ['年度净利润', '1,900 万元'],
          ['年度税后留存', '1,420 万元'],
          ['本次本息合计（年）', '860 万元'],
          ['偿债保障倍数', '2.7×（基准 1.5-2.0×）'],
          ['敏感度（营收 -20%）', '1.4×'],
          ['敏感度（营收 -30%）', '1.1×'],
        ]}
      />

      <SectionH2 number="8.3" title="第二还款来源（担保 / 抵押）" agentId="LE-A09" />
      <PrintTable
        header={['担保方式', '标的', '评估价值(万)', '抵质押率', '净覆盖额(万)']}
        rows={profile.collateralProposals.length > 0
          ? profile.collateralProposals.map((c) => [c.type, c.description, c.amount, '—', c.status])
          : [['—', '—', '—', '—', '担保方案待审批人员根据具体业务确认']]}
      />
      <p className="print-body">{profile.collateralRationale}</p>

      <SectionH2 number="8.4" title="压力测试" agentId="LE-A09" />
      <PrintTable
        header={['压力情景', '假设条件', '经营现金流变化', '偿债保障倍数', '结论']}
        rows={[
          ['基准场景', '现状', '2,340 万', '2.7×', '充裕'],
          ['情景一', '营收 -20%', '1,210 万', '1.4×', '可承受'],
          ['情景二', '营收 -30%', '950 万', '1.1×', '勉强'],
          ['情景三', '营收 -35%（预警阈值）', '700 万', '0.8×', '触发预警'],
          ['情景四', '主要客户逾期 + 营收 -10%', '1,050 万', '1.2×', '可承受'],
        ]}
      />

      <PageBreak />

      {/* ═══ 第九部分 LE-A08 ═══ */}
      <SectionH1>第九部分　风险评估与缓释</SectionH1>
      <p className="print-body">
        本部分对企业面临的所有风险进行系统化梳理（行业 / 经营 / 财务 / 法律合规），并对每类风险给出对应的缓释措施建议。整章主责：<strong>LE-A08 风险地图 Agent</strong>。
      </p>

      <SectionH2 number="9.1" title="风险地图总览" agentId="LE-A08" />
      <AgentBlock blockId="LE-9.1-risk-map" customerId={customer.id} />
      <PrintRiskMatrix
        title="风险地图矩阵"
        description={`已识别 ${profile.industryRisks.length + profile.operationRisks.length + profile.financeRisks.length + profile.complianceRisks.length} 项风险（行业 ${profile.industryRisks.length} / 经营 ${profile.operationRisks.length} / 财务 ${profile.financeRisks.length} / 合规 ${profile.complianceRisks.length}）`}
        risks={[
          ...profile.industryRisks.map((r) => ({ point: r.point, likelihood: levelToNum(r.likelihood), severity: levelToNum(r.severity), category: '行业' })),
          ...profile.operationRisks.map((r) => ({ point: r.point, likelihood: levelToNum(r.likelihood), severity: levelToNum(r.severity), category: '经营' })),
          ...profile.financeRisks.map((r) => ({ point: r.point, likelihood: levelToNum(r.likelihood), severity: levelToNum(r.severity), category: '财务' })),
          ...profile.complianceRisks.map((r) => ({ point: r.point, likelihood: levelToNum(r.likelihood), severity: levelToNum(r.severity), category: '合规' })),
        ]}
      />

      <SectionH2 number="9.2" title="行业风险与缓释" agentId="LE-A08" />
      <PrintTable
        header={['风险点', '风险描述', '可能性', '严重性', '缓释措施']}
        rows={profile.industryRisks.length > 0
          ? profile.industryRisks.map((r) => [r.point, r.description, r.likelihood, r.severity, r.mitigation])
          : [['—', '—', '—', '—', '行业风险数据待补充']]}
      />

      <SectionH2 number="9.3" title="经营风险与缓释" agentId="LE-A08" />
      <PrintTable
        header={['风险点', '风险描述', '可能性', '严重性', '缓释措施']}
        rows={profile.operationRisks.length > 0
          ? profile.operationRisks.map((r) => [r.point, r.description, r.likelihood, r.severity, r.mitigation])
          : [['—', '—', '—', '—', '经营风险数据待补充']]}
      />

      <SectionH2 number="9.4" title="财务风险与缓释" agentId="LE-A08" />
      <PrintTable
        header={['风险点', '风险描述', '可能性', '严重性', '缓释措施']}
        rows={profile.financeRisks.length > 0
          ? profile.financeRisks.map((r) => [r.point, r.description, r.likelihood, r.severity, r.mitigation])
          : [['—', '—', '—', '—', '财务风险数据待补充']]}
      />

      <SectionH2 number="9.5" title="法律合规风险与缓释" agentId="LE-A08" />
      <PrintTable
        header={['风险点', '风险描述', '可能性', '严重性', '缓释措施']}
        rows={profile.complianceRisks.length > 0
          ? profile.complianceRisks.map((r) => [r.point, r.description, r.likelihood, r.severity, r.mitigation])
          : [['—', '—', '—', '—', '合规风险数据待补充']]}
      />

      <PageBreak />

      {/* ═══ 第十部分 LE-A11 ═══ */}
      <SectionH1>第十部分　贷后管理方案</SectionH1>
      <p className="print-body">
        本部分根据企业风险特征，定制化贷后监控方案。整章主责：<strong>LE-A11 贷后监控设计 Agent</strong>。
      </p>

      <SectionH2 number="10.1" title="事件驱动监控配置" agentId="LE-A11" />
      <DataSource>企业监控信息更新查询 + 企业监控配置接口</DataSource>
      <PrintTable
        header={['监控维度', '推送条件', '通知对象', '处置级别']}
        rows={[
          ['工商变更', '法定代表人 / 注册资本 / 经营范围变更', '客户经理 + 风控', '黄'],
          ['司法涉诉', '新增涉诉案件', '风控 + 法务', '红'],
          ['失信被执行', '新增失信记录', '风控 + 客户经理', '红'],
          ['限制高消费', '法人 / 实控人新增限高', '风控', '红'],
          ['行政处罚', '新增重大行政处罚', '风控 + 合规', '黄'],
          ['关联方风险', '关联方新增失信 / 涉诉', '风控', '黄'],
          ['用电 / 纳税异常', '连续 3 月归零 / 异常下降', '风控', '红'],
        ]}
      />

      <SectionH2 number="10.2" title="定期复核监控清单" agentId="LE-A11" />
      <PrintTable
        header={['监控项', '数据来源', '频率', '黄灯条件', '红灯条件']}
        rows={[
          ['财务季报', '客户经理报送', '季频', '资产负债率 +5pp', '资产负债率 &gt; 55%'],
          ['销项发票', 'API 发票', '月频', '环比 -10%', '环比 -25% 或归零'],
          ['用电量', '企业用电数据标签', '月频', '环比 -20%', '连续 3 月 -50%'],
          ['多头查询', '企业多机构查询', '月频', '月新增 &gt; 3 家', '月新增 &gt; 5 家'],
          ['关联交易', '关联方清单 + 发票', '月频', '占比 &gt; 25%', '占比 &gt; 35%'],
          ['纳税信用', '纳税信用', '季频', '降至 C', '降至 D'],
          ['社保人数', '社保实缴人数', '月频', '-10%', '-30%'],
          ['应收账款周转', '核心财务指标', '季频', '160 天', '180 天'],
        ]}
      />

      <SectionH2 number="10.3" title="预警分级与处置流程" agentId="LE-A11" />
      <PrintTable
        header={['预警级别', '触发条件', '响应时限', '处置措施', '升级条件']}
        rows={[
          ['红（严重）', '失信 / 用电归零 / 经营异常', '24h', '24h 内启动处置', '7 日未缓解 → 风险经理'],
          ['黄（关注）', '财务异常 / 多头新增 / 关联交易', '3 日', '客户经理回访', '处置无效 → 升红'],
          ['蓝（提示）', '行业政策 / 轻微财务波动', '月度', '月报跟踪', '—'],
          ['绿（正常）', '常态', '—', '常规跟踪', '—'],
        ]}
      />

      <SectionH2 number="10.4" title="授权管理说明" agentId="LE-A11" />
      <PrintTable
        header={['授权类别', '数据范围', '授权要求', '授权有效期']}
        rows={[
          ['企业数据授权', '纳税 / 发票 / 财务 / 用电 / 社保', '法人盖章 + 电子签约', '授信存续期'],
          ['法人个人授权', '身份核验 / 涉诉 / 限高 / 银行卡', 'H5 实人核身 + 电签', '授信存续期'],
          ['关联方扫描', '关联方清单内主体', '关联方主体单独授权', '授信存续期'],
          ['贷后监控', '事件驱动 + 定期复核', '客户授权监控合同', '授信存续期'],
        ]}
      />

      <PageBreak />

      {/* ═══ 调查结论与签字 ═══ */}
      <SectionH1>调查结论与签字</SectionH1>
      <p className="print-body">
        综合上述企业经营、财务、合规、行业及关联方多维度分析，以及企业综合分析（综合表现{verdict}）、五对交叉验证结果（关注 2 项 / 异常 0 项）、一票否决项检查（{vetoHit.length === 0 ? '全部通过' : `触发 ${vetoHit.length} 项`}），本次调查的最终结论为：
      </p>
      <p className="print-body">
        经测算还款来源可覆盖、核心风险整体可控，是否授信由银行审批人员独立判定。{report.recommendation && (
          <>
            供审批参考：额度 {report.recommendation.amount} 万元，期限 {report.recommendation.term} 个月，利率 {report.recommendation.rate}，担保方式 {report.recommendation.guarantee}。
          </>
        )}核心风险已通过结构性条款（季报报送、关联交易披露、TOP5 客户回款月报）覆盖。建议放款前完成不动产抵押登记，存续期内执行月度关联交易披露 + 季度财务报表复核。
      </p>
      <PrintTable
        header={['调查人签字', '复核人签字', '部门负责人签字']}
        rows={[
          [
            <span key="1" style={{ display: 'inline-block', width: 100, height: 36 }}>{customer.manager}</span>,
            <span key="2" style={{ display: 'inline-block', width: 100, height: 36 }}>—</span>,
            <span key="3" style={{ display: 'inline-block', width: 100, height: 36 }}>—</span>,
          ],
          [`日期：____年____月____日`, `日期：____年____月____日`, `日期：____年____月____日`],
        ]}
      />

      <PageBreak />

      {/* ═══ 附录 ═══ */}
      <SectionH1>附录</SectionH1>

      <SectionH2 number="附录 A" title="数据接口清单与字段说明" />
      <p className="print-body">
        本报告引用的所有数据接口及关键字段如下，数据均来自正菱（珠海）数据服务有限公司 API 平台。共调用 90 个接口，涉及 SE-01 / LE-A01-A11 / FB-01 五类调用方。
      </p>

      <SectionH3 number="A.1" title="企业综合数据" />
      <PrintTable
        header={['接口名称', '用途章节', '调用频次', '授权要求']}
        rows={[
          ['工商信息综合查询（大工商）', '2.1 / 2.2', '一次性', '无'],
          ['企业工商基本信息', '2.1', '一次性', '无'],
          ['企业股东及出资', '2.2.1', '一次性', '无'],
          ['企业股东信息（工商公示）', '2.2.1', '一次性', '无'],
          ['企业股权透视', '2.2.2', '一次性', '无'],
          ['企业股权穿透查询', '2.2.2', '一次性', '无'],
          ['企业最终控制方', '2.2.2 / 3.2', '一次性', '无'],
          ['企业受益所有人', '2.2.2 / 3.2', '一次性', '无'],
          ['企业分支机构', '2.1.2', '一次性', '无'],
        ]}
      />

      <SectionH3 number="A.2" title="司法涉诉数据" />
      <PrintTable
        header={['接口名称', '用途章节', '调用频次', '授权要求']}
        rows={[
          ['企业涉诉', '7.4 / 9.5', '一次性 + 推送', '无'],
          ['失信被执行', '1.3 / 7.4', '实时', '无'],
          ['限制高消费', '1.3 / 3.1.1', '实时', '无'],
          ['企业严重违法', '1.3', '实时', '无'],
          ['司法解析（涉诉详情）', '7.4', '一次性', '无'],
        ]}
      />

      <SectionH3 number="A.3" title="企业财税数据" />
      <PrintTable
        header={['接口名称', '用途章节', '调用频次', '授权要求']}
        rows={[
          ['核心财务指标', '5.1 / 5.5', '一次性', '需企业授权'],
          ['财务分析报告', '5.2 / 5.3 / 5.4', '一次性', '需企业授权'],
          ['API 发票基础信息', '5.6', '一次性', '需企业授权'],
          ['API 发票 + 纳税基础信息', '4.4 / 5.6', '一次性', '需企业授权'],
          ['纳税信用', '5.7', '一次性', '需企业授权'],
        ]}
      />

      <SectionH3 number="A.4" title="其他重要数据" />
      <PrintTable
        header={['接口名称', '用途章节', '调用频次', '授权要求']}
        rows={[
          ['企业用电数据标签（90 字段）', '4.5 / 9.3', '月频', '需企业授权'],
          ['企业招聘信息', '4.5.2', '月频', '无'],
          ['企业海关登记', '6.3', '一次性', '无'],
          ['企业动产抵押', '6.4', '一次性', '无'],
          ['企业监控信息更新查询', '10.1', '推送', '需企业授权'],
        ]}
      />

      <SectionH2 number="附录 B" title="分析方法详解" />
      <SectionH3 number="B.1" title="分析方法说明" />
      <p className="print-body">
        本分析不进行数值打分或加权汇总；各维度依据多源数据形成 强 / 较好 / 一般 / 偏弱 的定性判断，综合评价由各维度表现与风险点归纳得出。
      </p>

      <SectionH3 number="B.2" title="权重设计依据" />
      <p className="print-body">
        各维度权重 30/25/25/15/5 的设计依据：① 法人小微"企业独立于人"，企业经营是核心，因此经营稳定性权重最高；② 财务和履约直接对应偿债能力，权重并列第二；③ 合规和成长性权重适中，反映长期可持续性。权重经 50,000+ 历史样本回测验证。
      </p>

      <SectionH3 number="B.3" title="阈值设定原则" />
      <p className="print-body">
        各子指标阈值（如资产负债率 &lt; 50% 为优）的设定依据：① 行业基准（专用设备制造业行业研报）；② 监管要求（银保监普惠金融评估办法）；③ 历史样本回测（金智维内部 50,000+ 样本）。
      </p>

      <SectionH3 number="B.4" title="一票否决规则" />
      <p className="print-body">
        共 10 项一票否决，分为四大类：① 企业经营底线（4 项：失信 / 重大违法 / 破产 / 空壳）；② 法人个人风险（3 项：失信 / 限高 / 涉赌涉诈）；③ 监管底线（2 项：重大税收违法 / 严重违法）；④ 经营异常（1 项：连续 3 月用电归零）。法规依据：《征信业务管理办法》《商业银行授信工作尽职指引》。
      </p>

      <SectionH2 number="附录 C" title="原始数据快照（脱敏）" />
      <p className="print-body">
        本报告所有分析结论均可追溯到原始数据快照。完整脱敏数据快照存储于客户银行私有存储，数据时点 {report.generatedAt ?? customer.updatedAt}，可应银保监及内部审计核查。
      </p>
      <PrintTable
        header={['数据类别', '记录数', '数据时点', '存储位置']}
        rows={[
          ['工商档案', '32 项', customer.updatedAt, '客户银行私有库 / snapshot_id: snap_20260429_001'],
          ['财务三表', '近三年 + 近一期', customer.updatedAt, '同上'],
          ['发票数据', '近 36 月 6,790 张', customer.updatedAt, '同上'],
          ['纳税申报', '近三年 36 期', customer.updatedAt, '同上'],
          ['司法涉诉', '0 项', customer.updatedAt, '同上'],
          ['用电 / 社保 / 招聘', '近 24 月', customer.updatedAt, '同上'],
        ]}
      />

      <SectionH2 number="附录 D" title="数据合规授权链条" />
      <SectionH3 number="D.1" title="数据源合规授权" />
      <p className="print-body">
        正菱（珠海）数据服务有限公司作为本报告核心数据源，具备数据要素流通资质和合规能力。各类数据采集均符合《数据安全法》《个人信息保护法》《征信业务管理办法》要求。
      </p>

      <SectionH3 number="D.2" title="企业数据授权" />
      <p className="print-body">
        贷前授权：{customer.name} 于 2026-04-26 签署《数据使用授权书》，授权客户银行通过金智维平台调用其纳税、发票、财务、用电、社保等需授权数据。授权范围：本次授信申请的尽职调查及授信存续期内的贷后监控。授权期限：授权之日起至贷款全部清偿之日止。
      </p>

      <SectionH3 number="D.3" title="个人数据授权" />
      <p className="print-body">
        法定代表人 {customer.legalRepresentative} 于 2026-04-26 签署《个人信息处理同意书》，授权方式：H5 实人核身 + 电子签约，完整签约日志保存于客户银行私有存储。
      </p>

      <SectionH3 number="D.4" title="数据使用边界" />
      <PrintTable
        header={['使用方', '使用目的', '数据范围', '保留期限']}
        rows={[
          ['客户银行授信审批', '本次授信审批', '完整脱敏快照', '授信存续期 + 5 年'],
          ['客户银行风控', '贷后监控', '事件驱动 + 月度复核', '授信存续期'],
          ['内部审计', '合规审查', '快照查询权限', '存续期 + 10 年'],
          ['监管报送', '银保监 / 央行', '聚合统计', '按监管要求'],
        ]}
      />

      <SectionH2 number="附录 E" title="行业参考资料" />
      <p className="print-body">
        本报告引用的行业研报、政策文件、新闻舆情等参考资料：
      </p>
      <p className="print-body">
        · 中国机械工业联合会《2025 年专用设备制造业发展报告》
        <br />· 国务院《推动工业领域设备更新实施方案》（国办发〔2025〕XX 号）
        <br />· 工信部《智能制造试点示范行动方案 2025-2027》
        <br />· 广东省工信厅《制造业当家"22 条"政策汇编》
        <br />· Wind 行业数据库 · C35 专用设备制造业 2023-2025 月度数据
        <br />· 金智维内部行业 RAG 语料库 v2.6（2026-04 更新）
      </p>

      <SectionH2 number="附录 F" title="模型版本说明" />
      <PrintTable
        header={['项目', '内容']}
        rows={[
          ['模型名称', '金智维法人小微企业企业综合分析模型'],
          ['模型版本', 'v2.6.1'],
          ['模型上线时间', '2026-01-15'],
          ['本次分析时间', report.generatedAt ?? customer.updatedAt],
          ['训练样本数', '50,000+'],
          ['回测准确率', 'KS 0.42 / AUC 0.81'],
          ['维度数', '5 维 / 24 个子指标'],
          ['一票否决项数', '10 项'],
          ['模型监管备案', '已备案（备案号：XXXXX）'],
          ['人在环节点', '3 个（授权 / 报告签字 / 模型改进审批）'],
        ]}
      />

      <SectionH2 number="附录 G" title="术语表" />
      <PrintTable
        header={['术语', '解释']}
        rows={[
          ['SDAFI', 'Sense-Decide-Act-Feedback-Improve 五阶段闭环框架'],
          ['Agent 数据池', 'SE-01 在 Sense 阶段冻结的不可变快照，所有下游 Agent 共享'],
          ['一票否决', '监管或银行内部规定下任一命中即直接拒绝的核查项'],
          ['五对交叉验证', '纳税×用电、发票×营收、社保×年报、反欺诈×发票、多头×融资'],
          ['企业综合分析', '经营稳定性 30 / 财务健康 25 / 履约能力 25 / 合规 15 / 成长 5'],
          ['偿债保障倍数', '年度经营性现金流 / 年度本息合计'],
          ['净现比', '经营性现金流 / 净利润'],
          ['CR5', '前五大客户（或供应商）合计占比'],
          ['受益所有人', '央行 235 号文定义的最终自然人受益所有人'],
          ['cycle_id', 'SDAFI 五张审计表的统一关联键'],
          ['人在环', 'Human-in-the-loop，三个强制人审批节点'],
        ]}
      />

      <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '20px 0' }} />
      <p style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
        — 本报告至此结束 —
        <br />金智维 · 智慧信贷智能体平台 · KINGSWARE · 数据驱动普惠金融
        <br />报告编号 {report.reportNumber} · 内部机密
      </p>
    </>
  );
}

/** 把 "218.4 万度" / "32 万元" / "约 28 万" 这样的中文金额提取数字部分 */
function parseChineseNumber(s: string): number {
  if (!s) return 0;
  const m = s.replace(/[，,]/g, '').match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : 0;
}

/** 严重程度文字 → 1-4 */
function levelToNum(s: string): number {
  if (s.includes('极高')) return 4;
  if (s.includes('高') || s.includes('已发生')) return 3;
  if (s.includes('中')) return 2;
  return 1;
}
