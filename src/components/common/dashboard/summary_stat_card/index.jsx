import React from 'react';
import '../../../../styles/variables.css';
import './SummaryStatCard.css';

function formatValue(v) {
  if (v == null || v === '') return '—';
  if (typeof v === 'number') return v.toLocaleString();
  return String(v);
}

/**
 * Image-style dashboard card: big total + 2x2 mini stats.
 *
 * @param {object} props
 * @param {React.ComponentType<any>} props.icon
 * @param {string} props.title
 * @param {number|string} props.bigValue
 * @param {Array<{ label: string, value: number|string }>} props.miniStats - ideally length 4
 * @param {{ bg?: string, fg?: string }} [props.accent]
 * @param {() => void} [props.detailOnClick] — main card opens detail; keep `actions` (e.g. calendar) outside the trigger button
 * @param {boolean} [props.detailDisabled]
 */
export default function SummaryStatCard({
  icon: Icon,
  title,
  bigValue,
  miniStats,
  accent,
  actions,
  detailOnClick,
  detailDisabled,
}) {
  const bg = accent?.bg || '#e2e8f0';
  const fg = accent?.fg || '#1e293b';
  const stats = Array.isArray(miniStats) ? miniStats : [];

  const topRow = (
    <div className="summary-stat-card__top">
      <div className="summary-stat-card__icon" style={{ ['--ssc-icon-bg']: bg, ['--ssc-icon-fg']: fg }}>
        {Icon ? <Icon aria-hidden /> : null}
      </div>
      {!detailOnClick ? (
        <div className="summary-stat-card__right">
          <p className="summary-stat-card__big" aria-label={`${title} total ${formatValue(bigValue)}`}>
            {formatValue(bigValue)}
          </p>
          {actions ? <div>{actions}</div> : null}
        </div>
      ) : (
        <p className="summary-stat-card__big" aria-label={`${title} total ${formatValue(bigValue)}`}>
          {formatValue(bigValue)}
        </p>
      )}
    </div>
  );

  const body = (
    <>
      {topRow}
      <h3 className="summary-stat-card__title">{title}</h3>
      <hr className="summary-stat-card__divider" />
      <div className="summary-stat-card__grid">
        {stats.map((s) => (
          <div key={s.label} className="summary-stat-card__mini">
            <span className="summary-stat-card__mini-label">{s.label}</span>
            <span className="summary-stat-card__mini-value">{formatValue(s.value)}</span>
          </div>
        ))}
      </div>
    </>
  );

  if (detailOnClick) {
    return (
      <div className={`summary-stat-card-shell${actions ? ' summary-stat-card-shell--has-actions' : ''}`}>
        <button
          type="button"
          className="summary-stat-card summary-stat-card--detail-trigger"
          onClick={detailOnClick}
          disabled={detailDisabled}
          aria-label={`Open ${title} details`}
        >
          {body}
        </button>
        {actions ? <div className="summary-stat-card-shell__pin-actions">{actions}</div> : null}
      </div>
    );
  }

  return <section className="summary-stat-card">{body}</section>;
}

