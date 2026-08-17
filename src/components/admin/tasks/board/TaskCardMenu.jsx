import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FiChevronRight,
  FiCornerDownRight,
  FiDroplet,
  FiEdit2,
  FiEye,
  FiMoreVertical,
  FiTrash2,
} from 'react-icons/fi';
import { BOARD_COLUMNS, CARD_COLOR_OPTIONS } from './taskBoardConfig';

const VIEWPORT_PADDING = 8;
const MENU_GAP = 4;

export default function TaskCardMenu({
  task,
  open,
  submenu,
  onToggle,
  onSubmenu,
  onClose,
  onView,
  onEdit,
  onDelete,
  onMoveTo,
  onColorChange,
  canView,
  canEdit,
  canDelete,
  canMove,
}) {
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState(null);

  const updateDropdownPosition = useCallback(() => {
    const trigger = triggerRef.current;
    const dropdown = dropdownRef.current;
    if (!trigger || !dropdown) return;

    const rect = trigger.getBoundingClientRect();
    const dropdownHeight = dropdown.offsetHeight;
    const dropdownWidth = dropdown.offsetWidth;

    let top = rect.bottom + MENU_GAP;
    let left = rect.right - dropdownWidth;

    if (top + dropdownHeight > window.innerHeight - VIEWPORT_PADDING) {
      top = rect.top - dropdownHeight - MENU_GAP;
    }

    left = Math.max(
      VIEWPORT_PADDING,
      Math.min(left, window.innerWidth - dropdownWidth - VIEWPORT_PADDING),
    );
    top = Math.max(
      VIEWPORT_PADDING,
      Math.min(top, window.innerHeight - dropdownHeight - VIEWPORT_PADDING),
    );

    setDropdownStyle({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setDropdownStyle(null);
      return undefined;
    }

    updateDropdownPosition();
    return undefined;
  }, [open, submenu, updateDropdownPosition]);

  useEffect(() => {
    if (!open) return undefined;

    const handleOutside = (e) => {
      const target = e.target;
      if (
        menuRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }
      onClose();
    };

    const handleReposition = () => updateDropdownPosition();

    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [open, onClose, updateDropdownPosition]);

  const currentStatus = String(task?.status || 'open').toLowerCase();
  const moveTargets = BOARD_COLUMNS.filter((col) => col.id !== currentStatus);

  const dropdown = open ? (
    <div
      ref={dropdownRef}
      className="trello-card-menu-dropdown trello-card-menu-dropdown--portal"
      style={
        dropdownStyle
          ? { top: `${dropdownStyle.top}px`, left: `${dropdownStyle.left}px` }
          : { visibility: 'hidden' }
      }
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className={`trello-card-menu-item ${submenu === 'color' ? 'trello-card-menu-item--active' : ''}`}
        onClick={() => onSubmenu(submenu === 'color' ? null : 'color')}
      >
        <FiDroplet />
        <span>Change Color</span>
        <FiChevronRight className="trello-card-menu-chevron" />
      </button>
      {submenu === 'color' && (
        <div className="trello-card-menu-submenu">
          {CARD_COLOR_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className="trello-card-menu-subitem"
              onClick={() => {
                onColorChange(opt.id);
                onClose();
              }}
            >
              <span
                className="trello-card-menu-color-swatch"
                style={{ background: opt.value, borderColor: opt.border }}
              />
              {opt.label}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        className={`trello-card-menu-item ${submenu === 'move' ? 'trello-card-menu-item--active' : ''}`}
        onClick={() => onSubmenu(submenu === 'move' ? null : 'move')}
        disabled={!canMove}
      >
        <FiCornerDownRight />
        <span>Move To</span>
        <FiChevronRight className="trello-card-menu-chevron" />
      </button>
      {submenu === 'move' && (
        <div className="trello-card-menu-submenu trello-card-menu-submenu--scroll">
          {moveTargets.map((col) => (
            <button
              key={col.id}
              type="button"
              className="trello-card-menu-subitem"
              disabled={!canMove}
              onClick={() => {
                onMoveTo(col.id);
                onClose();
              }}
            >
              <span
                className="trello-board-column-dot"
                style={{ backgroundColor: col.color }}
              />
              {col.label}
            </button>
          ))}
        </div>
      )}

      <div className="trello-card-menu-divider" />

      <button
        type="button"
        className="trello-card-menu-item"
        disabled={!canView}
        onClick={() => {
          onView();
          onClose();
        }}
      >
        <FiEye />
        <span>View Task</span>
      </button>

      <button
        type="button"
        className="trello-card-menu-item"
        disabled={!canEdit}
        onClick={() => {
          onEdit();
          onClose();
        }}
      >
        <FiEdit2 />
        <span>Edit Task</span>
      </button>

      <div className="trello-card-menu-divider" />

      <button
        type="button"
        className="trello-card-menu-item trello-card-menu-item--danger"
        disabled={!canDelete}
        onClick={() => {
          onDelete();
          onClose();
        }}
      >
        <FiTrash2 />
        <span>Delete Task</span>
      </button>
    </div>
  ) : null;

  return (
    <div className="trello-card-menu" ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <button
        ref={triggerRef}
        type="button"
        className="trello-card-menu-trigger"
        aria-label="Task actions"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        <FiMoreVertical />
      </button>

      {dropdown && createPortal(dropdown, document.body)}
    </div>
  );
}
