import { NextResponse } from 'next/server';

import {
  ALL_CUSTOMERS,
  LEGAL_ENTITY_CUSTOMERS,
  SOLE_PROPRIETOR_CUSTOMERS,
} from '@/data/customers';

import { mockNetworkDelay } from '../_lib/mock-delay';

/**
 * GET /api/customers
 *   ?type=all|legal-entity|sole-proprietor   按客群类型筛选（可选）
 *
 * 注：当前在前端做关键词/状态/评级/区域筛选；将来真后端可以把所有筛选都搬到这里。
 */
export async function GET(request: Request) {
  await mockNetworkDelay();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  const rows =
    type === 'legal-entity'
      ? LEGAL_ENTITY_CUSTOMERS
      : type === 'sole-proprietor'
        ? SOLE_PROPRIETOR_CUSTOMERS
        : ALL_CUSTOMERS;

  return NextResponse.json({
    customers: rows,
    counts: {
      all: ALL_CUSTOMERS.length,
      'legal-entity': LEGAL_ENTITY_CUSTOMERS.length,
      'sole-proprietor': SOLE_PROPRIETOR_CUSTOMERS.length,
    },
  });
}
