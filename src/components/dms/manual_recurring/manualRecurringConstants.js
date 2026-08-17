export const PLEDGE_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const PLEDGE_MODE_OPTIONS = [
  { value: 'recurring_monthly', label: 'Monthly (pay each month)' },
  { value: 'prepaid_months', label: 'Prepaid (single payment for multiple months)' },
];

export const formatPledgeStatus = (status) => {
  const opt = PLEDGE_STATUS_OPTIONS.find((o) => o.value === status);
  return opt?.label || status || '—';
};

export const formatPledgeMode = (mode) => {
  const opt = PLEDGE_MODE_OPTIONS.find((o) => o.value === mode);
  return opt?.label || mode || '—';
};

export const formatAmount = (amount, currency = 'PKR') => {
  if (amount == null || amount === '') return '—';
  const n = Number(amount);
  if (Number.isNaN(n)) return '—';
  return `${currency} ${n.toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;
};

export const formatPledgeItems = (lines = []) => {
  if (!lines.length) return '—';
  return lines
    .map((line) => {
      const item = line.campaign_item;
      if (!item) return null;
      return `${line.quantity}× ${item.name}`;
    })
    .filter(Boolean)
    .join(', ');
};

export const computeLineTotal = (lines = []) => {
  return lines.reduce((sum, line) => {
    const price = Number(line.campaign_item?.unit_price ?? 0);
    const qty = Number(line.quantity ?? 0);
    return sum + price * qty;
  }, 0);
};
