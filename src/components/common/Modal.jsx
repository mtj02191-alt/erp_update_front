import React, { useId } from 'react';
import './Modal.css';

function formatModalValue(value) {
  if (value == null || value === '') return '—';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function KeyValueList({ entries }) {
  return (
    <ul className="custom-modal-kv-list">
      {entries.map(([key, value]) => (
        <li key={key}>
          <span className="custom-modal-kv-key">{key}:</span>{' '}
          <strong className="custom-modal-kv-value">{formatModalValue(value)}</strong>
        </li>
      ))}
    </ul>
  );
}

/**
 * Generic overlay dialog: single flat `details` **or** grouped `sections`.
 *
 * **Backward compatible:** existing callers pass only `open`, `onClose`, `title`, `details` — unchanged.
 *
 * **Structured layout:** pass `sections` as a non-empty array of `{ title?, details }`.
 * When `sections` is provided and has length > 0, each item renders an optional sub-heading
 * (`title`) and a key-value list from `details`. The top-level `details` prop is ignored in
 * that case (use sections only, or omit `sections` to keep using flat `details`).
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {string} [props.title]
 * @param {Record<string, unknown>|null} [props.details] — flat key-value map (default mode)
 * @param {Array<{ title?: string; details?: Record<string, unknown> }>} [props.sections] — grouped mode
 */
const Modal = ({ open, onClose, details, title, sections }) => {
  const titleId = useId();

  if (!open) return null;

  const useSections = Array.isArray(sections) && sections.length > 0;

  const flatEntries =
    details && typeof details === 'object' && !Array.isArray(details)
      ? Object.entries(details)
      : [];

  let bodyContent;

  if (useSections) {
    const blocks = sections
      .map((section, idx) => {
        if (!section || typeof section !== 'object') return null;
        const rowDetails = section.details;
        const entries =
          rowDetails && typeof rowDetails === 'object' && !Array.isArray(rowDetails)
            ? Object.entries(rowDetails)
            : [];
        const subTitle = section.title;
        if (!subTitle && entries.length === 0) return null;
        return (
          <div key={idx} className="custom-modal-section">
            {subTitle ? <h3 className="custom-modal-section-title">{subTitle}</h3> : null}
            {entries.length > 0 ? (
              <KeyValueList entries={entries} />
            ) : (
              <p className="custom-modal-section-empty">No details for this section.</p>
            )}
          </div>
        );
      })
      .filter(Boolean);

    bodyContent =
      blocks.length > 0 ? (
        <div className="custom-modal-body custom-modal-body--sections">{blocks}</div>
      ) : (
        <div className="custom-modal-details">
          <p>No details available.</p>
        </div>
      );
  } else if (flatEntries.length > 0) {
    bodyContent = (
      <div className="custom-modal-details">
        <KeyValueList entries={flatEntries} />
      </div>
    );
  } else {
    bodyContent = (
      <div className="custom-modal-details">
        <p>No details available.</p>
      </div>
    );
  }

  return (
    <div className="custom-modal-overlay">
      <div
        className="custom-modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button
          type="button"
          className="custom-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 id={titleId}>{title || 'Details'} : </h2>
        {bodyContent}
      </div>
    </div>
  );
};

export default Modal;
