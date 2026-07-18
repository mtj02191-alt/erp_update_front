import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import axiosInstance from '../../../../utils/axios';
import { DropdownFilter, DateRangeFilter, SearchButton, ClearButton } from '../../../common/filters';
import SummaryStatCard from '../../../common/dashboard/summary_stat_card';
import RaisedEachMonthChart from '../../../common/charts/raised_each_month_chart';
import DoughnutChart from '../../../common/charts/doughnut_chart';
import { GiGoat, GiCow } from 'react-icons/gi';
import { PiCowFill } from 'react-icons/pi';
import './styles.css';

const DEFAULT_PARENT_CODE = 'qurbani_workflow';

const ICON_BY_CODE = {
  cow_share: PiCowFill,
  cow: GiCow,
  goat: GiGoat,
};

const COLOR_BY_CODE = {
  cow_share: '#22c55e',
  cow: '#2563eb',
  goat: '#f59e0b',
};

function isoToday() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function isoDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export default function ProgressTemplateDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [templateOptions, setTemplateOptions] = useState([]);

  const [tempFilters, setTempFilters] = useState({
    template_id: '',
    start_date: isoDaysAgo(30),
    end_date: isoToday(),
    interval: 'daily',
  });
  const [appliedFilters, setAppliedFilters] = useState({ ...tempFilters });

  const [report, setReport] = useState(null);

  const handleFilterChange = (key, value) =>
    setTempFilters((p) => ({ ...p, [key]: value }));

  const handleApply = () => {
    setAppliedFilters({ ...tempFilters });
  };

  const handleClear = () => {
    const reset = {
      template_id: '',
      start_date: isoDaysAgo(30),
      end_date: isoToday(),
      interval: 'daily',
    };
    setTempFilters(reset);
    setAppliedFilters(reset);
  };

  useEffect(() => {
    let cancelled = false;
    axiosInstance
      .get('/progress/workflow-templates')
      .then((res) => {
        if (cancelled) return;
        const items = res?.data?.data || [];
        const opts = items.map((t) => ({
          value: String(t.id),
          label: t.code ? `${t.name} (${t.code})` : t.name,
          code: t.code,
        }));
        setTemplateOptions(opts);
        const q = opts.find((x) => x.code === DEFAULT_PARENT_CODE);
        if (q && !tempFilters.template_id) {
          setTempFilters((p) => ({ ...p, template_id: String(q.value) }));
          setAppliedFilters((p) => ({ ...p, template_id: String(q.value) }));
        }
      })
      .catch(() => {
        // ignore: dashboard can still render with manual id entry if needed
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    const templateId = appliedFilters.template_id;
    if (!templateId) {
      setReport(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    axiosInstance
      .get('/progress/reports/template-tree-summary', {
        params: {
          template_id: templateId,
          start_date: appliedFilters.start_date || undefined,
          end_date: appliedFilters.end_date || undefined,
          interval: appliedFilters.interval || 'daily',
        },
      })
      .then((res) => {
        if (cancelled) return;
        if (res?.data?.success) setReport(res.data.data);
        else setError(res?.data?.message || 'Failed to load report');
      })
      .catch((e) => {
        if (!cancelled) setError(e?.response?.data?.message || 'Failed to load report');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [appliedFilters]);

  const templates = report?.templates || [];
  const totalsById = useMemo(() => {
    const map = new Map();
    (report?.totals || []).forEach((r) => map.set(Number(r.template_id), Number(r.units || 0)));
    return map;
  }, [report]);

  const kpiCards = useMemo(() => {
    const leafs = templates.map((t) => ({
      ...t,
      units: totalsById.get(Number(t.id)) || 0,
    }));
    // For Qurbani screenshot style: show up to 3 “main” lines if present.
    const preferOrder = ['cow_share', 'cow', 'goat'];
    leafs.sort((a, b) => {
      const ai = preferOrder.indexOf(String(a.code));
      const bi = preferOrder.indexOf(String(b.code));
      if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      return String(a.name).localeCompare(String(b.name));
    });
    return leafs.slice(0, 3).map((t) => {
      const Icon = ICON_BY_CODE[String(t.code)] || null;
      const accentBg = String(t.code) in COLOR_BY_CODE ? `${COLOR_BY_CODE[String(t.code)]}22` : '#e2e8f0';
      const accentFg = String(t.code) in COLOR_BY_CODE ? COLOR_BY_CODE[String(t.code)] : '#1e293b';
      return {
        id: t.id,
        title: `${t.name} Donated`,
        bigValue: t.units,
        icon: Icon,
        accent: { bg: accentBg, fg: accentFg },
      };
    });
  }, [templates, totalsById]);

  const timeseriesChart = useMemo(() => {
    const rows = report?.timeseries || [];
    if (!rows.length) return { labels: [], datasets: [] };
    const labels = Array.from(new Set(rows.map((r) => r.period_start))).sort();
    const byTpl = new Map();
    for (const t of templates) byTpl.set(Number(t.id), t);
    const seriesByTplId = new Map();
    for (const r of rows) {
      const tid = Number(r.template_id);
      if (!seriesByTplId.has(tid)) seriesByTplId.set(tid, new Map());
      seriesByTplId.get(tid).set(String(r.period_start), Number(r.units || 0));
    }
    const datasets = templates.map((t) => {
      const code = String(t.code || '');
      const color = COLOR_BY_CODE[code] || '#64748b';
      const m = seriesByTplId.get(Number(t.id)) || new Map();
      return {
        label: t.name,
        data: labels.map((d) => Number(m.get(d) || 0)),
        backgroundColor: `${color}CC`,
      };
    });
    return { labels, datasets };
  }, [report, templates]);

  const mixData = useMemo(() => {
    if (!templates.length) return null;
    const labels = templates.map((t) => t.name);
    const values = templates.map((t) => totalsById.get(Number(t.id)) || 0);
    const colors = templates.map((t) => COLOR_BY_CODE[String(t.code)] || '#94a3b8');
    return { labels, values, colors };
  }, [templates, totalsById]);

  const dailyTable = useMemo(() => {
    const rows = report?.timeseries || [];
    if (!rows.length) return [];
    const byDate = new Map();
    for (const r of rows) {
      const d = String(r.period_start);
      if (!byDate.has(d)) byDate.set(d, new Map());
      byDate.get(d).set(Number(r.template_id), Number(r.units || 0));
    }
    const dates = Array.from(byDate.keys()).sort((a, b) => (a < b ? 1 : -1));
    return dates.map((d) => {
      const m = byDate.get(d);
      const cols = templates.map((t) => ({
        template_id: Number(t.id),
        code: String(t.code),
        name: t.name,
        units: Number(m.get(Number(t.id)) || 0),
      }));
      const total = cols.reduce((s, x) => s + Number(x.units || 0), 0);
      return { date: d, cols, total };
    });
  }, [report, templates]);

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader title="Workflow Template Report" showBackButton={false} />

        <div className="list-content">
          <div className="ptd-filters">
            <DropdownFilter
              filterKey="template_id"
              label="Parent workflow template"
              data={templateOptions}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="Select template"
              showClearButton={true}
            />
            <DateRangeFilter
              startKey="start_date"
              endKey="end_date"
              label="Date Range"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
            />
            <DropdownFilter
              filterKey="interval"
              label="Interval"
              data={[
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
              ]}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="Daily"
              showClearButton={false}
            />
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <SearchButton onClick={handleApply} text="Apply" loading={loading} />
              <ClearButton onClick={handleClear} text="Clear" />
            </div>
          </div>

          {error ? <div className="status-message status-message--error">{error}</div> : null}

          {loading ? (
            <div className="loading">Loading…</div>
          ) : report ? (
            <>
              <div className="ptd-cards">
                {kpiCards.map((c) => (
                  <SummaryStatCard
                    key={c.id}
                    icon={c.icon}
                    title={c.title}
                    bigValue={c.bigValue}
                    miniStats={[]}
                    accent={c.accent}
                    actions={<div style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>Till now</div>}
                  />
                ))}
              </div>

              <div className="ptd-row">
                <div className="ptd-col ptd-col--wide">
                  <RaisedEachMonthChart
                    title="Date-wise Donations"
                    data={timeseriesChart}
                    height={320}
                    showDownload={true}
                    downloadFileName="template-date-wise"
                  />
                </div>
                <div className="ptd-col">
                  <DoughnutChart
                    title="Donation Mix"
                    data={mixData}
                    height={320}
                    showDownload={true}
                    downloadFileName="template-mix"
                  />
                </div>
              </div>

              <div className="ptd-table">
                <h2 className="ptd-table__title">Daily Report</h2>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        {templates.map((t) => (
                          <th key={t.id} className="hide-on-mobile">
                            {t.name}
                          </th>
                        ))}
                        <th>Total Donations</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyTable.slice(0, 31).map((r) => (
                        <tr key={r.date}>
                          <td>{r.date}</td>
                          {r.cols.map((c) => (
                            <td key={c.template_id} className="hide-on-mobile">
                              {Number(c.units || 0).toLocaleString()}
                            </td>
                          ))}
                          <td style={{ fontWeight: 700 }}>{Number(r.total || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ padding: 20 }}>
              Select a workflow template to view the report.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

