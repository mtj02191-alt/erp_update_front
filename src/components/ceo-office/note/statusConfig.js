export const emailApprovalStatuses = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'request_clarification', label: 'Request Clarification' },
];

export const waitingResponseStatuses = [
  { value: 'waiting_response', label: 'Waiting Response' },
  { value: 'reminder_sent', label: 'Reminder Sent' },
  { value: 'received', label: 'Received' },
  { value: 'closed', label: 'Closed' },
];

export const projectCommandSheetStatuses = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
];

export const visitorsStatuses = [
  { value: 'pending', label: 'Pending' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const callsStatuses = [
  { value: 'pending', label: 'Pending' },
  { value: 'follow_up_required', label: 'Follow-up Required' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const whatsappStatuses = [
  { value: 'pending_reply', label: 'Pending Reply' },
  { value: 'replied', label: 'Replied' },
  { value: 'waiting_response', label: 'Waiting Response' },
  { value: 'closed', label: 'Closed' },
];

export const meetingStatuses = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

export const genericStatuses = [
  { value: 'unprocessed', label: 'Unprocessed' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_response', label: 'Waiting Response' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'completed', label: 'Completed' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const ALL_STATUSES_BY_CATEGORY = {
  emails_and_approvals: emailApprovalStatuses,
  waiting_response: waitingResponseStatuses,
  project_command_sheets: projectCommandSheetStatuses,
  visitors: visitorsStatuses,
  calls: callsStatuses,
  whatsapp: whatsappStatuses,
  meetings: meetingStatuses,
};

const canonicalizeValue = (raw) =>
  (raw || '').toString().trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

const LABEL_TO_VALUE_GLOBAL = (() => {
  const map = new Map();
  const register = (val, label) => {
    map.set(canonicalizeValue(val), val);
    map.set(canonicalizeValue(label), val);
  };
  for (const list of Object.values(ALL_STATUSES_BY_CATEGORY)) {
    for (const { value, label } of list) {
      register(value, label);
    }
  }
  for (const { value, label } of genericStatuses) {
    register(value, label);
  }
  return map;
})();

/**
 * Normalizes a possibly-label-formatted status string (e.g. "Pending", "On Hold",
 * "In Progress") into its canonical snake_case enum value (e.g. "pending",
 * "on_hold", "in_progress").
 *
 * If the value is not recognized, the original raw value is returned as-is.
 *
 * Works for every category (emails, waiting_response, pcs, visitors, calls,
 * whatsapp, meetings) and also handles legacy rows stored with label-style
 * strings in their `status` column.
 */
export const normalizeStatusValue = (rawStatus) => {
  if (rawStatus === null || rawStatus === undefined || rawStatus === '') return rawStatus;
  const key = canonicalizeValue(rawStatus);
  if (LABEL_TO_VALUE_GLOBAL.has(key)) {
    return LABEL_TO_VALUE_GLOBAL.get(key);
  }
  // Fallthrough: return original
  return rawStatus;
};

export const getStatusesForCategory = (category) => {
  switch (category) {
    case 'emails_and_approvals':
      return emailApprovalStatuses;
    case 'waiting_response':
      return waitingResponseStatuses;
    case 'project_command_sheets':
      return projectCommandSheetStatuses;
    case 'visitors':
      return visitorsStatuses;
    case 'calls':
      return callsStatuses;
    case 'whatsapp':
      return whatsappStatuses;
    case 'meetings':
      return meetingStatuses;
    default:
      return genericStatuses;
  }
};

export const getDefaultStatusForCategory = (category) => {
  switch (category) {
    case 'emails_and_approvals':
      return 'pending';
    case 'waiting_response':
      return 'waiting_response';
    case 'project_command_sheets':
      return 'pending';
    case 'visitors':
      return 'pending';
    case 'calls':
      return 'pending';
    case 'whatsapp':
      return 'pending_reply';
    case 'meetings':
      return 'pending';
    default:
      return '';
  }
};

export const getStatusLabel = (status) => {
  const canonical = normalizeStatusValue(status);
  const labels = {
    unprocessed: 'Unprocessed',
    pending: 'Pending',
    in_progress: 'In Progress',
    waiting_response: 'Waiting Response',
    reminder_sent: 'Reminder Sent',
    received: 'Received',
    pending_reply: 'Pending Reply',
    follow_up_required: 'Follow-up Required',
    submitted: 'Submitted',
    approved: 'Approved',
    rejected: 'Rejected',
    completed: 'Completed',
    closed: 'Closed',
    cancelled: 'Cancelled',
    request_clarification: 'Request Clarification',
    on_hold: 'On Hold',
    waiting: 'Waiting',
    replied: 'Replied',
  };
  if (labels[canonical]) return labels[canonical];
  return status?.toString().replace(/_/g, ' ') || '';
};

export const getStatusBadgeClass = (status) => {
  const canonical = normalizeStatusValue(status);
  const classes = {
    unprocessed: 'note-view-status-unprocessed',
    pending: 'note-view-status-pending',
    in_progress: 'note-view-status-in_progress',
    waiting_response: 'note-view-status-waiting_response',
    reminder_sent: 'note-view-status-warning',
    received: 'note-view-status-info',
    pending_reply: 'note-view-status-pending',
    follow_up_required: 'note-view-status-warning',
    submitted: 'note-view-status-submitted',
    approved: 'note-view-status-approved',
    rejected: 'note-view-status-rejected',
    request_clarification: 'note-view-status-warning',
    completed: 'note-view-status-completed',
    closed: 'note-view-status-closed',
    cancelled: 'note-view-status-cancelled',
    on_hold: 'note-view-status-on_hold',
    waiting: 'note-view-status-waiting',
    replied: 'note-view-status-info',
  };
  return classes[canonical] || 'note-view-status-pending';
};
