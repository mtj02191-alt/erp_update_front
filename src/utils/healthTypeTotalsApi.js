import axiosInstance from './axios';

/**
 * GET /program/health/reports/type-totals
 *
 * @param {object} [options]
 * @param {string} [options.from] - YYYY-MM-DD inclusive
 * @param {string} [options.to] - YYYY-MM-DD inclusive
 * @param {import('axios').AxiosInstance} [options.client]
 * @returns {Promise<{
 *   from?: string,
 *   to?: string,
 *   types: Array<{ type: string, total: number }>,
 *   grand_total: number
 * }>}
 */
export async function fetchHealthTypeTotals(options = {}) {
  const { from, to, client = axiosInstance } = options;
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await client.get('/program/health/reports/type-totals', { params });
  if (res.data?.success === false) throw new Error(res.data?.message || 'Failed to load health type totals');
  return res.data?.data;
}

export default fetchHealthTypeTotals;

