/**
 * 个体工商户 docx 章节
 * 与 src/app/(print)/credit/reports/[id]/print/sp-chapters.tsx 对齐：
 * 9 章 + 6 附录 + 62 张表，每个 Agent 生成区从 agent-content.ts 字典读。
 */

import { AlignmentType, Paragraph, TextRun } from 'docx';

import { getSpProfile } from '@/data/customer-profiles';
import type { SoleProprietorCustomer, DueDiligenceReport } from '@/data/types';

import {
  agentBlock,
  C,
  chartPlaceholder,
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

const FONT = 'Microsoft YaHei';

export function spChapters(
  customer: SoleProprietorCustomer,
  report: DueDiligenceReport,
): DocxChild[] {
  const v = customer.fourDimensionScores!;
  const profile = getSpProfile(customer);
  const totalScore = report.totalScore ?? 76;
  const grade = report.creditGrade ?? 'B';
  const isYancao = customer.shopType === '烟草零售';
  const isEcom = customer.shopType === '电商个体';
  const out: DocxChild[] = [];

  // ═══ 第一部分 ═══
  out.push(h1('第一部分　报告摘要与授信意见', { firstChapter: true }));
  out.push(p('个体工商户尽调的核心是评估"经营者这个人"。本部分快速给出经营者综合信用画像、四维评分、一票否决检查、反欺诈结果和最终授信建议。'));

  out.push(h2('1.1', '四维综合评分摘要', 'SP-A06'));
  out.push(
    dt(
      ['评分维度', '权重', '得分(0-100)', '加权分', '评级', '本维度备注'],
      [
        ['经营者个人信用画像', '35%', String(v.personalCredit), (v.personalCredit * 0.35).toFixed(1), gradeOf(v.personalCredit), '征信无不良 / 手机在网 96 月'],
        ['经济能力与资产', '25%', String(v.economicCapacity), (v.economicCapacity * 0.25).toFixed(1), gradeOf(v.economicCapacity), '名下住宅 1 套未抵押'],
        ['经营存续与真实性', '25%', String(v.operationAuthenticity), (v.operationAuthenticity * 0.25).toFixed(1), gradeOf(v.operationAuthenticity), '经营 8 年 / 用电稳定'],
        ['合规与社会稳定性', '15%', String(v.socialStability), (v.socialStability * 0.15).toFixed(1), gradeOf(v.socialStability), '无涉诉 / 已婚稳定'],
        ['综合得分', '100%', String(totalScore), String(totalScore), grade, '—'],
      ],
    ),
  );
  out.push(...chartPlaceholder('雷达图', '四维评分雷达图',
    `个人信用 ${v.personalCredit} / 经济能力 ${v.economicCapacity} / 经营存续 ${v.operationAuthenticity} / 合规社会 ${v.socialStability}`));

  out.push(h2('1.2', '信用等级与授信建议'));
  out.push(h3('1.2.1', '信用等级标准'));
  out.push(
    dt(
      ['等级', '分数区间', '授信建议', '标识'],
      [
        ['A', '85-100', '建议批准（标准条件，可信用 / 利率优惠）', '★★★'],
        ['B', '70-84', '建议批准（标准条件）', '★★'],
        ['C', '55-69', '有条件批准（须强化担保或缩限额）', '★'],
        ['D', '<55', '建议否决', '×'],
      ],
    ),
  );

  out.push(h3('1.2.2', '本次授信建议', 'SP-A08'));
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
        { k: '还款方式', v: '等额本息' },
        { k: '受托支付', v: '不强制' },
        { k: '关键风控条件', v: r.conditions.join('；') },
      ]),
    );
  }

  out.push(h2('1.3', '一票否决项检查', 'SE-01'));
  const vetoHit = report.oneVoteVeto.filter((x) => x.triggered);
  out.push(
    p(
      `个体户场景下，反欺诈和合规底线尤为重要，任一项命中直接拒绝。本次核查 ${report.oneVoteVeto.length} 项，触发 ${vetoHit.length} 项，通过 ${report.oneVoteVeto.length - vetoHit.length} 项。`,
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

  out.push(h2('1.4', '核心风险点提示', 'SP-A08'));
  out.push(...agentBlock('SP-1.4-core-risks', customer.id));

  // ═══ 第二部分 SP-A01 ═══
  out.push(h1('第二部分　经营者画像'));
  out.push(p('"人即企业"。整章主责：SP-A01 经营者画像 Agent。'));

  out.push(h2('2.1', '经营者基本信息', 'SP-A01'));
  out.push(dataSource('身份二要素核验 + 身份证三要素 + 人脸识别实人校验'));
  out.push(
    dt(
      ['项', '内容', '项', '内容'],
      [
        ['姓名', customer.ownerName, '性别', profile.ownerGender],
        ['身份证号（脱敏）', profile.ownerIdMasked, '年龄', `${profile.ownerAge} 岁`],
        ['户籍地', profile.ownerHukou, '现居地', profile.ownerCurrentResidence],
        ['人脸活体检测', '通过', '身份核验结果', '一致'],
        ['出生日期', profile.ownerBirthDate, '民族', profile.ownerEthnicity],
        ['婚姻状态', profile.maritalStatus, '在网时长 ≥ 5 年', profile.mobileMonthsOnline >= 60 ? '是' : '否'],
      ],
    ),
  );

  out.push(h2('2.2', '通讯与生活稳定性', 'SP-A01'));
  out.push(dataSource('手机号在网时长 + 手机近三个月话费 + 通话时长 + 近 6 月欠费停机次数 + 常住地核验'));
  out.push(
    kv([
      { k: '手机号在网时长', v: `${profile.mobileMonthsOnline} 个月（${profile.mobileMonthsOnline >= 60 ? '> 5 年=可信' : '< 5 年'}）` },
      { k: '运营商', v: profile.mobileCarrier },
      { k: '近三月话费', v: `${profile.mobile3mAvgFee}（${profile.mobile3mFeeTrend}）` },
      { k: '话费波动', v: profile.mobile3mFeeVolatility },
      { k: '近 6 月停机次数', v: `${profile.mobile6mShutdownCount} 次` },
      { k: '月均通话时长', v: `${profile.mobileCallMinutes} 分钟` },
      { k: '活跃通话联系人', v: `近 30 天 ≥ 3 次：${profile.mobileFrequentContacts} 人` },
      { k: '常住地核验', v: profile.mobileResidenceMatch },
      { k: 'IMEI 稳定性', v: profile.imeiStability },
    ]),
  );

  out.push(h3('2.2.1', '手机行为评分'));
  out.push(
    p(
      `基于在网时长（${profile.mobileMonthsOnline} 月${profile.mobileMonthsOnline >= 60 ? ' > 5 年=可信' : ''}）、话费稳定性（波动 ${profile.mobile3mFeeVolatility}）、通话活跃度（${profile.mobileCallMinutes} 分钟/月）、欠费记录（${profile.mobile6mShutdownCount} 次短期）综合评估。手机行为评分反映经营者生活稳定性${profile.mobile6mShutdownCount > 0 ? '，但近期话费波动需在贷后高频复查' : ''}。`,
    ),
  );

  out.push(h2('2.3', '婚姻与家庭情况', 'SP-A01'));
  out.push(dataSource('婚姻核验'));
  out.push(
    kv([
      { k: '婚姻状态', v: profile.maritalStatus },
      { k: '配偶', v: profile.spouseName !== '—' ? `${profile.spouseName}，${profile.spouseAge} 岁` : '—' },
      { k: '婚姻登记日期', v: profile.marriageDate },
      { k: '家庭子女', v: profile.childrenInfo },
      { k: '家庭关系稳定性', v: profile.familyStability },
      { k: '婚姻纠纷记录', v: profile.marriageDispute },
    ]),
  );

  out.push(h2('2.4', '教育与职业背景', 'SP-A01'));
  out.push(dataSource('学历信息核验 + 学位信息核验（辅助参考）'));
  out.push(
    kv([
      { k: '最高学历', v: profile.highestEducation },
      { k: '毕业院校', v: profile.graduateSchool },
      { k: '毕业时间', v: profile.graduateDate },
      { k: '职业经历', v: profile.professionalHistory },
      { k: '行业从业年限', v: `${profile.yearsInIndustry} 年（${profile.industry}）` },
    ]),
  );

  out.push(h2('2.5', '经营者综合画像', 'SP-A01'));
  out.push(...agentBlock('SP-2.5-owner-portrait', customer.id));

  out.push(h2('2.6', '关联企业网络', 'SP-A01'));
  out.push(dataSource('个人工商接口 - 查询经营者名下所有企业、持股、任职情况'));
  out.push(
    dt(
      ['关联企业名称', '角色', '持股/出资', '经营状态', '成立日期', '异常情况'],
      [[customer.shopName, '经营者', '100%', '存续', customer.createdAt.split(' ')[0], '无']],
    ),
  );
  out.push(p('经营者名下仅 1 家个体户（即本店），无其他关联企业。配偶名下无在营企业。关联网络简单，无复杂关联风险。'));

  // ═══ 第三部分 SP-A02 ═══
  out.push(h1('第三部分　店铺与经营情况'));
  out.push(p('整章主责：SP-A02 店铺经营 Agent。'));

  out.push(h2('3.1', '店铺工商登记信息', 'SP-A02'));
  out.push(dataSource('工商信息综合查询（大工商）+ 企业工商基本信息 + 企业四要素核验'));
  out.push(
    dt(
      ['项', '内容', '项', '内容'],
      [
        ['字号名称', customer.shopName, '登记机关', profile.shopRegistrationAuthority],
        ['统一社会信用代码', customer.unifiedSocialCreditCode, '注册日期', customer.createdAt.split(' ')[0]],
        ['经营者', customer.ownerName, '登记状态', '存续（在营）'],
        ['经营范围', profile.shopBusinessScope, '主要经营商品', profile.shopMainProducts],
        ['经营场所类型', profile.shopVenueType, '所属行业', customer.industry],
        ['行政区划', customer.region, '近三年是否变更', profile.shopHistoryChanges.length > 0 ? `是（${profile.shopHistoryChanges.length} 次）` : '否'],
      ],
    ),
  );

  out.push(h3('3.1.1', '历史工商变更'));
  out.push(
    dt(
      ['变更日期', '变更项', '变更前', '变更后'],
      profile.shopHistoryChanges.length > 0
        ? profile.shopHistoryChanges.map((c) => [c.date, c.item, c.before, c.after])
        : [['—', '近三年无变更', '—', '—']],
    ),
  );

  out.push(h2('3.2', '经营场所核验', 'SP-A02'));
  out.push(dataSource('地址核验 + 常住地核验 + 企业用电数据标签（若有门面用电）'));
  out.push(
    kv([
      { k: '注册经营地址', v: profile.shopAddress },
      { k: '现场核验', v: profile.shopVerification },
      { k: '经营场所类型', v: profile.shopVenueType + (profile.shopRentTerm !== '—' ? `（${profile.shopRentTerm}）` : '') },
      { k: '月租金', v: profile.shopMonthlyRent },
      { k: '周边业态', v: profile.shopSurroundings },
      { k: '地址异常记录', v: '无' },
    ]),
  );

  out.push(h3('3.2.1', '经营真实性综合判断', 'SP-A02'));
  out.push(...agentBlock('SP-3.2.1-authenticity', customer.id));

  out.push(h2('3.3', '行业经营数据（烟草零售户）', 'SP-A02'));
  out.push(dataSource('烟草数据查询（API）+ 烟草商户经营标签查询 | 烟草零售户适用'));
  if (isYancao) {
    out.push(
      kv([
        { k: '烟草许可证编号', v: '450103-XXXX' },
        { k: '许可证有效期', v: '至 2027-12' },
        { k: '月均订烟金额', v: '12,400 元' },
        { k: '烟草信用等级', v: 'B 级' },
        { k: '违规记录', v: '无' },
        { k: '月均订烟次数', v: '4 次' },
        { k: '近 12 月趋势', v: '稳定（同比 +3.2%）' },
        { k: '烟草扣分情况', v: '0 分' },
      ]),
    );
    out.push(...chartPlaceholder('折线图', '近 12 月烟草订单趋势图', '月均订烟 12,400 元，标准差 1,500 元，无异常波动'));
  } else {
    out.push(p(`本字号经营范围为「${customer.shopType}」，非烟草零售户，不适用烟草数据接口。SP-A02 在 D 阶段读取经营范围字段后未触发烟草链路调用。`));
  }

  out.push(h2('3.4', '行业经营数据（电商个体户）', 'SP-A02'));
  out.push(dataSource('电商数据查询 + 电商白名单标准筛选 | 适用于电商或线上销售为主的个体户'));
  if (isEcom) {
    out.push(
      kv([
        { k: '电商平台', v: '淘宝 / 拼多多' },
        { k: '店铺等级', v: '4.6 星' },
        { k: '月均订单量', v: '620 单' },
        { k: '月均销售额', v: '4.2 万元' },
        { k: '客单价', v: '67.7 元' },
        { k: '好评率', v: '94.5%' },
        { k: '投诉率', v: '0.8%' },
      ]),
    );
  } else {
    out.push(
      kv([
        { k: '是否电商个体', v: `否（${customer.shopType}）` },
        { k: '辅助参考平台', v: '美团外卖 + 饿了么' },
        { k: '月均订单量', v: '620 单' },
        { k: '月均销售额', v: '4.2 万元' },
        { k: '店铺评分', v: '4.6 星' },
        { k: '好评率', v: '94.5%' },
        { k: '复购率', v: '32%' },
        { k: '投诉率', v: '0.8%' },
      ]),
    );
  }

  out.push(h2('3.5', '经营活跃度信号', 'SP-A02'));
  out.push(p('综合多个数据源，从侧面验证经营活跃程度。'));
  out.push(
    dt(
      ['活跃信号', '数据来源', '本次表现', '评价'],
      [
        ['用电活跃度', '门面用电数据', '月均 1,800 度，稳定', '正常活跃'],
        ['外卖订单量', '美团 / 饿了么', '月均 620 单', '稳定'],
        ['银行卡交易', '银行卡特征', '月均交易 45 笔', '正常'],
        ['手机活跃位置', '通讯运营商', '常住地稳定', '一致'],
        ['节假日波动', '历史数据', '春节峰值 +45%', '行业典型'],
      ],
    ),
  );

  out.push(h3('3.5.1', '经营情况综合分析', 'SP-A02'));
  out.push(...agentBlock('SP-3.5.1-shop-analysis', customer.id));

  // ═══ 第四部分 SP-A03 ═══
  out.push(h1('第四部分　经济能力与还款来源'));
  out.push(p('个体户没有规范的财务报表。整章主责：SP-A03 经济能力 Agent。'));

  out.push(h2('4.1', '收入水平评估', 'SP-A03'));
  out.push(dataSource('经济能力预测评分 A（收入区间）+ 经济能力预测评分 B（消费能力）+ 个税（经营所得）'));
  out.push(
    kv([
      { k: '月均经营收入', v: profile.monthlyIncomeEstimate },
      { k: '月均生活/经营开支', v: profile.monthlyExpenseEstimate },
      { k: '月可支配', v: profile.monthlyDisposableEstimate },
      { k: '本次月还款', v: profile.thisMonthlyPayment },
      { k: '还款覆盖率', v: profile.paymentCoverage },
      { k: '建议授信上限', v: profile.recommendedCreditLimit },
    ]),
  );

  out.push(h2('4.2', '银行卡交易特征', 'SP-A03'));
  out.push(dataSource('银行卡特征及评分（交易金额/消费行业）| 需经营者授权'));
  out.push(
    kv([
      { k: '近 12 月银行卡交易总额', v: profile.bankCard12mTotal },
      { k: '月均交易笔数', v: profile.bankCardMonthlyTxCount },
      { k: '交易对手数', v: profile.bankCardCounterpartiesCount },
      { k: '夜间/凌晨交易', v: profile.bankCardNightTransactionRatio },
      { k: '餐饮行业占比（消费）', v: profile.bankCardCateringMerchantRatio },
      { k: '可疑交易识别', v: profile.bankCardSuspiciousTransaction },
      { k: '银行卡风险评分', v: profile.bankCardRiskScore },
    ]),
  );
  out.push(
    ...chartPlaceholder(
      '柱状图',
      '近 12 月银行卡月度流水走势',
      `累计 ${profile.bankCard12mTotal}，月均交易 ${profile.bankCardMonthlyTxCount}，符合行业经营周期`,
    ),
  );

  out.push(h2('4.3', '不动产资产', 'SP-A03'));
  out.push(dataSource('不动产接口 | 需经营者授权'));
  out.push(
    dt(
      ['权证号(脱敏)', '房屋用途', '面积', '所在地', '查封状态', '抵押状态'],
      profile.realEstate.length > 0
        ? profile.realEstate.map((e) => [e.certNumber, e.usage, e.area, e.location, e.sealStatus, e.mortgageStatus])
        : [['—', '—', '—', '—', '名下无登记不动产', '—']],
    ),
  );
  out.push(
    p(
      profile.realEstate.length > 0
        ? `资产评估：${profile.realEstate.every((e) => e.sealStatus === '未查封' && e.mortgageStatus === '未抵押') ? '有房未查封未抵押 = 强还款保障' : '资产存在限制，需关注'}。第三方估值约 ${profile.realEstateValuation}。`
        : '名下无登记不动产，建议结合其他资产维度评估还款保障。',
    ),
  );

  out.push(h2('4.4', '车辆资产', 'SP-A03'));
  out.push(dataSource('名下车辆统计 + 车辆估值'));
  out.push(
    dt(
      ['车牌(脱敏)', '品牌型号', '购置时间', '估值(万)', '用途'],
      profile.vehicles.length > 0
        ? profile.vehicles.map((v) => [v.plate, v.model, v.purchaseDate, v.valuation, v.usage])
        : [['—', '—', '—', '—', '名下无登记车辆']],
    ),
  );

  out.push(h2('4.5', '还款能力测算', 'SP-A03'));
  out.push(dataSource('还款能力测评（综合评分）'));
  out.push(
    kv([
      { k: '还款能力评分（归一化）', v: '72 / 100' },
      { k: '还款能力评级', v: 'B（良好）' },
    ]),
  );
  out.push(...agentBlock('SP-4.5-repayment', customer.id));
  out.push(
    kv([
      { k: '估算月收入', v: profile.monthlyIncomeEstimate },
      { k: '估算月支出', v: profile.monthlyExpenseEstimate },
      { k: '月可支配', v: profile.monthlyDisposableEstimate },
      { k: '本次月还款', v: profile.thisMonthlyPayment },
      { k: '还款覆盖率', v: profile.paymentCoverage },
      { k: '建议授信上限', v: profile.recommendedCreditLimit },
      { k: '本次申请金额', v: `${customer.appliedAmount} 万元` },
    ]),
  );

  // ═══ 第五部分 SP-A05 ═══
  out.push(h1('第五部分　个人信用与多头借贷'));
  out.push(p('整章主责：SP-A05 个人信用 Agent。'));

  out.push(h2('5.1', '信用预测评分', 'SP-A05'));
  out.push(dataSource('信用预测评分 A'));
  out.push(
    kv([
      { k: '信用总分（200-800）', v: '720 分' },
      { k: '等级', v: 'A 类' },
      { k: '评分模型版本', v: '正菱信用 v3.2' },
    ]),
  );

  out.push(h2('5.2', '信贷行为指数', 'SP-A05'));
  out.push(dataSource('逾选指数 + 贷选指数 + 信选指数 + 借选指数'));
  out.push(
    dt(
      ['指数名称', '用途', '本次值', '评价'],
      [
        ['逾选指数', '近 36 月逾期记录', '0', '优'],
        ['贷选指数', '近 12 月贷款活跃度', '低', '正常'],
        ['信选指数', '近 6 月信用查询', '3 次', '正常'],
        ['借选指数', '近 6 月借贷意向', '2 次', '关注'],
      ],
    ),
  );

  out.push(h2('5.3', '多头借贷分析（细分版）', 'SP-A05'));
  out.push(dataSource('借贷意向验证细分版 - 近 2/3/6/12/18/24 月 银行/非银分别申请次数和机构数'));

  out.push(h3('5.3.1', '银行类申请'));
  out.push(
    dt(
      ['时间窗口', '申请次数', '申请机构数', '评价'],
      [
        ['近 2 月', '0', '0', '正常'],
        ['近 3 月', '1', '1', '正常'],
        ['近 6 月', '1', '1', '正常'],
        ['近 12 月', '2', '2', '正常'],
        ['近 18 月', '3', '2', '正常'],
      ],
    ),
  );

  out.push(h3('5.3.2', '非银类申请（消金 / 小贷 / 网贷）'));
  out.push(
    dt(
      ['时间窗口', '申请次数', '申请机构数', '评价'],
      [
        ['近 2 月', '0', '0', '正常'],
        ['近 3 月', '1', '1', '正常'],
        ['近 6 月', '2', '2', '关注'],
        ['近 12 月', '3', '3', '关注'],
        ['近 18 月', '3', '3', '关注'],
      ],
    ),
  );

  out.push(h3('5.3.3', '多头借贷综合评估'));
  out.push(p('评估规则：近 6 月 ≤ 2 家 → 100 分；3-5 家 → 60 分；> 5 家 → 0 分（拒绝）。'));
  out.push(p('本次：近 6 月 银行 1 家 + 非银 2 家 = 3 家，得分 60。关注非银多头——非银多头 > 3 家通常意味着资金链紧张或银行融资能力受限。已纳入贷后月度复查。'));

  out.push(h2('5.4', '还款能力综合评分', 'SP-A05'));
  out.push(dataSource('还款能力测评（综合评分）'));
  out.push(
    kv([
      { k: '还款能力综合评分', v: '72 / 100（归一化后）' },
      { k: '评分组成', v: '收入预测 30% + 银行卡 25% + 资产 25% + 多头扣分 20%' },
    ]),
  );

  // ═══ 第六部分 SP-A06 ═══
  out.push(h1('第六部分　四维信用评分明细'));
  out.push(p('SP-A06 四维评分 Agent。是 D 阶段后期 Agent，消费 SP-A01-A05 的产物，不重新调接口。'));

  const fourDims: Array<[string, string, Array<[string, string, string, string, string, string]>]> = [
    ['6.1', '维度一：经营者个人信用画像（35%）', [
      ['人行征信', '12%', '信用预测评分 A', '0 不良=100', '0 不良', '100'],
      ['手机在网时长', '8%', '手机在网时长', '≥ 5 年=100', '96 月', '100'],
      ['身份核验', '5%', '身份二要素 + 人脸', '通过=100', '通过', '100'],
      ['婚姻 / 家庭', '5%', '婚姻核验', '已婚=80 / 未婚=60', '已婚', '80'],
      ['学历 / 职业', '3%', '学历核验 + 经营年限', '从业 ≥ 10 年=80', '18 年', '80'],
      ['失信 / 限高', '2%', '个人综合涉诉 + 限高', '0=100', '0', '100'],
      ['维度合计', '35%', '—', '—', '—', String(v.personalCredit)],
    ]],
    ['6.2', '维度二：经济能力与资产（25%）', [
      ['月收入', '8%', '经济能力预测 A', '区间 02 = 80', '月 2-3 万', '80'],
      ['银行卡流水', '7%', '银行卡特征', '风险分 ≥ 80=100', '85', '85'],
      ['不动产', '5%', '不动产接口', '有 / 未抵押=100', '有 1 套未抵押', '100'],
      ['车辆', '3%', '名下车辆 + 估值', '有=80', '1 辆 / 8 万', '60'],
      ['多头扣分', '2%', '借贷意向（细分）', '近 6 月 3 家=60', '3 家', '60'],
      ['维度合计', '25%', '—', '—', '—', String(v.economicCapacity)],
    ]],
    ['6.3', '维度三：经营存续与真实性（25%）', [
      ['经营年限', '8%', '工商基本信息', '≥ 5 年=100', '8 年', '100'],
      ['经营场所核验', '5%', '地址核验', '一致=100', '一致', '100'],
      ['用电稳定性', '4%', '用电数据标签', '指数 ≥ 70=100', '76', '85'],
      ['行业数据', '4%', '电商数据 / 烟草', '活跃=80', '月销 4.2 万', '80'],
      ['工商变更频率', '2%', '工商变更', '近 3 年 ≤ 1=100', '1 次', '90'],
      ['手机活跃度', '2%', '手机活跃位置', '稳定=80', '稳定', '80'],
      ['维度合计', '25%', '—', '—', '—', String(v.operationAuthenticity)],
    ]],
    ['6.4', '维度四：合规与社会稳定性（15%）', [
      ['个人涉诉', '5%', '个人综合涉诉', '0=100', '0', '100'],
      ['行政处罚', '3%', '企业行政处罚', '0=100', '0', '100'],
      ['限高 / 失信', '3%', '限高 + 失信', '0=100', '0', '100'],
      ['银行卡涉赌涉诈', '2%', '银行卡涉赌涉诈', '未命中=100', '未命中', '100'],
      ['多头查询', '1%', '借贷意向', '关注=60', '关注', '60'],
      ['不良行为记录', '1%', '不良行为', '0=100', '0', '100'],
      ['维度合计', '15%', '—', '—', '—', String(v.socialStability)],
    ]],
  ];
  for (const [num, title, rows] of fourDims) {
    out.push(h2(num, title, 'SP-A06'));
    out.push(dt(['子指标', '权重', '数据接口', '评分规则', '原始数据', '得分'], rows.map((r) => [...r])));
  }

  // ═══ 第七部分 SP-A04 ═══
  out.push(h1('第七部分　反欺诈与一票否决检查'));
  out.push(p('整章主责：SP-A04 反欺诈流水线 Agent（个体户特有 Agent，零接口，复用 SE-01 数据池快照）。'));

  out.push(h2('7.1', '五步反欺诈流水线', 'SP-A04'));
  out.push(p('反欺诈核心认知：任一步骤未通过，直接拒绝授信。'));
  out.push(
    dt(
      ['步骤', '调用接口', '输入要素', '通过条件', '本次结果'],
      [
        ['步骤一：身份二要素核验', '身份二要素 + 人脸', '姓名 / 身份证 / 人脸', '一致 + 活体', '✓ 通过'],
        ['步骤二：手机三要素核验', '手机三要素', '姓名 / 身份证 / 手机号', '三要素一致', '✓ 通过'],
        ['步骤三：工商信息核验', '企业四要素', '字号 / 信用代码 / 经营者 / 地址', '四要素一致', '✓ 通过'],
        ['步骤四：欺诈名单过滤', '欺诈名单 + 风险手机号', '姓名 / 身份证 / 手机', '未命中', '✓ 通过'],
        ['步骤五：多头预警核查', '借贷意向（细分版）', '近 6 月银行/非银多头', '≤ 2 家=优秀', '关注（3 家）→ 通过'],
      ],
    ),
  );

  out.push(h2('7.2', '一票否决项详细核查', 'SP-A04'));
  out.push(
    dt(
      ['否决项类别', '数据来源接口', '核查内容', '本次结果'],
      report.oneVoteVeto.map((it) => [
        it.item,
        it.apiSource,
        it.triggered ? '已触发否决流程' : '数据核验通过，无异常',
        it.triggered ? '✗ 触发' : '✓ 通过',
      ]),
    ),
  );

  out.push(h2('7.3', '反欺诈综合分析', 'SP-A04'));
  out.push(...agentBlock('SP-7.3-anti-fraud', customer.id));

  // ═══ 第八部分 SP-A07 ═══
  out.push(h1('第八部分　风险评估与缓释'));
  out.push(p('整章主责：SP-A07 风险地图 Agent（注意比法人多了"失联风险"类别）。'));

  out.push(h2('8.1', '风险地图总览', 'SP-A07'));
  out.push(...agentBlock('SP-8.1-risk-map', customer.id));
  out.push(...chartPlaceholder('矩阵图', '风险地图矩阵', 'X 轴：发生可能性，Y 轴：影响严重性，2 项识别风险点已标注象限位置'));

  out.push(h2('8.2', '经营风险与缓释', 'SP-A07'));
  out.push(
    dt(
      ['风险点', '风险描述', '可能性', '严重性', '缓释措施'],
      [
        ['客流季节性', '春节后 2-3 月低谷', '中', '低', '现金储备 + 节后促销'],
        ['食品安全', '行政许可风险', '低', '中', '定期资质复查'],
        ['物业租约', '2028 年到期', '低', '低', '提前续约谈判'],
        ['行业竞争', '周边新增竞品', '低', '低', '差异化菜品 + 老客回访'],
      ],
    ),
  );

  out.push(h2('8.3', '经营者个人风险与缓释', 'SP-A07'));
  out.push(
    dt(
      ['风险点', '风险描述', '可能性', '严重性', '缓释措施'],
      [
        ['健康风险', '经营者夫妇 40+', '中', '中', '建议补充健康险 / 备案家庭代偿人'],
        ['婚姻风险', '已婚稳定', '低', '高', '配偶共同签字'],
        ['法律风险', '无涉诉', '低', '低', '常规跟踪'],
        ['关联风险', '名下仅 1 家个体户', '低', '低', '无需特别处置'],
      ],
    ),
  );

  out.push(h2('8.4', '财务/还款风险与缓释', 'SP-A07'));
  out.push(
    dt(
      ['风险点', '风险描述', '可能性', '严重性', '缓释措施'],
      [
        ['月收入波动', '餐饮季节性', '中', '中', '月还款 ≤ 收入 35% 阈值'],
        ['多头借贷增加', '非银 2 家关注', '中', '中', '月度复查多头变化'],
        ['银行卡风险', '低', '低', '低', '常规'],
        ['资产变现', '住宅一套', '低', '低', '作为二次保障'],
      ],
    ),
  );

  out.push(h2('8.5', '失联风险与缓释', 'SP-A07'));
  out.push(p('失联是个体户最大的贷后风险，本节单独梳理。'));
  out.push(
    dt(
      ['风险点', '风险描述', '可能性', '严重性', '缓释措施'],
      [
        ['手机停机', '近 6 月 1 次短停', '中', '高', '月频空号检测'],
        ['话费骤降', '波动 35%', '中', '中', '每周话费监控'],
        ['配偶联系', '已登记', '低', '高', '紧急联系人备案'],
        ['店铺位置失联', '租赁铺面', '低', '高', '季度实地走访'],
        ['银行卡停用', '无', '低', '高', '银行卡状态月查'],
      ],
    ),
  );

  // ═══ 第九部分 SP-A09 ═══
  out.push(h1('第九部分　贷后管理方案'));
  out.push(p('个体户贷后核心是"防失联+防多头爆增+防经营异常"。整章主责：SP-A09 失联监控配置 Agent（个体户特有 Agent）。'));

  out.push(h2('9.1', '贷后监控核心认知'));
  out.push(p('个体户风控核心：35 万户量级批量授信，最大风险不是违约而是欺诈；贷后最大风险不是经营恶化而是失联。所以贷前重反欺诈，贷后重手机状态和多头监控。'));

  out.push(h2('9.2', '贷中行为监控清单', 'SP-A09'));
  out.push(
    dt(
      ['监控项', '数据接口', '频率', '黄灯条件', '红灯条件'],
      [
        ['手机空号 / 停机', '手机空号检测', '月频', '欠费停机 1 次', '空号 / 注销'],
        ['多头借贷', '借贷意向（细分）', '月频', '新增 1 家', '新增 ≥ 3 家'],
        ['经营用电', '用电数据标签', '月频', '环比 -30%', '连续 3 月归零'],
        ['银行卡交易', '银行卡特征', '月频', '环比 -30%', '环比 -50%'],
        ['工商变更', '工商变更', '实时', '经营范围变更', '注销 / 吊销'],
        ['司法涉诉', '个人综合涉诉', '实时', '新增立案', '新增失信'],
        ['负面舆情', '舆情扫描', '月频', '负面提及 ≥ 3', '严重负面'],
        ['本笔逾期提醒', '本行台账', '日频', '逾期 1 日', '逾期 ≥ 7 日'],
      ],
    ),
  );

  out.push(h2('9.3', '贷后分级预警', 'SP-A09'));
  out.push(
    dt(
      ['预警级别', '触发条件', '响应时限', '处置措施'],
      [
        ['红（严重）', '手机空号 / 停机 / 店铺注销 / 新增失信', '24h', '24h 内启动处置流程'],
        ['黄（关注）', '多头超 3 家 / 流水下降 30%', '3 日', '客户经理 3 日内回访'],
        ['蓝（提示）', '话费波动 / 工商变更', '月频', '月度跟踪'],
        ['绿（正常）', '常态', '—', '常规跟踪'],
      ],
    ),
  );

  out.push(h2('9.4', '授权管理说明', 'SP-A09'));
  out.push(p('个体户场景下大量数据涉及个人信息，授权管理尤为关键。'));
  out.push(
    dt(
      ['授权类别', '数据范围', '授权方式', '授权有效期'],
      [
        ['个人身份授权', '身份核验 / 人脸 / 户籍', 'H5 实人核身 + 电子签约', '授信存续期'],
        ['通讯数据授权', '手机在网 / 话费 / 通话', '电子签约', '授信存续期'],
        ['资产数据授权', '银行卡 / 不动产 / 车辆', '电子签约', '授信存续期'],
        ['个人信用授权', '征信 / 涉诉 / 限高', '电子签约', '授信存续期'],
        ['字号数据授权', '工商 / 用电 / 行业（烟草/电商）', '电子签约（含字号）', '授信存续期'],
      ],
    ),
  );

  // ═══ 调查结论与签字 ═══
  out.push(h1('调查结论与签字'));
  out.push(
    p(
      `综合上述经营者画像、店铺经营、经济能力、个人信用、反欺诈检查等多维度分析，以及四维信用评分（综合得分 ${totalScore} 分，信用等级 ${grade} 级）、一票否决项检查（${vetoHit.length === 0 ? '全部通过' : `触发 ${vetoHit.length} 项`}）、反欺诈五步流水线检查（全部通过），本次调查的最终结论为：`,
    ),
  );
  out.push(
    p(
      `${
        report.recommendation
          ? `${report.recommendation.decision} ${report.recommendation.amount} 万元，期限 ${report.recommendation.term} 个月，利率 ${report.recommendation.rate}，担保方式 ${report.recommendation.guarantee}。`
          : ''
      }核心风险已通过结构性条款（手机状态高频监控、多头变化月度复查）覆盖。建议按"批量授信 + 自动化监控"标准产品流程处理。`,
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

  // ═══ 附录 A-F ═══
  out.push(h1('附录'));

  out.push(h2('附录 A', '数据接口清单与字段说明'));
  out.push(p('本报告引用的所有数据接口及关键字段如下，数据均来自正菱（珠海）数据服务有限公司 API 平台。本次共调用 86 个接口。'));

  out.push(h3('A.1', '身份与反欺诈核验'));
  out.push(
    dt(
      ['接口名称', '用途章节', '调用频次', '授权要求'],
      [
        ['身份二要素核验', '2.1 / 7.1', '一次性', '需经营者授权'],
        ['身份证三要素', '2.1', '一次性', '需经营者授权'],
        ['人脸识别 / 实人校验', '2.1', '一次性', '需经营者授权'],
        ['手机三要素核验', '7.1', '一次性', '需经营者授权'],
        ['企业四要素核验', '3.1 / 7.1', '一次性', '无'],
        ['风险手机号列表', '1.3 / 7.1', '实时', '无'],
        ['银行卡涉赌涉诈查询', '1.3 / 7.1', '实时', '无'],
        ['银行卡黑名单核验', '1.3 / 7.1', '实时', '无'],
        ['欺诈名单 / 检测羊毛党', '7.1 / 7.2', '实时', '无'],
      ],
    ),
  );

  out.push(h3('A.2', '个人信用与多头'));
  out.push(
    dt(
      ['接口名称', '用途章节', '调用频次', '授权要求'],
      [
        ['信用预测评分 A', '5.1', '一次性', '需经营者授权'],
        ['逾选 / 贷选 / 信选 / 借选指数', '5.2', '一次性', '需经营者授权'],
        ['借贷意向验证细分版', '5.3 / 7.1', '一次性 + 月频', '需经营者授权'],
        ['还款能力测评（综合评分）', '4.5 / 5.4', '一次性', '需经营者授权'],
        ['个人综合涉诉', '1.3 / 8.3', '一次性', '无'],
        ['限制高消费', '1.3 / 8.3', '实时', '无'],
        ['不良行为查询', '1.3 / 6.4', '一次性', '无'],
      ],
    ),
  );

  out.push(h3('A.3', '经济能力与资产'));
  out.push(
    dt(
      ['接口名称', '用途章节', '调用频次', '授权要求'],
      [
        ['经济能力预测评分 A（收入区间）', '4.1', '一次性', '需经营者授权'],
        ['经济能力预测评分 B（消费）', '4.1', '一次性', '需经营者授权'],
        ['银行卡特征及评分', '4.2', '一次性', '需经营者授权'],
        ['不动产接口', '4.3', '一次性', '需经营者授权'],
        ['名下车辆统计', '4.4', '一次性', '无'],
        ['车辆估值', '4.4', '一次性', '无'],
      ],
    ),
  );

  out.push(h3('A.4', '店铺与行业经营'));
  out.push(
    dt(
      ['接口名称', '用途章节', '调用频次', '授权要求'],
      [
        ['工商信息综合查询（大工商）', '3.1', '一次性', '无'],
        ['企业工商基本信息', '3.1', '一次性', '无'],
        ['企业用电数据标签', '3.5 / 9.2', '月频', '需字号授权'],
        ['烟草数据查询（API）', '3.3', '一次性', '需字号授权（仅烟草）'],
        ['烟草商户经营标签查询', '3.3', '一次性', '需字号授权（仅烟草）'],
        ['电商数据查询', '3.4', '一次性', '需字号授权（仅电商）'],
        ['电商白名单标准筛选', '3.4', '一次性', '需字号授权（仅电商）'],
        ['手机活跃位置 / 常住地核验', '2.2', '一次性', '需经营者授权'],
      ],
    ),
  );

  out.push(h3('A.5', '合规与社会稳定性'));
  out.push(
    dt(
      ['接口名称', '用途章节', '调用频次', '授权要求'],
      [
        ['婚姻核验', '2.3', '一次性', '需经营者授权'],
        ['学历信息核验', '2.4', '一次性', '需经营者授权'],
        ['企业行政处罚', '6.4 / 8.3', '一次性', '无'],
        ['个税（经营所得）', '4.1', '一次性', '需经营者授权'],
        ['个人工商接口（关联企业）', '2.6', '一次性', '无'],
      ],
    ),
  );

  out.push(h2('附录 B', '评分算法详解'));
  out.push(h3('B.1', '评分计算公式'));
  out.push(p('综合得分 = Σ(维度得分 × 维度权重)；维度得分 = Σ(子指标得分 × 子指标权重)；子指标得分 = 评分规则(原始数据) → [0, 100]。'));
  out.push(h3('B.2', '四维权重设计依据'));
  out.push(p('个体户"人即企业"，个人信用是核心：① 经营者个人信用画像 35%——个人信用是个体户授信最直接的依据；② 经济能力与资产 25%——替代企业财务报表；③ 经营存续与真实性 25%——验证"店是不是真的在开"；④ 合规与社会稳定性 15%——判断社会风险与违约意愿。'));
  out.push(h3('B.3', '阈值设定原则'));
  out.push(p('各子指标阈值（如近 6 月多头 > 5 家=拒绝、手机在网 > 5 年=可信）的设定依据，基于行业基准、监管要求、历史样本回测。'));
  out.push(h3('B.4', '一票否决规则'));
  out.push(p('共 10 项一票否决：身份核验、手机风险、银行卡涉赌涉诈、银行卡黑名单、个人失信、限制高消费、店铺严重违法、店铺疑似空壳、不良行为、羊毛党/欺诈嫌疑。法规依据：《征信业务管理办法》《个人信息保护法》。'));

  out.push(h2('附录 C', '原始数据快照（脱敏）'));
  out.push(p(`本报告所有评分结果均可追溯到原始数据快照。完整脱敏数据快照存储于客户银行私有存储，数据时点 ${report.generatedAt ?? customer.updatedAt}，可应银保监及内部审计核查。`));
  out.push(
    dt(
      ['数据类别', '记录数', '数据时点', '存储位置'],
      [
        ['身份与反欺诈', '9 项', customer.updatedAt, 'snap_20260429_103'],
        ['个人信用与多头', '7 项', customer.updatedAt, '同上'],
        ['经济能力与资产', '6 项', customer.updatedAt, '同上'],
        ['店铺与行业', '8 项', customer.updatedAt, '同上'],
        ['合规与社会稳定', '5 项', customer.updatedAt, '同上'],
        ['通讯活跃度', '9 项', customer.updatedAt, '同上'],
        ['本次签约日志', '1 套', customer.updatedAt, '同上'],
      ],
    ),
  );

  out.push(h2('附录 D', '数据合规授权链条'));
  out.push(h3('D.1', '数据源合规授权'));
  out.push(p('正菱（珠海）数据服务有限公司作为本报告核心数据源，具备相应的数据要素流通资质和合规能力。'));
  out.push(h3('D.2', '经营者个人授权'));
  out.push(p(`经营者 ${customer.ownerName} 于 ${customer.createdAt} 通过 H5 实名认证 + 人脸识别 + 电子签约方式，签署《个人信息处理同意书》及《数据使用授权书》。授权范围：本次授信申请的尽职调查及授信存续期内的贷后监控。撤回机制：经营者可随时通过原签约渠道申请撤回授权。`));
  out.push(h3('D.3', '字号（店铺）数据授权'));
  out.push(p('个体工商户字号项下的工商、税务、用电、行业数据等，因经营者本人即字号实际经营人，经营者签署的授权书同时覆盖字号相关数据。'));
  out.push(h3('D.4', '数据使用边界'));
  out.push(
    dt(
      ['使用方', '使用目的', '数据范围', '保留期限'],
      [
        ['客户银行授信审批', '本次授信审批', '完整脱敏快照', '授信存续期 + 5 年'],
        ['客户银行风控', '贷后监控（失联/多头）', '事件驱动 + 月度复核', '授信存续期'],
        ['监管报送', '银保监 / 央行', '聚合统计', '按监管要求'],
        ['内部审计', '合规审查', '快照查询权限', '存续期 + 10 年'],
      ],
    ),
  );

  out.push(h2('附录 E', '模型版本说明'));
  out.push(
    dt(
      ['项目', '内容'],
      [
        ['模型名称', '金智维个体工商户四维信用评分模型'],
        ['模型版本', 'v2.6.1'],
        ['模型上线时间', '2026-01-15'],
        ['本次评分时间', report.generatedAt ?? customer.updatedAt],
        ['训练样本数', '350,000+ 个体户样本'],
        ['回测准确率', 'KS 0.39 / AUC 0.78'],
        ['维度数', '4 维 / 22 个子指标'],
        ['一票否决项数', '10 项'],
        ['模型监管备案', '已备案'],
        ['人在环节点', '3 个'],
      ],
    ),
  );

  out.push(h2('附录 F', '术语表'));
  out.push(
    dt(
      ['术语', '解释'],
      [
        ['SDAFI', 'Sense-Decide-Act-Feedback-Improve 五阶段闭环框架'],
        ['Agent 数据池', 'SE-01 在 Sense 阶段冻结的不可变快照'],
        ['一票否决', '监管或银行内部规定下任一命中即直接拒绝的核查项'],
        ['五步反欺诈', '身份核验 → 手机核验 → 工商核验 → 欺诈名单 → 多头预警'],
        ['四维评分', '个人信用 35 / 经济能力 25 / 经营存续 25 / 合规社会 15'],
        ['失联监控', '个体户特有的贷后监控核心：手机状态 + 字号注销 + 联系人变更'],
        ['多头借贷', '近 N 月在多个金融机构的查询/申请记录'],
        ['人在环', 'Human-in-the-loop，三个强制人审批节点'],
        ['cycle_id', 'SDAFI 五张审计表的统一关联键'],
        ['snapshot_id', '数据池快照唯一标识'],
        ['SR-XXXX', '个体户尽调报告编号前缀'],
        ['字号 vs 经营者', '工商登记主体 vs 实际经营自然人，个体户两者强绑定'],
      ],
    ),
  );

  // ═══ 结语 ═══
  out.push(hr());
  out.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
      children: [new TextRun({ text: '— 本报告至此结束 —', font: FONT, size: 18, color: C.muted })],
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
