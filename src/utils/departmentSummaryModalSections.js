/**
 * Modal `sections` built only from dashboard month-sum payloads already on the card.
 * No extra API calls.
 */

function safeNum(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

export function formatRangeCaption(from, to) {
  const f = (from && String(from).slice(0, 10)) || '';
  const t = (to && String(to).slice(0, 10)) || '';
  if (f && t && f !== t) return `${f} – ${t}`;
  if (f || t) return f || t;
  return 'No date filter (all loaded data)';
}

function periodSection(range) {
  return {
    title: 'Period',
    details: {
      'Dashboard date filter': formatRangeCaption(range?.from, range?.to),
    },
  };
}

function loadingOrEmpty(loading, hasData) {
  if (loading) return [{ title: '', details: { Status: 'Loading…' } }];
  if (!hasData) return [{ title: '', details: { Message: 'No data for this period.' } }];
  return null;
}

const fmtInt = (v) => (v == null || Number.isNaN(Number(v)) ? '—' : String(Math.round(safeNum(v))));
const fmtDec = (v) =>
  v == null || Number.isNaN(Number(v)) ? '—' : safeNum(v).toLocaleString(undefined, { maximumFractionDigits: 2 });
const fmtPct = (v) => (v == null || Number.isNaN(Number(v)) ? '—' : `${safeNum(v).toFixed(1)}%`);

function fmtPKR(v) {
  if (v == null || Number.isNaN(Number(v))) return '—';
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeNum(v));
}

function buildStore(data, loading, range) {
  const early = loadingOrEmpty(loading, data);
  if (early) return early;
  return [
    periodSection(range),
    {
      title: 'Demands',
      details: {
        'Generated demands': fmtInt(data.generated_demands),
        'Pending demands': fmtInt(data.pending_demands),
        'Rejected demands': fmtInt(data.rejected_demands),
      },
    },
    {
      title: 'GRN',
      details: {
        'Generated GRN': fmtInt(data.generated_grn),
        'Pending GRN': fmtInt(data.pending_grn),
      },
    },
  ];
}

function buildProcurements(data, loading, range) {
  const early = loadingOrEmpty(loading, data);
  if (early) return early;
  return [
    periodSection(range),
    {
      title: 'Purchase orders',
      details: {
        'Total generated POs': fmtInt(data.total_generated_pos),
        'PO pending': fmtInt(data.pending_pos),
        'PO fulfilled': fmtInt(data.fulfilled_pos),
      },
    },
    {
      title: 'Purchase invoices',
      details: {
        'Total generated PIs': fmtInt(data.total_generated_pis),
        'PI unpaid': fmtInt(data.unpaid_pis),
      },
    },
  ];
}

function buildAccounts(data, loading, range) {
  const early = loadingOrEmpty(loading, data);
  if (early) return early;
  const net = safeNum(data.daily_inflow) - safeNum(data.daily_outflow);
  return [
    periodSection(range),
    {
      title: 'Totals',
      details: {
        'Available funds': fmtPKR(data.available_funds),
        'Inflow (period)': fmtPKR(data.daily_inflow),
        'Outflow (period)': fmtPKR(data.daily_outflow),
        'Net (inflow − outflow)': fmtPKR(net),
      },
    },
    {
      title: 'Balances & payables',
      details: {
        'Pending payable': fmtPKR(data.pending_payable),
        'Petty cash': fmtPKR(data.petty_cash),
      },
    },
  ];
}

function buildAlHasanain(data, loading, range) {
  const early = loadingOrEmpty(loading, data);
  if (early) return early;
  return [
    periodSection(range),
    {
      title: 'Overview',
      details: {
        'Total students': fmtInt(data.total_students_sum),
        'Active teachers': fmtInt(data.active_teachers_sum),
        'Fee collection': fmtPKR(data.fee_collection_sum),
      },
    },
    {
      title: 'Rates',
      details: {
        'Attendance (avg)': fmtPct(data.attendance_percent_avg),
        'Pass rate (avg)': fmtPct(data.pass_rate_avg),
      },
    },
  ];
}

function buildAas(data, loading, range) {
  const early = loadingOrEmpty(loading, data);
  if (early) return early;
  return [
    periodSection(range),
    {
      title: 'Patients & tests',
      details: {
        'Total patients': fmtInt(data.total_patients_sum),
        'Tests conducted': fmtInt(data.tests_conducted_sum),
        'Pending tests': fmtInt(data.pending_tests_sum),
      },
    },
    {
      title: 'Performance',
      details: {
        Revenue: fmtPKR(data.revenue_sum),
        'On-time delivery (avg)': fmtPct(data.on_time_delivery_percent_avg),
      },
    },
  ];
}

function buildDreamSchool(data, loading, range) {
  const early = loadingOrEmpty(loading, data);
  if (early) return early;
  return [
    periodSection(range),
    {
      title: 'Visits & records',
      details: {
        'Visits (sum)': fmtInt(data.visits_sum),
        Records: fmtInt(data.records),
      },
    },
    {
      title: 'Quality breakdown',
      details: {
        Excellent: fmtInt(data.excellent_count),
        Good: fmtInt(data.good_count),
        Poor: fmtInt(data.poor_count),
      },
    },
  ];
}

function buildHealth(data, loading, range) {
  const early = loadingOrEmpty(loading, data);
  if (early) return early;
  return [
    periodSection(range),
    {
      title: 'Totals',
      details: {
        'Total (all categories)': fmtInt(data.total_sum),
      },
    },
    {
      title: 'By category',
      details: {
        Widows: fmtInt(data.widows_sum),
        Orphans: fmtInt(data.orphans_sum),
        Disabled: fmtInt(data.disable_sum),
        Indigent: fmtInt(data.indegent_sum),
      },
    },
  ];
}

/**
 * @param {string} deptKey
 * @param {{ data: object | null, loading: boolean, range?: { from?: string, to?: string } }} ctx
 */
export function buildDepartmentSummaryModalSections(deptKey, ctx) {
  const { data, loading, range } = ctx;
  switch (deptKey) {
    case 'store':
      return buildStore(data, loading, range);
    case 'procurements':
      return buildProcurements(data, loading, range);
    case 'accounts_and_finance':
      return buildAccounts(data, loading, range);
    case 'al_hasanain_clg':
      return buildAlHasanain(data, loading, range);
    case 'aas_collection_centers_report':
      return buildAas(data, loading, range);
    case 'dream_school_reports':
      return buildDreamSchool(data, loading, range);
    case 'health_reports':
      return buildHealth(data, loading, range);
    default:
      return [{ title: '', details: { Message: 'Unknown department.' } }];
  }
}
