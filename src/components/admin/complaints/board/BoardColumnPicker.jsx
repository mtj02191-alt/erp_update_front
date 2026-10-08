import React, { useEffect, useRef } from 'react';
import { FiChevronDown, FiEye } from 'react-icons/fi';
import { BOARD_COLUMNS } from './taskBoardConfig';

export default function BoardColumnPicker({
  open,
  onToggle,
  onClose,
  visibleColumnIds,
  columnCounts,
  onToggleColumn,
  onShowAll,
  onHideAll,
}) {
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open, onClose]);

  const visibleCount = visibleColumnIds.size;

  return (
    <div className="trello-board-column-picker" ref={pickerRef}>
      <button
        type="button"
        className={`trello-board-column-picker-trigger ${open ? 'trello-board-column-picker-trigger--open' : ''}`}
        onClick={onToggle}
        aria-expanded={open}
      >
        <FiEye />
        <span>Show/hide columns</span>
        <FiChevronDown className="trello-board-column-picker-chevron" />
      </button>

      {open && (
        <div className="trello-board-column-picker-dropdown">
          <div className="trello-board-column-picker-header">
            <span className="trello-board-column-picker-title">Visible columns</span>
            <div className="trello-board-column-picker-header-actions">
              <button type="button" onClick={onShowAll}>
                Show all
              </button>
              <span aria-hidden="true">·</span>
              <button type="button" onClick={onHideAll}>
                Hide all
              </button>
            </div>
          </div>

          <ul className="trello-board-column-picker-list">
            {BOARD_COLUMNS.map((column) => {
              const checked = visibleColumnIds.has(column.id);
              const count = columnCounts[column.id] ?? 0;
              return (
                <li key={column.id}>
                  <label className="trello-board-column-picker-item">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleColumn(column.id)}
                    />
                    <span
                      className="trello-board-column-dot"
                      style={{ backgroundColor: column.color }}
                    />
                    <span className="trello-board-column-picker-label">{column.label}</span>
                    <span className="trello-board-column-picker-count">{count}</span>
                  </label>
                </li>
              );
            })}
          </ul>

          <p className="trello-board-column-picker-footer">
            {visibleCount} of {BOARD_COLUMNS.length} columns shown
          </p>
        </div>
      )}
    </div>
  );
}
