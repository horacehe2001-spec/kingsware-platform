import type {
  ActivityEvent,
  AgentDefinition,
  AgentNamespace,
  Customer,
  CustomerType,
  DueDiligenceReport,
  KpiMetric,
  RiskEvent,
  TodoItem,
} from '@/data/types';

// ─────────────────────────────────────────────
// Base URL 解析
//   - 服务器端（RSC / route handler）调用本地 fetch 用绝对 URL
//   - 浏览器端用相对路径
//   未来真后端就把 NEXT_PUBLIC_API_BASE_URL 指过去即可
// ─────────────────────────────────────────────
function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') return '';
  // SSR / RSC：必须是绝对 URL
  const port = process.env.PORT ?? '3000';
  return `http://localhost:${port}`;
}

// ─────────────────────────────────────────────
// 公共 fetch 包装：统一错误 + Next.js 缓存策略
// ─────────────────────────────────────────────
class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface FetchOptions {
  /** Next.js 数据缓存：默认 RSC 端 'no-store'（mock 数据每次新鲜）*/
  cache?: RequestCache;
  /** 透传 next.revalidate */
  revalidate?: number | false;
}

async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const init: RequestInit & { next?: { revalidate?: number | false } } = {
    cache: opts.cache ?? 'no-store',
  };
  if (opts.revalidate !== undefined) {
    init.next = { revalidate: opts.revalidate };
  }

  const res = await fetch(url, init);
  if (!res.ok) {
    let code = 'unknown_error';
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) code = body.error;
    } catch {
      // ignore non-json error bodies
    }
    throw new ApiError(res.status, code, `API ${path} failed: ${res.status} ${code}`);
  }
  return res.json() as Promise<T>;
}

// ─────────────────────────────────────────────
// 类型化端点
// ─────────────────────────────────────────────
export interface CustomersResponse {
  customers: Customer[];
  counts: Record<'all' | CustomerType, number>;
}

export interface ReportBundleResponse {
  customer: Customer;
  report: DueDiligenceReport;
  agents: AgentDefinition[];
}

export interface DashboardResponse {
  kpi: KpiMetric[];
  todos: TodoItem[];
  activity: ActivityEvent[];
  riskEvents: RiskEvent[];
}

export interface AgentListResponse {
  namespace: AgentNamespace;
  agents: AgentDefinition[];
}

// ─────────────────────────────────────────────
// 公开 API
// ─────────────────────────────────────────────
export function fetchCustomers(type?: CustomerType | 'all', opts?: FetchOptions) {
  const qs = type && type !== 'all' ? `?type=${type}` : '';
  return apiFetch<CustomersResponse>(`/api/customers${qs}`, opts);
}

export function fetchCustomer(id: string, opts?: FetchOptions) {
  return apiFetch<{ customer: Customer }>(`/api/customers/${encodeURIComponent(id)}`, opts);
}

export function fetchReportBundle(customerId: string, opts?: FetchOptions) {
  return apiFetch<ReportBundleResponse>(
    `/api/reports/${encodeURIComponent(customerId)}`,
    opts,
  );
}

export function fetchDashboard(opts?: FetchOptions) {
  return apiFetch<DashboardResponse>('/api/dashboard', opts);
}

export function fetchAgents(namespace: AgentNamespace, opts?: FetchOptions) {
  return apiFetch<AgentListResponse>(`/api/agents/${namespace}`, opts);
}

export { ApiError };
