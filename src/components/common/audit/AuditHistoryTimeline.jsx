import React from 'react';
import './AuditHistoryTimeline.css';

/**
 * Reusable audit timeline. Pass `entries` from API or use `children` for custom layout.
 */
const AuditHistoryTimeline = ({
  entries = [],
  loading = false,
  error = '',
  emptyMessage = 'No change history yet.',
  getActionLabel = (action) => action,
  getSourceLabel = (source) => source,
  getFieldLabel = (field) => field,
  formatActor = (user) => (user ? `User #${user.id}` : 'System'),
  formatValue = (v) => (v == null || v === '' ? '—' : String(v)),
  renderEntryExtra = null,
}) => {
  if (loading) {
    return <p className="audit-timeline__muted">Loading change history…</p>;
  }

  if (error) {
    return (
      <div className="status-message status-message--error" style={{ marginTop: 0 }}>
        {error}
      </div>
    );
  }

  if (!entries.length) {
    return <p className="audit-timeline__muted">{emptyMessage}</p>;
  }

  return (
    <ul className="audit-timeline">
      {entries.map((entry) => (
        <li key={entry.id} className="audit-timeline__item">
          <div className="audit-timeline__header">
            <span className="audit-timeline__action">{getActionLabel(entry.action)}</span>
            <span className="audit-timeline__meta">
              {formatActor(entry.performed_by)}
              {' · '}
              {getSourceLabel(entry.source)}
              {' · '}
              {entry.created_at
                ? new Date(entry.created_at).toLocaleString()
                : '—'}
            </span>
          </div>
          {Array.isArray(entry.changes) && entry.changes.length > 0 && (
            <ul className="audit-timeline__changes">
              {entry.changes.map((ch, idx) => (
                <li key={`${entry.id}-${ch.field}-${idx}`}>
                  <strong>{getFieldLabel(ch.field)}:</strong>{' '}
                  <span className="audit-timeline__old">{formatValue(ch.old_value)}</span>
                  {' → '}
                  <span className="audit-timeline__new">{formatValue(ch.new_value)}</span>
                </li>
              ))}
            </ul>
          )}
          {typeof renderEntryExtra === 'function' ? renderEntryExtra(entry) : null}
        </li>
      ))}
    </ul>
  );
};

export default AuditHistoryTimeline;
