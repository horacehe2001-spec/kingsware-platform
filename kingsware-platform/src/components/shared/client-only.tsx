'use client';

import { useEffect, useState } from 'react';

/**
 * 仅在客户端渲染 children。用于 Recharts、依赖 window 的组件，避免 SSR 警告。
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <>{fallback}</>;
  return <>{children}</>;
}
