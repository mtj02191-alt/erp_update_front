export const COMPLAINT_WORKFLOW_STATUSES = [
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'investigating', label: 'Investigating' },
  { value: 'pending_information', label: 'Pending Information' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed_rejected', label: 'Closed / Rejected' },
];

/** Legacy values stored before workflow upgrade (display-only fallback). */
const LEGACY_STATUS_LABELS = {
  submitted: 'Acknowledged',
  under_investigation: 'Investigating',
  dismissed: 'Closed / Rejected',
  closed: 'Closed / Rejected',
};

export const BOARD_COLUMNS = COMPLAINT_WORKFLOW_STATUSES.map((status) => ({
  key: status.value,
  label: status.label,
  status: status.value,
}));

export const ACTIVE_WORKFLOW_STATUSES = [
  'acknowledged',
  'under_review',
  'investigating',
  'pending_information',
  'escalated',
];

export const COMPLAINT_CATEGORIES = [
  { value: 'harassment', label: 'Harassment' },
  { value: 'misconduct', label: 'Misconduct' },
  { value: 'corruption', label: 'Corruption' },
  { value: 'discrimination', label: 'Discrimination' },
  { value: 'negligence', label: 'Negligence' },
  { value: 'service_failure', label: 'Service Failure' },
  { value: 'behavior', label: 'Behavior / Conduct' },
  { value: 'workplace_safety', label: 'Workplace Safety' },
  { value: 'fraud', label: 'Fraud' },
  { value: 'other', label: 'Other (custom)' },
];

export const DEPARTMENT_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'program', label: 'Program' },
  { value: 'store', label: 'Store' },
  { value: 'procurements', label: 'Procurements' },
  { value: 'accounts_and_finance', label: 'Accounts & Finance' },
  { value: 'fund_raising', label: 'Fund Raising' },
  { value: 'it', label: 'IT' },
  { value: 'hr', label: 'HR' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'audio_video', label: 'Audio Video' },
  { value: 'meal', label: 'Meal' },
  { value: 'health', label: 'Health' },
  { value: 'ceo_office', label: 'CEO Office' },
];

export function getCategoryLabel(value, custom) {
  if (!value) return '—';
  if (value === 'other' && custom) return custom;
  return COMPLAINT_CATEGORIES.find((c) => c.value === value)?.label || value;
}

export function getStatusLabel(value) {
  return (
    COMPLAINT_WORKFLOW_STATUSES.find((s) => s.value === value)?.label ||
    LEGACY_STATUS_LABELS[value] ||
    value
  );
}

export function getDepartmentLabel(value) {
  return DEPARTMENT_OPTIONS.find((d) => d.value === value)?.label || value || '—';
}

export function formatComplaintCode(code) {
  return String(code || '').trim().toUpperCase();
}
