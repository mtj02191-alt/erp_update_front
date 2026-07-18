import axiosInstance from './axios';

function formatYmdLocal(d) {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${day}`;
}

/** First and last day of the month containing `ref` (local calendar). */
export function getCalendarMonthRangeYmd(ref = new Date()) {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const from = new Date(y, m, 1);
  const to = new Date(y, m + 1, 0);
  return { from: formatYmdLocal(from), to: formatYmdLocal(to) };
}

/**
 * @param {object} [options]
 * @param {string} [options.from] - YYYY-MM-DD inclusive
 * @param {string} [options.to] - YYYY-MM-DD inclusive
 * @param {import('axios').AxiosInstance} [options.client]
 */
export async function fetchStoreDailyMonthSum(options = {}) {
  const { from, to, client = axiosInstance } = options;
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await client.get('/new-dashboard/dashboard-report/store-daily-month-sum', { params });
  if (res.data?.success === false) throw new Error(res.data?.message || 'Failed to load store sum');
  const d = res.data?.data;
  if (!d) return null;
  return {
    from: d.from,
    to: d.to,
    generated_demands: Number(d.generated_demands) || 0,
    pending_demands: Number(d.pending_demands) || 0,
    rejected_demands: Number(d.rejected_demands) || 0,
    generated_grn: Number(d.generated_grn) || 0,
    pending_grn: Number(d.pending_grn) || 0,
  };
}

export async function fetchProcurementsDailyMonthSum(options = {}) {
  const { from, to, client = axiosInstance } = options;
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await client.get('/new-dashboard/dashboard-report/procurements-daily-month-sum', { params });
  if (res.data?.success === false) throw new Error(res.data?.message || 'Failed to load procurements sum');
  return res.data?.data;
}

export async function fetchAccountsAndFinanceDailyMonthSum(options = {}) {
  const { from, to, client = axiosInstance } = options;
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await client.get('/new-dashboard/dashboard-report/accounts-and-finance-daily-month-sum', { params });
  if (res.data?.success === false) throw new Error(res.data?.message || 'Failed to load accounts sum');
  return res.data?.data;
}

export async function fetchAlHasanainClgMonthSum(options = {}) {
  const { from, to, client = axiosInstance } = options;
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await client.get('/new-dashboard/dashboard-report/al-hasanain-clg-month-sum', { params });
  if (res.data?.success === false) throw new Error(res.data?.message || 'Failed to load al hasanain sum');
  return res.data?.data;
}

export async function fetchAasCollectionCentersReportMonthSum(options = {}) {
  const { from, to, client = axiosInstance } = options;
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await client.get('/new-dashboard/dashboard-report/aas-collection-centers-report-month-sum', { params });
  if (res.data?.success === false) throw new Error(res.data?.message || 'Failed to load AAS sum');
  return res.data?.data;
}

export async function fetchDreamSchoolReportsMonthSum(options = {}) {
  const { from, to, client = axiosInstance } = options;
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await client.get('/new-dashboard/dashboard-report/dream-school-reports-month-sum', { params });
  if (res.data?.success === false) throw new Error(res.data?.message || 'Failed to load Dream School sum');
  return res.data?.data;
}

export async function fetchHealthReportsMonthSum(options = {}) {
  const { from, to, client = axiosInstance } = options;
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await client.get('/new-dashboard/dashboard-report/health-reports-month-sum', { params });
  if (res.data?.success === false) throw new Error(res.data?.message || 'Failed to load Health sum');
  return res.data?.data;
}

export default {
  getCalendarMonthRangeYmd,
  fetchStoreDailyMonthSum,
  fetchProcurementsDailyMonthSum,
  fetchAccountsAndFinanceDailyMonthSum,
  fetchAlHasanainClgMonthSum,
  fetchAasCollectionCentersReportMonthSum,
  fetchDreamSchoolReportsMonthSum,
  fetchHealthReportsMonthSum,
};

