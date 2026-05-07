import { NextResponse } from 'next/server';

import {
  ACTIVITY_FEED,
  KPI_METRICS,
  RISK_EVENTS,
  TODO_ITEMS,
} from '@/data/dashboard';

import { mockNetworkDelay } from '../_lib/mock-delay';

/**
 * GET /api/dashboard
 *   工作台一次性拉齐 KPI / 待办 / 活动流 / 风险事件。
 *   未来可拆成 4 个独立端点 + 走 SSE 做活动流实时推送。
 */
export async function GET() {
  await mockNetworkDelay();
  return NextResponse.json({
    kpi: KPI_METRICS,
    todos: TODO_ITEMS,
    activity: ACTIVITY_FEED,
    riskEvents: RISK_EVENTS,
  });
}
