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
  };
  return labels[status] || status?.replace(/_/g, ' ') || '';
};

export const getStatusBadgeClass = (status) => {
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
  };
  return classes[status] || 'note-view-status-pending';
};
