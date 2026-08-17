export const TARGET_FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi_weekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export const CAMPAIGN_TYPE_OPTIONS = [
  { value: 'one_time', label: 'One-time campaign' },
  { value: 'recurring', label: 'Recurring campaign' },
];

export const formatTargetFrequency = (value) => {
  if (!value) return '—';
  const opt = TARGET_FREQUENCY_OPTIONS.find((o) => o.value === value);
  return opt?.label || String(value).replace(/_/g, ' ');
};

export const CAMPAIGN_TEMPLATE_SLOTS = [
  { key: 'marketing', label: 'Marketing', purpose: 'marketing' },
  { key: 'thanks', label: 'Thank you', purpose: 'thanks' },
  { key: 'reminder', label: 'Reminder', purpose: 'recurring_reminder' },
  { key: 'payment_link', label: 'Payment link', purpose: 'payment_link' },
];

export const emptyCommunicationTemplates = () => ({
  marketing: { enabled: false, email_template_id: '', whatsapp_template_id: '' },
  thanks: { enabled: false, email_template_id: '', whatsapp_template_id: '' },
  reminder: { enabled: false, email_template_id: '', whatsapp_template_id: '' },
  payment_link: { enabled: false, email_template_id: '', whatsapp_template_id: '' },
});

export const communicationTemplatesFromApi = (raw) => {
  const base = emptyCommunicationTemplates();
  if (!raw || typeof raw !== 'object') return base;
  for (const slot of CAMPAIGN_TEMPLATE_SLOTS) {
    const row = raw[slot.key];
    if (!row) continue;
    base[slot.key] = {
      enabled: row.enabled === true,
      email_template_id: row.email_template_id != null ? String(row.email_template_id) : '',
      whatsapp_template_id: row.whatsapp_template_id != null ? String(row.whatsapp_template_id) : '',
    };
  }
  return base;
};

export const communicationTemplatesToApi = (formTemplates) => {
  const out = {};
  for (const slot of CAMPAIGN_TEMPLATE_SLOTS) {
    const row = formTemplates[slot.key] || {};
    out[slot.key] = {
      enabled: row.enabled === true,
      email_template_id: row.email_template_id ? Number(row.email_template_id) : null,
      whatsapp_template_id: row.whatsapp_template_id ? Number(row.whatsapp_template_id) : null,
    };
  }
  return out;
};

export const formatCommunicationSlot = (templates, slotKey) => {
  const row = templates?.[slotKey];
  if (!row?.enabled) return 'Off';
  const parts = [];
  if (row.email_template_id) parts.push(`Email #${row.email_template_id}`);
  if (row.whatsapp_template_id) parts.push(`WhatsApp #${row.whatsapp_template_id}`);
  return parts.length ? parts.join(', ') : 'Enabled (no template IDs)';
};
