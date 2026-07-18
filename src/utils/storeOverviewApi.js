import axiosInstance from './axios';

function toYmd(dateLike) {
  if (!dateLike) return '';
  if (typeof dateLike === 'string') return dateLike.slice(0, 10);
  try {
    return new Date(dateLike).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

/**
 * Fetches the newest Store Daily Report (by date desc) and returns a normalized object.
 *
 * @param {object} [options]
 * @param {import('axios').AxiosInstance} [options.client]
 * @returns {Promise<{
 *   id: number,
 *   date?: string,
 *   generated_demands: number,
 *   pending_demands: number,
 *   rejected_demands: number,
 *   generated_grn: number,
 *   pending_grn: number
 * } | null>}
 */
export async function fetchLatestStoreDailyReport(options = {}) {
  const { client = axiosInstance } = options;
  const res = await client.get('/store/reports', {
    params: { page: 1, pageSize: 1, sortField: 'date', sortOrder: 'DESC' },
  });

  const rows = res.data?.data;
  const first = Array.isArray(rows) ? rows[0] : null;
  if (!first) return null;

  return {
    id: Number(first.id),
    date: toYmd(first.date),
    generated_demands: Number(first.generated_demands) || 0,
    pending_demands: Number(first.pending_demands) || 0,
    rejected_demands: Number(first.rejected_demands) || 0,
    generated_grn: Number(first.generated_grn) || 0,
    pending_grn: Number(first.pending_grn) || 0,
  };
}

export default fetchLatestStoreDailyReport;

