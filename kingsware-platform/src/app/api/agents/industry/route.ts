import { NextResponse } from 'next/server';

import { runIndustryAgent } from '@/lib/agents/industry-agent';

/**
 * POST /api/agents/industry
 *
 * 入参：{ industryCode: string; industryName?: string; mock?: boolean }
 * 出参：IndustryAgentOutput
 *
 * - 没有 DEEPSEEK_API_KEY 时自动回退到 mock，不报错（方便演示）。
 * - mock=true 时强制走 mock 路径。
 */
export const runtime = 'nodejs';

interface Body {
  industryCode?: unknown;
  industryName?: unknown;
  mock?: unknown;
}

export async function POST(request: Request) {
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { error: 'invalid_body', message: '请求体必须是合法 JSON' },
      { status: 400 },
    );
  }

  const codeRaw = typeof body.industryCode === 'string' ? body.industryCode.trim() : '';
  if (!codeRaw) {
    return NextResponse.json(
      { error: 'missing_industry_code', message: 'industryCode 不能为空' },
      { status: 400 },
    );
  }
  if (codeRaw.length > 32) {
    return NextResponse.json(
      { error: 'industry_code_too_long', message: 'industryCode 过长（≤32 字符）' },
      { status: 400 },
    );
  }

  const nameOverride =
    typeof body.industryName === 'string' && body.industryName.trim()
      ? body.industryName.trim()
      : undefined;
  const forceMock = body.mock === true;

  try {
    const result = await runIndustryAgent(
      { industryCode: codeRaw, industryName: nameOverride },
      { forceMock },
    );
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: 'agent_failed', message },
      { status: 502 },
    );
  }
}
