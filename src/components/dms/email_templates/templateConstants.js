export const TEMPLATE_CHANNELS = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

export const TEMPLATE_PURPOSES = [
  { value: 'campaign', label: 'Campaign' },
  { value: 'appeal', label: 'Appeal' },
  { value: 'event', label: 'Event' },
  { value: 'general', label: 'General' },
  { value: 'recurring_reminder', label: 'Recurring reminder' },
  { value: 'thanks', label: 'Thank you' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'payment_link', label: 'Payment link' },
];

export const TEMPLATE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
];

export const TEMPLATE_VARIABLES = [
  { value: 'donor_name', label: '{{donor_name}}' },
  { value: 'amount', label: '{{amount}}' },
  { value: 'campaign_name', label: '{{campaign_name}}' },
  { value: 'appeal_name', label: '{{appeal_name}}' },
  { value: 'event_name', label: '{{event_name}}' },
  { value: 'campaign_url', label: '{{campaign_url}}' },
  { value: 'appeal_url', label: '{{appeal_url}}' },
  { value: 'event_url', label: '{{event_url}}' },
  { value: 'donation_url', label: '{{donation_url}}' },
  { value: 'cta_url', label: '{{cta_url}}' },
  { value: 'cta_button_text', label: '{{cta_button_text}}' },
  { value: 'unsubscribe_url', label: '{{unsubscribe_url}}' },
  { value: 'current_month', label: '{{current_month}}' },
];

export const CTA_BUTTON_TEXT_OPTIONS = [
  { value: 'Donate Now', label: 'Donate Now' },
  { value: 'View Event', label: 'View Event' },
  { value: 'Learn More', label: 'Learn More' },
  { value: 'Support Now', label: 'Support Now' },
  { value: 'Read More', label: 'Read More' },
];

export const toArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') return value.split(',').map((v) => v.trim()).filter(Boolean);
  return [];
};

export const firstOrNull = (arr) => (Array.isArray(arr) && arr.length ? arr[0] : null);

export const insertVariable = (text, variableKey) => {
  const token = `{{${variableKey}}}`;
  return text ? `${text}${text.endsWith(' ') ? '' : ' '}${token}` : token;
};
