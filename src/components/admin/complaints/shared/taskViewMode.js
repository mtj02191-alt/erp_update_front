export const TASKS_VIEW_MODE_KEY = 'tasks-view-mode-v2';
const LEGACY_TASKS_VIEW_MODE_KEY = 'tasks-view-mode';

export function loadTasksViewMode() {
  try {
    const value = localStorage.getItem(TASKS_VIEW_MODE_KEY);
    if (value === 'list' || value === 'kanban') return value;

    // New default is kanban; drop legacy saved preference once.
    localStorage.removeItem(LEGACY_TASKS_VIEW_MODE_KEY);
    return 'kanban';
  } catch {
    return 'kanban';
  }
}

export function saveTasksViewMode(mode) {
  if (mode !== 'list' && mode !== 'kanban') return;
  try {
    localStorage.setItem(TASKS_VIEW_MODE_KEY, mode);
  } catch {
    // ignore storage errors
  }
}
