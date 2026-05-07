'use client';

/**
 * 打印版尽调报告
 * - 法人小微：10 章 + 7 附录 + 93 张表（基于 法人小微企业_授信尽调报告_空模板.docx）
 * - 个体工商户：9 章 + 6 附录 + 62 张表（基于 个体工商户_授信尽调报告_空模板.docx）
 *
 * 每个章节标主责 Agent；每个 Agent 生成区按 Agent 对应矩阵.docx 标注主责 Agent + 输入 + 输出。
 */

import { useEffect } from 'react';

import type { Customer, DueDiligenceReport } from '@/data/types';

import { LeChapters } from './le-chapters';
import { SpChapters } from './sp-chapters';
import { PageBreak } from './shared';

interface PrintReportProps {
  customer: Customer;
  report: DueDiligenceReport;
}

export function PrintReport({ customer, report }: PrintReportProps) {
  useEffect(() => {
    document.title = `${report.reportNumber}_${customer.name}`;
  }, [report.reportNumber, customer.name]);

  const isLE = customer.type === 'legal-entity';

  return (
    <div className="print-wrapper">
      {/* ═══ 封面 ═══ */}
      <div className="print-cover">
        <div className="print-cover-title">
          {isLE ? '法人小微企业' : '个体工商户'}
          <br />授信尽职调查报告
        </div>
        <div className="print-cover-number">{report.reportNumber}</div>
        <div className="print-cover-spacer" />

        {/* 封面表 1：报告基础信息 */}
        <table className="print-cover-info">
          <tbody>
            <tr><td>报告编号</td><td>{report.reportNumber}</td></tr>
            <tr><td>客户名称</td><td>{customer.name}</td></tr>
            <tr><td>统一社会信用代码</td><td>{customer.unifiedSocialCreditCode}</td></tr>
            <tr><td>客户类型</td><td>{isLE ? '法人小微企业' : '个体工商户'}</td></tr>
            {customer.type === 'legal-entity' ? (
              <>
                <tr><td>法定代表人</td><td>{customer.legalRepresentative}</td></tr>
                <tr><td>注册资本</td><td>{customer.registeredCapital} 万元</td></tr>
                <tr><td>注册日期</td><td>{customer.registeredAt}</td></tr>
              </>
            ) : (
              <>
                <tr><td>经营者</td><td>{customer.ownerName}</td></tr>
                <tr><td>字号名称</td><td>{customer.shopName}</td></tr>
                <tr><td>店铺类型</td><td>{customer.shopType}</td></tr>
              </>
            )}
            <tr><td>所属行业</td><td>{customer.industry}</td></tr>
            <tr><td>所在区域</td><td>{customer.region}</td></tr>
            <tr><td>申请金额</td><td>{customer.appliedAmount.toLocaleString('zh-CN')} 万元</td></tr>
            <tr><td>申请产品</td><td>{customer.appliedProduct}</td></tr>
            <tr><td>客户经理</td><td>{customer.manager}</td></tr>
            <tr><td>报告生成时间</td><td>{report.generatedAt ?? customer.updatedAt}</td></tr>
            <tr><td>报告方式</td><td>金智维 SDAFI v2.0 · {isLE ? '16' : '14'} 个 Agent 协同自动尽调 + 客户经理复核</td></tr>
          </tbody>
        </table>
        <div className="print-cover-footer">
          密级：机密 | 仅供内部授信审批使用
          <br />金智维 · 智慧信贷智能体平台 · KINGSWARE
        </div>
      </div>

      <PageBreak />

      {/* ═══ 保密声明 ═══ */}
      <section className="print-section">
        <h2 className="print-h2">保密声明</h2>
        <p className="print-body">
          本报告由金智维智慧信贷平台基于多源数据自动生成，内容包含
          {isLE ? '企业经营、财务、合规及关联方等敏感信息' : '经营者个人信息、店铺经营信息及关联信用信息'}
          。报告由客户银行委托生成，仅用于该笔授信申请的内部审批使用。
        </p>
        <p className="print-body">
          {isLE
            ? '未经客户银行书面授权，任何机构或个人不得以任何方式复制、传播、转发本报告全部或部分内容，亦不得用于本笔授信审批以外的任何用途。'
            : '个体工商户的信息特别敏感（经营者个人信息为主），本报告涉及的所有个人数据均已取得经营者本人的电子授权（授权方式：H5 实名 + 人脸识别 + 电子签约），授权链条详见附录 D。'}
        </p>
        <p className="print-body">
          本报告依据的数据来源均符合《数据安全法》《个人信息保护法》《征信业务管理办法》及相关法律法规要求。
        </p>
        <p className="print-body">
          本报告为决策辅助工具，不构成《征信业务管理办法》项下的征信报告。最终授信决策由客户银行授信审批人员独立做出。
        </p>
      </section>

      <PageBreak />

      {/* ═══ 目录 ═══ */}
      <section className="print-section">
        <h1 className="print-h1">目  录</h1>
        <div className="print-toc">
          {isLE ? <LeToc /> : <SpToc />}
        </div>
      </section>

      <PageBreak />

      {/* ═══ 章节内容 ═══ */}
      {customer.type === 'legal-entity' ? (
        <LeChapters customer={customer} report={report} />
      ) : (
        <SpChapters customer={customer} report={report} />
      )}
    </div>
  );
}

function LeToc() {
  return (
    <>
      <p className="print-toc-h">第一部分　报告摘要与授信意见</p>
      <p className="print-toc-i">1.1  五维综合评分摘要</p>
      <p className="print-toc-i">1.2  信用等级与授信建议</p>
      <p className="print-toc-i">1.3  一票否决项检查</p>
      <p className="print-toc-i">1.4  核心风险点提示</p>
      <p className="print-toc-i">1.5  授信结构性建议</p>

      <p className="print-toc-h" style={{ marginTop: 8 }}>第二部分　企业概况与历史沿革（LE-A01）</p>
      <p className="print-toc-i">2.1 工商登记基本信息　2.2 股权结构与穿透　2.3 企业历史沿革</p>
      <p className="print-toc-i">2.4 主营业务与商业模式　2.5 核心产品与服务　2.6 经营场所与产能</p>

      <p className="print-toc-h" style={{ marginTop: 8 }}>第三部分　实控人与管理团队（LE-A02）</p>
      <p className="print-toc-i">3.1 法定代表人画像　3.2 实际控制人识别　3.3 董监高履历　3.4 关联企业网络</p>

      <p className="print-toc-h" style={{ marginTop: 8 }}>第四部分　行业与经营分析（LE-A03）</p>
      <p className="print-toc-i">4.1 行业概况与景气度　4.2 行业政策环境　4.3 竞争格局</p>
      <p className="print-toc-i">4.4 上下游产业链　4.5 经营波动性　4.6 SWOT 分析</p>

      <p className="print-toc-h" style={{ marginTop: 8 }}>第五部分　财务深度分析（LE-A04）</p>
      <p className="print-toc-i">5.1 财务报表概览　5.2 资产负债结构　5.3 盈利能力</p>
      <p className="print-toc-i">5.4 现金流分析　5.5 营运能力　5.6 发票流水深度分析</p>
      <p className="print-toc-i">5.7 纳税申报与税负　5.8 关键比率横向对比　5.9 财务异动与解释</p>

      <p className="print-toc-h" style={{ marginTop: 8 }}>第六部分　履约能力与征信（LE-A05）</p>
      <p className="print-toc-i">6.1 历史融资记录　6.2 多头借贷分析　6.3 招投标与履约　6.4 资产抵质押</p>

      <p className="print-toc-h" style={{ marginTop: 8 }}>第七部分　五维信用评分明细（LE-A06/A07）</p>
      <p className="print-toc-i">7.1-7.5 五维评分明细　7.6 五对交叉验证</p>

      <p className="print-toc-h" style={{ marginTop: 8 }}>第八部分　授信用途与还款来源（LE-A09）</p>
      <p className="print-toc-i">8.1 授信用途　8.2 第一还款来源　8.3 第二还款来源　8.4 压力测试</p>

      <p className="print-toc-h" style={{ marginTop: 8 }}>第九部分　风险评估与缓释（LE-A08）</p>
      <p className="print-toc-i">9.1 风险地图　9.2-9.5 行业/经营/财务/法律合规风险与缓释</p>

      <p className="print-toc-h" style={{ marginTop: 8 }}>第十部分　贷后管理方案（LE-A11）</p>
      <p className="print-toc-i">10.1 事件驱动监控　10.2 定期复核　10.3 预警分级　10.4 授权管理</p>

      <p className="print-toc-h" style={{ marginTop: 10 }}>附录</p>
      <p className="print-toc-i">A. 数据接口清单与字段说明</p>
      <p className="print-toc-i">B. 评分算法详解</p>
      <p className="print-toc-i">C. 原始数据快照（脱敏）</p>
      <p className="print-toc-i">D. 数据合规授权链条</p>
      <p className="print-toc-i">E. 行业参考资料</p>
      <p className="print-toc-i">F. 模型版本说明</p>
      <p className="print-toc-i">G. 术语表</p>
    </>
  );
}

function SpToc() {
  return (
    <>
      <p className="print-toc-h">第一部分　报告摘要与授信意见</p>
      <p className="print-toc-i">1.1 四维综合评分摘要　1.2 信用等级与授信建议　1.3 一票否决检查　1.4 核心风险点</p>

      <p className="print-toc-h" style={{ marginTop: 8 }}>第二部分　经营者画像（SP-A01）</p>
      <p className="print-toc-i">2.1 基本信息　2.2 通讯生活稳定性　2.3 婚姻家庭　2.4 教育职业　2.5 综合画像　2.6 关联企业</p>

      <p className="print-toc-h" style={{ marginTop: 8 }}>第三部分　店铺与经营情况（SP-A02）</p>
      <p className="print-toc-i">3.1 工商登记　3.2 经营场所核验　3.3/3.4 行业经营数据　3.5 经营活跃度</p>

      <p className="print-toc-h" style={{ marginTop: 8 }}>第四部分　经济能力与还款来源（SP-A03）</p>
      <p className="print-toc-i">4.1 收入水平　4.2 银行卡交易　4.3 不动产　4.4 车辆　4.5 还款能力测算</p>

      <p className="print-toc-h" style={{ marginTop: 8 }}>第五部分　个人信用与多头借贷（SP-A05）</p>
      <p className="print-toc-i">5.1 信用预测评分　5.2 信贷行为指数　5.3 多头借贷　5.4 还款能力综合评分</p>

      <p className="print-toc-h" style={{ marginTop: 8 }}>第六部分　四维评分明细（SP-A06）</p>
      <p className="print-toc-i">6.1 个人信用画像　6.2 经济能力　6.3 经营存续　6.4 合规社会</p>

      <p className="print-toc-h" style={{ marginTop: 8 }}>第七部分　反欺诈与一票否决（SP-A04）</p>
      <p className="print-toc-i">7.1 五步反欺诈　7.2 一票否决核查　7.3 反欺诈综合分析</p>

      <p className="print-toc-h" style={{ marginTop: 8 }}>第八部分　风险评估与缓释（SP-A07）</p>
      <p className="print-toc-i">8.1 风险地图　8.2-8.5 经营/个人/财务/失联风险与缓释</p>

      <p className="print-toc-h" style={{ marginTop: 8 }}>第九部分　贷后管理方案（SP-A09）</p>
      <p className="print-toc-i">9.1 核心认知　9.2 行为监控　9.3 分级预警　9.4 授权管理</p>

      <p className="print-toc-h" style={{ marginTop: 10 }}>附录</p>
      <p className="print-toc-i">A. 数据接口清单与字段说明</p>
      <p className="print-toc-i">B. 评分算法详解</p>
      <p className="print-toc-i">C. 原始数据快照（脱敏）</p>
      <p className="print-toc-i">D. 数据合规授权链条</p>
      <p className="print-toc-i">E. 模型版本说明</p>
      <p className="print-toc-i">F. 术语表</p>
    </>
  );
}
