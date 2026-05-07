import { Suspense } from 'react';

import { fetchCustomers } from '@/lib/api';

import { CustomersView } from './customers-view';

export default async function CustomersPage() {
  const { customers } = await fetchCustomers('all');

  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">加载中…</div>}>
      <CustomersView initialCustomers={customers} />
    </Suspense>
  );
}
