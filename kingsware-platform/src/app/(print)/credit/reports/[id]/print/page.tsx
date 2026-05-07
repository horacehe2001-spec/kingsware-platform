import { notFound } from 'next/navigation';

import { ApiError, fetchReportBundle } from '@/lib/api';

import { PrintReport } from './print-report';

interface PrintPageProps {
  params: Promise<{ id: string }>;
}

export default async function PrintPage({ params }: PrintPageProps) {
  const { id } = await params;

  const bundle = await fetchReportBundle(id).catch((err) => {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  });

  return <PrintReport {...bundle} />;
}
