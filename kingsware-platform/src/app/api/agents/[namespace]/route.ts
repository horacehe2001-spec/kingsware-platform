import { NextResponse } from 'next/server';

import { LE_AGENTS, SP_AGENTS } from '@/data/agents';

import { mockNetworkDelay } from '../../_lib/mock-delay';

/**
 * GET /api/agents/:namespace
 *   namespace = LE → 法人 16 个 / SP → 个体户 14 个
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ namespace: string }> },
) {
  await mockNetworkDelay();
  const { namespace } = await params;
  const ns = namespace.toUpperCase();
  if (ns !== 'LE' && ns !== 'SP') {
    return NextResponse.json(
      { error: 'invalid_namespace', namespace },
      { status: 400 },
    );
  }
  return NextResponse.json({
    namespace: ns,
    agents: ns === 'LE' ? LE_AGENTS : SP_AGENTS,
  });
}
