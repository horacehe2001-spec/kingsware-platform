import { NextResponse } from 'next/server';

import { LE_AGENTS, SP_AGENTS } from '@/data/agents';
import { getCustomerById } from '@/data/customers';
import { getReportByCustomerId } from '@/data/reports';

import { mockNetworkDelay } from '../../_lib/mock-delay';

/**
 * GET /api/reports/:customerId
 *   返回完整报告 bundle（customer + report + agents 定义）。
 *   一次拉齐供详情页一次渲染，避免瀑布请求。
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

  const agents = customer.type === 'legal-entity' ? LE_AGENTS : SP_AGENTS;

  return NextResponse.json({ customer, report, agents });
}
