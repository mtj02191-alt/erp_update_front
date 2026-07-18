import React, { useEffect, useId, useMemo, useState } from 'react';
import { FiBox } from 'react-icons/fi';

import '../../../../styles/variables.css';
import './StoreReportCard.css';

import axiosInstance from '../../../../utils/axios';
import {
  fetchStoreDailyMonthSum,
  getCalendarMonthRangeYmd,
} from '../../../../utils/newDashboardMonthlySumsApi';
import Modal from '../../Modal';

function formatCount(n) {
  return typeof n === 'number' ? n.toLocaleString() : n;
}

function formatRangeLabel(from, to) {
  if (!from || !to) return '';
  if (from === to) return from;
  return `${from} → ${to}`;
}

export default function StoreReportCard({
  title = 'Store — This month',
  subtitle,
  className = '',
  /** Optional YYYY-MM-DD override; defaults to current calendar month */
  rangeFrom,
  rangeTo,
}) {
  const headingId = useId();
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [monthSum, setMonthSum] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setFetchError(null);
        const { from: defFrom, to: defTo } = getCalendarMonthRangeYmd();
        const from = rangeFrom || defFrom;
        const to = rangeTo || defTo;
        const data = await fetchStoreDailyMonthSum({
          client: axiosInstance,
          from,
          to,
        });
        if (!cancelled) setMonthSum(data);
      } catch (err) {
        if (!cancelled) {
          setMonthSum(null);
          setFetchError(err?.response?.data?.message || err?.message || 'Failed to load store month sum');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rangeFrom, rangeTo]);

  const defaultSubtitle =
    subtitle ??
    (loading
      ? 'Loading…'
      : monthSum
        ? formatRangeLabel(monthSum.from, monthSum.to)
        : 'No data for this range');

  const modalDetails = useMemo(() => {
    if (!monthSum) return null;
    return {
      Period: formatRangeLabel(monthSum.from, monthSum.to),
      'Demands (generated)': formatCount(monthSum.generated_demands),
      'Demands (pending)': formatCount(monthSum.pending_demands),
      'Demands (rejected)': formatCount(monthSum.rejected_demands),
      'GRN (generated)': formatCount(monthSum.generated_grn),
      'GRN (pending)': formatCount(monthSum.pending_grn),
    };
  }, [monthSum]);

  return (
    <section className={`store-report-card ${className}`.trim()} aria-labelledby={headingId}>
      <header className="store-report-card__header">
        <div>
          <h2 id={headingId} className="store-report-card__title">
            {title}
          </h2>
          <p className="store-report-card__subtitle">{defaultSubtitle}</p>
          {fetchError && (
            <p className="store-report-card__fetch-warning" role="status">
              {fetchError}
            </p>
          )}
        </div>
      </header>

      <button
        type="button"
        className="store-report-card__body"
        onClick={() => setOpen(true)}
        disabled={!monthSum}
        aria-label={monthSum ? 'Open store month totals' : 'No store data for this period'}
      >
        <div className="store-report-card__top">
          <div className="store-report-card__identity">
            <span className="store-report-card__icon-wrap">
              <FiBox aria-hidden />
            </span>
            <h3 className="store-report-card__name">Month totals</h3>
          </div>
          <div className="store-report-card__date">{formatRangeLabel(monthSum?.from, monthSum?.to) || '—'}</div>
        </div>

        <div className="store-report-card__grid">
          <div className="store-report-card__stat">
            <span className="store-report-card__stat-label">Demands gen.</span>
            <span className="store-report-card__stat-value">{formatCount(monthSum?.generated_demands ?? 0)}</span>
          </div>
          <div className="store-report-card__stat">
            <span className="store-report-card__stat-label">Demands pend.</span>
            <span className="store-report-card__stat-value">{formatCount(monthSum?.pending_demands ?? 0)}</span>
          </div>
          <div className="store-report-card__stat">
            <span className="store-report-card__stat-label">Demands rej.</span>
            <span className="store-report-card__stat-value">{formatCount(monthSum?.rejected_demands ?? 0)}</span>
          </div>
          <div className="store-report-card__stat">
            <span className="store-report-card__stat-label">GRN gen.</span>
            <span className="store-report-card__stat-value">{formatCount(monthSum?.generated_grn ?? 0)}</span>
          </div>
          <div className="store-report-card__stat">
            <span className="store-report-card__stat-label">GRN pend.</span>
            <span className="store-report-card__stat-value">{formatCount(monthSum?.pending_grn ?? 0)}</span>
          </div>
        </div>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={
          monthSum?.from && monthSum?.to
            ? `Store — ${formatRangeLabel(monthSum.from, monthSum.to)}`
            : 'Store — Month totals'
        }
        details={modalDetails}
      />
    </section>
  );
}
