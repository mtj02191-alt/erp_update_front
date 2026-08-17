import { hasPermission } from '../../../../utils/permissions';

export const ACTIVITY_TYPE_OPTIONS = [
  { value: 'call', label: 'Call' },
  { value: 'whatsapp', label: 'WhatsApp Message' },
  { value: 'email', label: 'Email' },
  { value: 'visit', label: 'Physical Visit' },
  { value: 'meeting', label: 'Office Meeting' },
  { value: 'dinner_invitation', label: 'Dinner Invitation' },
  { value: 'event_invitation', label: 'Event Invitation' },
  { value: 'proposal_shared', label: 'Proposal Shared' },
  { value: 'thank_you', label: 'Thank You Message' },
  { value: 'donation_request', label: 'Donation Request' },
  { value: 'pledge_followup', label: 'Pledge Follow-up' },
  { value: 'relationship_building', label: 'Relationship Building' },
  { value: 'custom', label: 'Custom Activity' },
];

export const RESPONSE_TYPE_OPTIONS = [
  { value: '', label: '—' },
  { value: 'positive', label: 'Positive' },
  { value: 'interested', label: 'Interested' },
  { value: 'need_details', label: 'Need Details' },
  { value: 'busy', label: 'Busy' },
  { value: 'committed', label: 'Committed' },
  { value: 'not_responding', label: 'Not Responding' },
  { value: 'refused', label: 'Refused' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'negative', label: 'Negative' },
];

export const INTERACTION_STATUS_OPTIONS = [
  { value: 'need_followup', label: 'Need Follow-up' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'no_response', label: 'No Response' },
  { value: 'rescheduled', label: 'Rescheduled' },
  { value: 'closed', label: 'Closed' },
];

export const formatActivityType = (value) =>
  ACTIVITY_TYPE_OPTIONS.find((o) => o.value === value)?.label ||
  String(value || '').replace(/_/g, ' ');

export const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
};

export const toDatetimeLocalValue = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const isInteractionLocked = (item) =>
  ['completed', 'closed'].includes(item?.status) || item?.has_completed_followup === true;

export const canMutateInteraction = (permissions, item) => {
  const isSuperAdmin = permissions?.super_admin === true;
  const canUpdate =
    isSuperAdmin || hasPermission(permissions, 'fund_raising', 'donor_relationship', 'update');
  const canDelete =
    isSuperAdmin || hasPermission(permissions, 'fund_raising', 'donor_relationship', 'delete');
  const locked = isInteractionLocked(item);

  return {
    canEdit: canUpdate && (!locked || isSuperAdmin),
    canDelete: canDelete && (!locked || isSuperAdmin),
    locked,
  };
};

export const canMutateFollowup = (permissions, item) => {
  const isSuperAdmin = permissions?.super_admin === true;
  const canUpdate =
    isSuperAdmin || hasPermission(permissions, 'fund_raising', 'donor_relationship', 'update');
  const locked = item?.status === 'completed';

  return {
    canEdit: canUpdate && (!locked || isSuperAdmin),
    locked,
  };
};
