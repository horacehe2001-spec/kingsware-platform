import { NextResponse } from 'next/server';

import { getCustomerById } from '@/data/customers';
import { getReportByCustomerId } from '@/data/reports';

import { mockNetworkDelay } from '../../../_lib/mock-delay';
import { buildDocx } from './builder';

/**
 * GET /api/reports/:customerId/export
 *   返回一份可下载的授信尽职调查报告（docx 格式）。
 *   按报告空模板章节结构生成，含完整评分表、否决清单、风险点、交叉验证、Agent 日志。
 *
 *   文件名格式：报告编号_客户名称.docx
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ customerId: string }> },
) {
  await mockNetworkDelay();
  const { customerId } = await params;
  const customer = getCustomerById(customerId);
  const report = getReportByCustomerId(customerId);

  if (!customer || !report) {
    return NextResponse.json(
      { error: 'report_not_found', customerId },
      { status: 404 },
    );
  }

  const isLE = customer.type === 'legal-entity';
  const buf = await buildDocx(customer, report, isLE);
  const filename = `${report.reportNumber}_${customer.name}.docx`;

  const blob = new Blob([buf as unknown as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  return new Response(blob, {
    headers: {
      // 注意：filename="..." 必须纯 ASCII（HTTP 头规范），中文文件名只能放 filename*=
      'Content-Disposition': `attachment; filename="report.docx"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'X-Filename': encodeURIComponent(filename),
    },
  });
}
