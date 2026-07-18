import axiosInstance from './axios';

/**
 * Visual defaults aligned with `program_application_card/dummyData.js` (by program `key`).
 * Unknown keys fall back to `defaultStyleForProgramKey`.
 */
const PROGRAM_CARD_STYLE_BY_KEY = {
  food_security: { icon: 'bag', accent: '#16a34a', accentSoft: '#dcfce7' },
  community_services: { icon: 'users', accent: '#7c3aed', accentSoft: '#ede9fe' },
  widows_and_orphans_care_program: { icon: 'heart', accent: '#ea580c', accentSoft: '#ffedd5' },
  education: { icon: 'book', accent: '#2563eb', accentSoft: '#dbeafe' },
  water_clean_water: { icon: 'droplet', accent: '#0891b2', accentSoft: '#cffafe' },
  kasb: { icon: 'tool', accent: '#4f46e5', accentSoft: '#e0e7ff' },
  livelihood_support_program: { icon: 'tool', accent: '#0d9488', accentSoft: '#ccfbf1' },
  green_initiative: { icon: 'bag', accent: '#15803d', accentSoft: '#dcfce7' },
  disaster_management: { icon: 'heart', accent: '#be123c', accentSoft: '#ffe4e6' },
};

function defaultStyleForProgramKey(key) {
  let h = 0;
  const s = String(key || '');
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  const hue = Math.abs(h) % 360;
  return {
    icon: 'tool',
    accent: `hsl(${hue} 45% 40%)`,
    accentSoft: `hsl(${hue} 40% 92%)`,
  };
}

function toYmd(d) {
  if (!d) return '';
  if (typeof d === 'string') return d.slice(0, 10);
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

function inDateRange(reportDateYmd, { from, to } = {}) {
  if (!from && !to) return true;
  const y = toYmd(reportDateYmd);
  if (!y) return false;
  if (from && y < from) return false;
  if (to && y > to) return false;
  return true;
}

/** @param {import('axios').AxiosInstance} client */
async function fetchAllActivePrograms(client) {
  const pageSize = 500;
  let page = 1;
  const all = [];
  let hasMore = true;
  while (hasMore) {
    const res = await client.get('/program/programs', {
      params: { page, pageSize, active: 'true', applicationable: 'true' },
    });
    const rows = res.data?.data ?? [];
    all.push(...rows);
    const totalPages = res.data?.pagination?.totalPages ?? 1;
    if (page >= totalPages || rows.length === 0) hasMore = false;
    else page += 1;
  }
  return all;
}

/** @param {import('axios').AxiosInstance} client */
async function fetchAllApplicationReportGroups(client) {
  const pageSize = 500;
  let page = 1;
  const all = [];
  let hasMore = true;
  while (hasMore) {
    const res = await client.get('/program/application-reports', {
      params: { page, pageSize, sortField: 'created_at', sortOrder: 'DESC' },
    });
    const rows = res.data?.data ?? [];
    all.push(...rows);
    const totalPages = res.data?.pagination?.totalPages ?? 1;
    if (page >= totalPages || rows.length === 0) hasMore = false;
    else page += 1;
  }
  return all;
}

/**
 * Expands grouped API rows into flat lines with `report_date` for filtering.
 */
function groupsToLines(groups, dateRange) {
  const lines = [];
  for (const g of groups) {
    if (!inDateRange(g.report_date, dateRange)) continue;
    const ymd = toYmd(g.report_date);
    for (const app of g.applications || []) {
      lines.push({ ...app, report_date: ymd });
    }
  }
  return lines;
}

function aggregateByProject(lines) {
  const map = {};
  for (const line of lines) {
    const key = line.project;
    if (!key) continue;
    if (!map[key]) {
      map[key] = {
        application_count: 0,
        investigated: 0,
        verified: 0,
        approved: 0,
        rejected: 0,
        pending: 0,
      };
    }
    map[key].application_count += Number(line.application_count) || 0;
    map[key].investigated += Number(line.investigation_count) || 0;
    map[key].verified += Number(line.verified_count) || 0;
    map[key].approved += Number(line.approved_count) || 0;
    map[key].rejected += Number(line.rejected_count) || 0;
    map[key].pending += Number(line.pending_count) || 0;
  }
  return map;
}

function roundRate(approved, total) {
  if (!total || total <= 0) return 0;
  return Math.round((approved / total) * 1000) / 10;
}

/**
 * Fetches active programs, then all application report groups, aggregates by program `key`,
 * and returns carousel rows matching `dummyData.js` shape, with an **Overall** card first.
 *
 * @param {object} [options]
 * @param {string} [options.from] - YYYY-MM-DD inclusive
 * @param {string} [options.to] - YYYY-MM-DD inclusive
 * @param {import('axios').AxiosInstance} [options.client] - default: axiosInstance
 * @returns {Promise<Array<{
 *   id: string,
 *   name: string,
 *   icon: string,
 *   accent: string,
 *   accentSoft: string,
 *   total: number,
 *   approvalRate: number,
 *   investigated: number,
 *   verified: number,
 *   approved: number,
 *   rejected: number,
 *   pendingTotal?: number,
 *   isOverall?: boolean
 * }>>}
 */
export async function fetchProgramApplicationOverviewCards(options = {}) {
  const { from, to, client = axiosInstance } = options;
  const dateRange = { from: from || null, to: to || null };

  const activePrograms = await fetchAllActivePrograms(client);
  const groups = await fetchAllApplicationReportGroups(client);
  const lines = groupsToLines(groups, dateRange);
  const byProject = aggregateByProject(lines);

  let totalApplications = 0;
  let totalInvestigated = 0;
  let totalVerified = 0;
  let totalApproved = 0;
  let totalRejected = 0;
  let totalPending = 0;
  Object.values(byProject).forEach((a) => {
    totalApplications += a.application_count;
    totalInvestigated += a.investigated;
    totalVerified += a.verified;
    totalApproved += a.approved;
    totalRejected += a.rejected;
    totalPending += a.pending;
  });

  const overallCard = {
    id: 'overall',
    name: 'Overall',
    icon: 'layers',
    accent: '#1e293b',
    accentSoft: '#e2e8f0',
    total: totalApplications,
    approvalRate: roundRate(totalApproved, totalApplications),
    investigated: totalInvestigated,
    verified: totalVerified,
    approved: totalApproved,
    rejected: totalRejected,
    pendingTotal: totalPending,
    isOverall: true,
  };

  const programCards = activePrograms.map((p) => {
    const key = p.key;
    const agg = byProject[key] || {
      application_count: 0,
      investigated: 0,
      verified: 0,
      approved: 0,
      rejected: 0,
      pending: 0,
    };
    const style = PROGRAM_CARD_STYLE_BY_KEY[key] || defaultStyleForProgramKey(key);
    return {
      id: key,
      name: p.label || key,
      ...style,
      total: agg.application_count,
      approvalRate: roundRate(agg.approved, agg.application_count),
      investigated: agg.investigated,
      verified: agg.verified,
      approved: agg.approved,
      rejected: agg.rejected,
    };
  });

  return [overallCard, ...programCards];
}

/**
 * Same card shape, loaded from Nest `GET /new-dashboard/dashboard-report/program-application-overview`.
 * Prefer this when the backend module is available (single round-trip, DB-side aggregation).
 */
export async function fetchProgramApplicationOverviewCardsFromServer(options = {}) {
  const { from, to, client = axiosInstance } = options;
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await client.get('/new-dashboard/dashboard-report/program-application-overview', {
    params,
  });
  if (res.data?.success === false) {
    throw new Error(res.data?.message || 'Failed to load program application overview');
  }
  return res.data?.data ?? [];
}

export default fetchProgramApplicationOverviewCards;
