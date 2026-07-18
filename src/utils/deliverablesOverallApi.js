import axiosInstance from './axios';

/**
 * @param {object} [options]
 * @param {string} [options.from] - YYYY-MM-DD inclusive
 * @param {string} [options.to] - YYYY-MM-DD inclusive
 * @param {import('axios').AxiosInstance} [options.client]
 * @returns {Promise<{
 *   from?: string,
 *   to?: string,
 *   programsList: Array<{ key: string, label: string, totalDelivered: number }>,
 *   vulnerabilities: Array<{ key: string, label: string, total: number }>,
 *   totalDeliveredAllPrograms: number,
 *   totalVulnerabilitiesAll: number,
 *   programVulnerabilityCards: Array<{
 *     key: string,
 *     label: string,
 *     totalDelivered: number,
 *     lines: Array<{ key: string, label: string, count: number }>,
 *     vulnerabilitiesTotal: number
 *   }>
 * }>}
 */
export async function fetchDeliverablesOverall(options = {}) {
  const { from, to, client = axiosInstance } = options;
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await client.get('/new-dashboard/dashboard-report/deliverables-overall', {
    params,
  });
  if (res.data?.success === false) {
    throw new Error(res.data?.message || 'Failed to load deliverables overall');
  }
  return res.data?.data;
}

export default fetchDeliverablesOverall;
