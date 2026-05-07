import { NextResponse } from 'next/server';

import { getCustomerById } from '@/data/customers';

import { mockNetworkDelay } from '../../_lib/mock-delay';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await mockNetworkDelay();
  const { id } = await params;
  const customer = getCustomerById(id);
  if (!customer) {
    return NextResponse.json({ error: 'customer_not_found', id }, { status: 404 });
  }
  return NextResponse.json({ customer });
}
