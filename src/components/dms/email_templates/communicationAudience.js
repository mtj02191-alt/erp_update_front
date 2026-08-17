const STORAGE_KEY = 'communication_audience_filters';

export const saveAudienceFilters = (filters) => {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters || {}));
};

export const loadAudienceFilters = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearAudienceFilters = () => {
  sessionStorage.removeItem(STORAGE_KEY);
};

export const FILTER_LABELS = {
  search: 'Search',
  donor_type: 'Donor type',
  donation_type: 'Donation type',
  city: 'City',
  source: 'Source',
  multi_time_donors: 'Multi-time donors',
  recurring: 'Recurring',
  is_mature_donor: 'Mature donor',
  assigned_to_user_id: 'Assigned to',
  start_date: 'Start date',
  end_date: 'End date',
};

export const formatFilterValue = (key, value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (key === 'assigned_to_user_id' && value === 'me') return 'Me';
  return String(value);
};

export const formatFiltersSummary = (filters) => {
  if (!filters || typeof filters !== 'object') return '—';
  const parts = Object.entries(filters)
    .map(([key, value]) => {
      const formatted = formatFilterValue(key, value);
      if (formatted === null) return null;
      const label = FILTER_LABELS[key] || key;
      return `${label}: ${formatted}`;
    })
    .filter(Boolean);
  return parts.length ? parts.join(' · ') : 'No filters (all donors)';
};

export const parseDonorIdsParam = (value) => {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
};
