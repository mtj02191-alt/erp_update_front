import React, { useEffect } from 'react';
import './DateRangePopup.css';

export default function DateRangePopup({
  open,
  title = 'Select date range',
  from,
  to,
  onChangeFrom,
  onChangeTo,
  applyToAll,
  onToggleApplyToAll,
  onApply,
  onClose,
  disabled,
  showApplyToAll = true,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="date-range-popup-overlay" role="dialog" aria-modal="true" aria-label={title} onMouseDown={onClose}>
      <div className="date-range-popup" onMouseDown={(e) => e.stopPropagation()}>
        <div className="date-range-popup__header">
          <h3 className="date-range-popup__title">{title}</h3>
          <button type="button" className="date-range-popup__close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="date-range-popup__body">
          <div className="date-range-popup__grid">
            <div className="date-range-popup__field">
              <label>From</label>
              <input type="date" value={from || ''} onChange={(e) => onChangeFrom?.(e.target.value)} />
            </div>
            <div className="date-range-popup__field">
              <label>To</label>
              <input type="date" value={to || ''} onChange={(e) => onChangeTo?.(e.target.value)} />
            </div>
          </div>

          {showApplyToAll ? (
            <label className="date-range-popup__apply-all">
              <input
                type="checkbox"
                checked={!!applyToAll}
                onChange={(e) => onToggleApplyToAll?.(e.target.checked)}
              />
              Apply to all cards
            </label>
          ) : null}
        </div>

        <div className="date-range-popup__footer">
          <button type="button" className="date-range-popup__btn" onClick={onClose} disabled={disabled}>
            Cancel
          </button>
          <button type="button" className="date-range-popup__btn date-range-popup__btn--primary" onClick={onApply} disabled={disabled}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

