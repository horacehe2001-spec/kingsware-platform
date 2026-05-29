import { notFound } from 'next/navigation';

import { AgentPipeline } from '@/components/report/agent-pipeline';
import { CrossValidationCard } from '@/components/report/cross-validation';
import { RecommendationCard } from '@/components/report/recommendation';
import { ReportHeader } from '@/components/report/report-header';
import { ReportTabs } from '@/components/report/report-tabs';
import { RiskPointsList } from '@/components/report/risk-points';
import { ScoreRadar } from '@/components/report/score-radar';
import { SectionList } from '@/components/report/section-list';
import { VetoCheck } from '@/components/report/veto-check';
import { TabsContent } from '@/components/ui/tabs';
import { gradeToLabel } from '@/data/analysis-labels';
import { ApiError, fetchReportBundle } from '@/lib/api';

interface ReportPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ReportPage({ params, searchParams }: ReportPageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const initialTab = typeof sp.tab === 'string' ? sp.tab : null;

  const { customer, report, agents } = await fetchReportBundle(id).catch((err) => {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err; // 其他错误冒泡到 error.tsx
  });

  const isLE = customer.type === 'legal-entity';
  const totalApiCalls = report.agentStates.reduce(
    (s, st) => s + (st.apiCalls ?? 0),
    0,
  );

  // 雷达数据
  const radarData = isLE
    ? [
        { dimension: '经营稳定性', score: customer.fiveDimensionScores?.operationStability ?? 0, weight: 30 },
        { dimension: '财务健康度', score: customer.fiveDimensionScores?.financialHealth ?? 0, weight: 25 },
        { dimension: '履约能力', score: customer.fiveDimensionScores?.performance ?? 0, weight: 25 },
        { dimension: '合规性', score: customer.fiveDimensionScores?.compliance ?? 0, weight: 15 },
        { dimension: '成长性', score: customer.fiveDimensionScores?.growth ?? 0, weight: 5 },
      ]
    : [
        { dimension: '个人信用画像', score: customer.fourDimensionScores?.personalCredit ?? 0, weight: 35 },
        { dimension: '经济能力与资产', score: customer.fourDimensionScores?.economicCapacity ?? 0, weight: 25 },
        { dimension: '经营存续与真实性', score: customer.fourDimensionScores?.operationAuthenticity ?? 0, weight: 25 },
        { dimension: '合规与社会稳定性', score: customer.fourDimensionScores?.socialStability ?? 0, weight: 15 },
      ];

  return (
    <div className="flex flex-col gap-4">
      <ReportHeader customer={customer} report={report} />

      {/* 主体：左 Agent 流水线（核心 AI 高光） + 右内容 */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <aside className="xl:col-span-4 2xl:col-span-3">
          <div className="sticky top-20">
            <AgentPipeline
              agents={agents}
              states={report.agentStates}
              namespace={customer.type === 'legal-entity' ? 'LE' : 'SP'}
              totalApiCalls={totalApiCalls}
            />
          </div>
        </aside>

        <main className="space-y-4 xl:col-span-8 2xl:col-span-9">
          {/* 顶部：评分雷达 + 决策建议两栏 */}
          <div className="grid gap-4 lg:grid-cols-2">
            <ScoreRadar
              title={isLE ? '企业综合分析模型' : '四维评分模型'}
              subtitle={isLE ? '法人小微 · 维度权重 30/25/25/15/5' : '个体工商户 · 35/25/25/15'}
              totalScore={report.totalScore}
              grade={report.creditGrade}
              data={radarData}
              mode={isLE ? 'analysis' : 'score'}
              overallLabel={isLE && report.creditGrade ? gradeToLabel(report.creditGrade) : undefined}
            />
            <RecommendationCard recommendation={report.recommendation} analysisMode={isLE} />
          </div>

          {/* Tab 切换（URL: ?tab=risks|cross|veto|sections） */}
          <ReportTabs
            initialTab={initialTab}
            showCrossValidation={Boolean(isLE && report.crossValidations)}
          >
            <TabsContent value="risks" className="mt-3">
              <RiskPointsList points={report.riskPoints} />
            </TabsContent>
            {isLE && report.crossValidations && (
              <TabsContent value="cross" className="mt-3">
                <CrossValidationCard validations={report.crossValidations} />
              </TabsContent>
            )}
            <TabsContent value="veto" className="mt-3">
              <VetoCheck items={report.oneVoteVeto} />
            </TabsContent>
            <TabsContent value="sections" className="mt-3">
              <SectionList sections={report.sections} />
            </TabsContent>
          </ReportTabs>
        </main>
      </div>
    </div>
  );
}
