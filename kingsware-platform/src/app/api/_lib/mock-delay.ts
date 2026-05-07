/**
 * 模拟网络延迟。仅在开发环境下生效，让 loading skeleton 有真实展现机会。
 *
 * 配置：通过 NEXT_PUBLIC_MOCK_API_DELAY_MS 覆盖（毫秒）。
 *   - 未设置：开发环境 300ms，生产环境 0
 *   - 显式设为 0：禁用
 */
export async function mockNetworkDelay() {
  const override = process.env.NEXT_PUBLIC_MOCK_API_DELAY_MS;
  const ms = override !== undefined ? Number(override) : process.env.NODE_ENV === 'development' ? 300 : 0;
  if (!Number.isFinite(ms) || ms <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}
