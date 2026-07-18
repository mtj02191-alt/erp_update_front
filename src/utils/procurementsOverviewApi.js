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
 * Fetches the newest Procurements Daily Report (by date desc) and returns a normalized object.
 *
 * @param {object} [options]
 * @param {import('axios').AxiosInstance} [options.client]
 * @returns {Promise<{
 *   id: number,
 *   date?: string,
 *   total_generated_pos: number,
 *   pending_pos: number,
 *   fulfilled_pos: number,
 *   total_generated_pis: number,
 *   unpaid_pis: number,
 *   total_paid_amount: number,
 *   unpaid_amount: number,
 *   tenders: number
 * } | null>}
 */
export async function fetchLatestProcurementsDailyReport(options = {}) {
  const { client = axiosInstance } = options;
  const res = await client.get('/procurements/reports', {
    params: { page: 1, pageSize: 1, sortField: 'date', sortOrder: 'DESC' },
  });

  const rows = res.data?.data;
  const first = Array.isArray(rows) ? rows[0] : null;
  if (!first) return null;

  return {
    id: Number(first.id),
    date: toYmd(first.date),
    total_generated_pos: Number(first.total_generated_pos) || 0,
    pending_pos: Number(first.pending_pos) || 0,
    fulfilled_pos: Number(first.fulfilled_pos) || 0,
    total_generated_pis: Number(first.total_generated_pis) || 0,
    unpaid_pis: Number(first.unpaid_pis) || 0,
    total_paid_amount: Number(first.total_paid_amount) || 0,
    unpaid_amount: Number(first.unpaid_amount) || 0,
    tenders: Number(first.tenders) || 0,
  };
}

export default fetchLatestProcurementsDailyReport;

