import React, { useEffect, useId, useMemo, useState } from 'react';
import { FiShoppingCart } from 'react-icons/fi';

import '../../../../styles/variables.css';
import './ProcurementsReportCard.css';

import axiosInstance from '../../../../utils/axios';
import { fetchLatestProcurementsDailyReport } from '../../../../utils/procurementsOverviewApi';
import Modal from '../../Modal';

function formatCount(n) {
  return typeof n === 'number' ? n.toLocaleString() : n;
}

function formatMoney(n) {
  const v = Number(n) || 0;
  return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ProcurementsReportCard({
  title = 'Procurements — Daily report (latest)',
  subtitle,
  className = '',
}) {
  const headingId = useId();
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [latest, setLatest] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setFetchError(null);
        const data = await fetchLatestProcurementsDailyReport({ client: axiosInstance });
        if (!cancelled) setLatest(data);
      } catch (err) {
        if (!cancelled) {
          setLatest(null);
          setFetchError(err?.message || 'Failed to load procurements report');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const defaultSubtitle =
    subtitle ??
    (loading ? 'Loading…' : latest?.date ? `Date: ${latest.date}` : 'No report found');

  const modalDetails = useMemo(() => {
    if (!latest) return null;
    return {
      Date: latest.date || '—',
      'POs (generated)': formatCount(latest.total_generated_pos),
      'POs (pending)': formatCount(latest.pending_pos),
      'POs (fulfilled)': formatCount(latest.fulfilled_pos),
      'PIs (generated)': formatCount(latest.total_generated_pis),
      'PIs (unpaid)': formatCount(latest.unpaid_pis),
      'Amount (paid)': formatMoney(latest.total_paid_amount),
      'Amount (unpaid)': formatMoney(latest.unpaid_amount),
      Tenders: formatCount(latest.tenders),
    };
  }, [latest]);

  return (
    <section className={`procurements-report-card ${className}`.trim()} aria-labelledby={headingId}>
      <header className="procurements-report-card__header">
        <div>
          <h2 id={headingId} className="procurements-report-card__title">
            {title}
          </h2>
          <p className="procurements-report-card__subtitle">{defaultSubtitle}</p>
          {fetchError && (
            <p className="procurements-report-card__fetch-warning" role="status">
              {fetchError}
            </p>
          )}
        </div>
      </header>

      <button
        type="button"
        className="procurements-report-card__body"
        onClick={() => setOpen(true)}
        disabled={!latest}
        aria-label={latest ? 'Open procurements report details' : 'No procurements report available'}
      >
        <div className="procurements-report-card__top">
          <div className="procurements-report-card__identity">
            <span className="procurements-report-card__icon-wrap">
              <FiShoppingCart aria-hidden />
            </span>
            <h3 className="procurements-report-card__name">Daily snapshot</h3>
          </div>
          <div className="procurements-report-card__date">{latest?.date || '—'}</div>
        </div>

        <div className="procurements-report-card__grid">
          <div className="procurements-report-card__stat">
            <span className="procurements-report-card__stat-label">PO gen.</span>
            <span className="procurements-report-card__stat-value">{formatCount(latest?.total_generated_pos ?? 0)}</span>
          </div>
          <div className="procurements-report-card__stat">
            <span className="procurements-report-card__stat-label">PO pend.</span>
            <span className="procurements-report-card__stat-value">{formatCount(latest?.pending_pos ?? 0)}</span>
          </div>
          <div className="procurements-report-card__stat">
            <span className="procurements-report-card__stat-label">PO fulf.</span>
            <span className="procurements-report-card__stat-value">{formatCount(latest?.fulfilled_pos ?? 0)}</span>
          </div>
          <div className="procurements-report-card__stat">
            <span className="procurements-report-card__stat-label">Paid</span>
            <span className="procurements-report-card__stat-value">{formatMoney(latest?.total_paid_amount ?? 0)}</span>
          </div>
          <div className="procurements-report-card__stat">
            <span className="procurements-report-card__stat-label">Unpaid</span>
            <span className="procurements-report-card__stat-value">{formatMoney(latest?.unpaid_amount ?? 0)}</span>
          </div>
        </div>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={latest?.date ? `Procurements report — ${latest.date}` : 'Procurements report'}
        details={modalDetails}
      />
    </section>
  );
}

