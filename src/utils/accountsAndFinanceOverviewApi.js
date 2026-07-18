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

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Fetches the newest Accounts & Finance daily report (by date desc) and returns a normalized object.
 *
 * Backend currently returns an array (not paginated) for `GET /accounts-and-finance/reports`.
 * Frontend list has a pagination-shaped fallback; we support both shapes here.
 *
 * @param {object} [options]
 * @param {import('axios').AxiosInstance} [options.client]
 * @returns {Promise<{
 *   id: number,
 *   date?: string,
 *   daily_inflow: number,
 *   daily_outflow: number,
 *   available_funds: number,
 *   pending_payable: number,
 *   petty_cash: number
 * } | null>}
 */
function normalizeReportRow(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    date: toYmd(row.date),
    daily_inflow: toNumber(row.daily_inflow),
    daily_outflow: toNumber(row.daily_outflow),
    available_funds: toNumber(row.available_funds),
    pending_payable: toNumber(row.pending_payable),
    petty_cash: toNumber(row.petty_cash),
  };
}

/**
 * @param {object} [options]
 * @param {import('axios').AxiosInstance} [options.client]
 * @param {string} [options.asOfDate] - YYYY-MM-DD: pick that day's row if present; otherwise latest by date
 */
export async function fetchLatestAccountsAndFinanceDailyReport(options = {}) {
  const { client = axiosInstance, asOfDate } = options;
  const res = await client.get('/accounts-and-finance/reports');

  const rows = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
  if (!rows.length) return null;

  if (asOfDate) {
    const hit = rows.find((r) => toYmd(r.date) === asOfDate.slice(0, 10));
    if (hit) return normalizeReportRow(hit);
  }

  const sorted = [...rows].sort((a, b) => {
    const da = new Date(a?.date).getTime() || 0;
    const db = new Date(b?.date).getTime() || 0;
    return db - da;
  });
  return normalizeReportRow(sorted[0]);
}

export default fetchLatestAccountsAndFinanceDailyReport;

