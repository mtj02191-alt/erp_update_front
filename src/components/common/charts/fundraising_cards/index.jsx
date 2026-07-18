import React from 'react';
import {
  FiActivity,
  FiBox,
  FiBriefcase,
  FiCalendar,
  FiCreditCard,
  FiHeart,
  FiLayers,
  FiRepeat,
  FiUser,
  FiUsers,
} from 'react-icons/fi';
import './index.css';

/**
 * Format number as compact amount (1.2M, 450K) or plain count. No currency symbol.
 */
const formatValue = (value, isCurrency = true) => {
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  if (!isCurrency) return num.toLocaleString();
  try {
    return new Intl.NumberFormat(undefined, {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(num);
  } catch {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toLocaleString();
  }
};

function fullValue(value, isCurrency = true) {
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  if (!isCurrency) return num.toLocaleString();
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

const ICON_BY_KEY = {
  total_donations_amount: FiHeart,
  total_donations_count: FiLayers,
  individual_donors_count: FiUser,
  corporate_donors_count: FiBriefcase,
  recurring_donors_count: FiRepeat,
  multi_time_donors_count: FiUsers,
  active_donation_boxes_count: FiBox,
  donation_box_donations_amount: FiCreditCard,
  events_count: FiCalendar,
  campaigns_count: FiActivity,
};

const TONE_BY_KEY = {
  total_donations_amount: 'indigo',
  total_donations_count: 'slate',
  individual_donors_count: 'slate',
  corporate_donors_count: 'amber',
  recurring_donors_count: 'blue',
  multi_time_donors_count: 'violet',
  active_donation_boxes_count: 'emerald',
  donation_box_donations_amount: 'emerald',
  events_count: 'violet',
  campaigns_count: 'cyan',
};

/**
 * KPI card (icon + title + big value + subtitle).
 * Layout is tuned to match the reference screenshot.
 */
const FundraisingCard = ({
  title,
  value,
  isCurrency = true,
  subtitle,
  className = '',
  icon: Icon,
  tone = 'slate',
}) => {
  const compact = formatValue(value, isCurrency);
  const full = fullValue(value, isCurrency);
  const aria = `${title} ${full}`;
  const sub = subtitle || (isCurrency ? 'Total amount collected' : 'Total count');

  return (
    <div className={`fundraising-card fundraising-card--tone-${tone} ${className}`.trim()}>
      <div className="fundraising-card__icon" aria-hidden>
        {Icon ? <Icon size={18} /> : null}
      </div>
      <div className="fundraising-card__content">
        <div className="fundraising-card__title">{title}</div>
        <div className="fundraising-card__value" title={full} aria-label={aria}>
          {compact}
        </div>
        <div className="fundraising-card__subtitle">{sub}</div>
      </div>
    </div>
  );
};

/**
 * Props.cards: shape from API data.cards
 * { total_donations_amount, total_donations_count, total_donors_count, ... }
 */
const FundraisingCards = ({ cards, title = 'Fundraising overview', className = '' }) => {
  if (!cards) return null;

  const cardItems = [
    { key: 'total_donations_amount', label: 'Completed Donations', isCurrency: true, subtitle: 'Total amount collected' },
    { key: 'individual_donors_count', label: 'Individual Donors', isCurrency: false, subtitle: 'Total donors' },
    { key: 'corporate_donors_count', label: 'Corporate Donors', isCurrency: false, subtitle: 'Total donors' },
    { key: 'recurring_donors_count', label: 'Recurring Donors', isCurrency: false, subtitle: 'Total donors' },
    { key: 'multi_time_donors_count', label: 'Multi-time Donors', isCurrency: false, subtitle: 'Total donors' },
    { key: 'active_donation_boxes_count', label: 'Active Donation Boxes', isCurrency: false, subtitle: 'Active boxes' },
    { key: 'donation_box_donations_amount', label: 'Donation Box Collection', isCurrency: true, subtitle: 'Total amount collected' },
    { key: 'events_count', label: 'Events', isCurrency: false, subtitle: 'Total events' },
    { key: 'campaigns_count', label: 'Campaigns', isCurrency: false, subtitle: 'Total campaigns' },
    { key: 'total_donations_count', label: 'Donations (count)', isCurrency: false, subtitle: 'Completed donations' },
  ];

  return (
    <div className={`fundraising-cards ${className}`.trim()}>
      {title && <h2 className="fundraising-cards__title">{title}</h2>}
      <div className="fundraising-cards__list">
        {cardItems.map(({ key, label, isCurrency, subtitle }) => (
          <FundraisingCard
            key={key}
            title={label}
            value={cards[key]}
            isCurrency={isCurrency}
            subtitle={subtitle}
            icon={ICON_BY_KEY[key]}
            tone={TONE_BY_KEY[key]}
          />
        ))}
      </div>
    </div>
  );
};

export default FundraisingCards;
export { FundraisingCard, formatValue };
