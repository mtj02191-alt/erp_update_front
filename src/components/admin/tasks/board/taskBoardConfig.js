export const BOARD_COLUMNS = [
  { id: 'open', label: 'Open', color: '#3b82f6' },
  { id: 'in_progress', label: 'In Progress', color: '#f59e0b' },
  { id: 'blocked', label: 'Blocked', color: '#ef4444' },
  { id: 'pending_approval', label: 'Pending Approval', color: '#8b5cf6' },
  { id: 'approved', label: 'Approved', color: '#10b981' },
  { id: 'rejected', label: 'Rejected', color: '#dc2626' },
  { id: 'completed', label: 'Completed', color: '#22c55e' },
  { id: 'closed', label: 'Closed', color: '#6b7280' },
  { id: 'cancelled', label: 'Cancelled', color: '#9ca3af' },
];

export const BOARD_COLUMN_IDS = new Set(BOARD_COLUMNS.map((c) => c.id));

export const CARD_COLOR_OPTIONS = [
  { id: 'default', label: 'Default', value: '#ffffff', border: '#e2e8f0' },
  { id: 'blue', label: 'Blue', value: '#eff6ff', border: '#93c5fd' },
  { id: 'green', label: 'Green', value: '#f0fdf4', border: '#86efac' },
  { id: 'yellow', label: 'Yellow', value: '#fefce8', border: '#fde047' },
  { id: 'orange', label: 'Orange', value: '#fff7ed', border: '#fdba74' },
  { id: 'red', label: 'Red', value: '#fef2f2', border: '#fca5a5' },
  { id: 'purple', label: 'Purple', value: '#faf5ff', border: '#d8b4fe' },
  { id: 'gray', label: 'Gray', value: '#f8fafc', border: '#cbd5e1' },
];

export const CARD_COLORS_STORAGE_KEY = 'task-board-card-colors';

export const VISIBLE_COLUMNS_STORAGE_KEY = 'task-board-visible-columns';

export const DEFAULT_VISIBLE_COLUMN_IDS = BOARD_COLUMNS.map((c) => c.id);

export function getVisibleColumnsStorageKey(userId) {
  return userId ? `${VISIBLE_COLUMNS_STORAGE_KEY}-${userId}` : VISIBLE_COLUMNS_STORAGE_KEY;
}

export function loadVisibleColumnIds(userId) {
  try {
    const raw = localStorage.getItem(getVisibleColumnsStorageKey(userId));
    if (!raw) return new Set(DEFAULT_VISIBLE_COLUMN_IDS);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return new Set(DEFAULT_VISIBLE_COLUMN_IDS);
    }
    const valid = parsed.filter((id) => BOARD_COLUMN_IDS.has(id));
    return valid.length > 0 ? new Set(valid) : new Set(DEFAULT_VISIBLE_COLUMN_IDS);
  } catch {
    return new Set(DEFAULT_VISIBLE_COLUMN_IDS);
  }
}

export function saveVisibleColumnIds(userId, columnIds) {
  const ids = Array.from(columnIds).filter((id) => BOARD_COLUMN_IDS.has(id));
  if (ids.length === 0) return;
  localStorage.setItem(getVisibleColumnsStorageKey(userId), JSON.stringify(ids));
}

