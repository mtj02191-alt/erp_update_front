import React from 'react';
import { FiGrid, FiList } from 'react-icons/fi';
import './TaskViewModeSwitch.css';

export default function TaskViewModeSwitch({ value = 'kanban', onChange }) {
  return (
    <div className="task-view-mode-switch" role="group" aria-label="Task view mode">
      <button
        type="button"
        className={`task-view-mode-switch__btn ${value === 'list' ? 'task-view-mode-switch__btn--active' : ''}`}
        onClick={() => onChange?.('list')}
        aria-pressed={value === 'list'}
      >
        <FiList />
        <span>List</span>
      </button>
      <button
        type="button"
        className={`task-view-mode-switch__btn ${value === 'kanban' ? 'task-view-mode-switch__btn--active' : ''}`}
        onClick={() => onChange?.('kanban')}
        aria-pressed={value === 'kanban'}
      >
        <FiGrid />
        <span>Kanban</span>
      </button>
    </div>
  );
}
