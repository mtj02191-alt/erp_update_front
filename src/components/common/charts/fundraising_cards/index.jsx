import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiActivity,
  FiAlertCircle,
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
  total_recurring_collection: FiCreditCard,
  total_pending_installments_amount: FiAlertCircle,
  recurring_donations_count: FiLayers,
  multi_time_donors_count: FiUsers,
  active_donation_boxes_count: FiBox,
  donation_box_donations_amount: FiCreditCard,
  events_count: FiCalendar,
  campaigns_count: FiActivity,
  registered_recurring_donors_count: FiUsers,
  outstanding_donors_count: FiAlertCircle,
  committed_amount: FiCreditCard,
  committed_monthly_amount: FiRepeat,
  this_month_recurring_collection: FiHeart,
};

const TONE_BY_KEY = {
  total_donations_amount: 'indigo',
  total_donations_count: 'slate',
  individual_donors_count: 'slate',
  corporate_donors_count: 'amber',
  recurring_donors_count: 'blue',
  total_recurring_collection: 'blue',
  total_pending_installments_amount: 'amber',
  recurring_donations_count: 'blue',
  multi_time_donors_count: 'violet',
  active_donation_boxes_count: 'emerald',
  donation_box_donations_amount: 'emerald',
  events_count: 'violet',
  campaigns_count: 'cyan',
  registered_recurring_donors_count: 'violet',
  outstanding_donors_count: 'amber',
  committed_amount: 'indigo',
  committed_monthly_amount: 'blue',
  this_month_recurring_collection: 'emerald',
};

/**
 * KPI card (icon + title + big value + subtitle).
 * Optional `to` wraps the card in a Link.
 */
const FundraisingCard = ({
  title,
  value,
  isCurrency = true,
  subtitle,
  className = '',
  icon: Icon,
  tone = 'slate',
  to = null,
}) => {
  const compact = formatValue(value, isCurrency);
  const full = fullValue(value, isCurrency);
  const aria = `${title} ${full}`;
  const sub = subtitle || (isCurrency ? 'Total amount collected' : 'Total count');

  const body = (
    <>
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
    </>
  );

  const classes = `fundraising-card fundraising-card--tone-${tone}${to ? ' fundraising-card--link' : ''} ${className}`.trim();

  if (to) {
    return (
      <Link to={to} className={classes} title={`Open ${title}`}>
        {body}
      </Link>
    );
  }

  return <div className={classes}>{body}</div>;
};

/**
 * Props.cards: shape from API data.cards
 * Optional cardKeys: when provided, only those KPI keys are rendered (order preserved).
 * Optional cardLinks: map of card key → route path.
 */
const FundraisingCards = ({
  cards,
  title = 'Fundraising overview',
  className = '',
  cardKeys = null,
  cardLinks = null,
}) => {
  if (!cards) return null;

  const cardItems = [
    { key: 'committed_amount', label: 'Committed Amount', isCurrency: true, subtitle: 'Active subscription pledges in period' },
    { key: 'total_donations_amount', label: 'Completed Donations', isCurrency: true, subtitle: 'Total amount collected' },
    { key: 'donation_box_donations_amount', label: 'Donation Box Collection', isCurrency: true, subtitle: 'Total amount collected' },
    { key: 'total_recurring_collection', label: 'Total Recurring Collection', isCurrency: true, subtitle: 'Completed installments in period' },
    { key: 'individual_donors_count', label: 'Individual Donors', isCurrency: false, subtitle: 'Total donors' },
    { key: 'corporate_donors_count', label: 'Corporate Donors', isCurrency: false, subtitle: 'Total donors' },
    { key: 'recurring_donors_count', label: 'Active Recurring Donors', isCurrency: false, subtitle: 'With paid installments in period' },
    { key: 'total_pending_installments_amount', label: 'Due Installments', isCurrency: true, subtitle: 'Subscriptions awaiting first installment' },
    { key: 'recurring_donations_count', label: 'Active Recurring Donations', isCurrency: false, subtitle: 'With paid installments in period' },
    { key: 'multi_time_donors_count', label: 'Multi-time Donors', isCurrency: false, subtitle: 'Total donors' },
    { key: 'active_donation_boxes_count', label: 'Active Donation Boxes', isCurrency: false, subtitle: 'Active boxes' },
    { key: 'events_count', label: 'Events', isCurrency: false, subtitle: 'Total events' },
    { key: 'campaigns_count', label: 'Campaigns', isCurrency: false, subtitle: 'Total campaigns' },
    { key: 'total_donations_count', label: 'Donations (count)', isCurrency: false, subtitle: 'Completed donations' },
    { key: 'registered_recurring_donors_count', label: 'Total Registered Recurring Donors', isCurrency: false, subtitle: 'Subscriptions registered in period' },
    { key: 'outstanding_donors_count', label: 'Due Donors', isCurrency: false, subtitle: 'Registered in period, no paid installment yet' },
    // { key: 'committed_monthly_amount', label: 'Committed Monthly', isCurrency: true, subtitle: 'Monthly run-rate of active recurring' },
    { key: 'committed_monthly_amount', label: 'Committed Monthly', isCurrency: true, subtitle: 'Monthly run-rate of active recurring in period' },
    { key: 'this_month_recurring_collection', label: 'This Month Collection', isCurrency: true, subtitle: 'This calendar month within selected period' },
  ];

  // Default Fund Raising dashboard: original cards only (new KPIs are opt-in via cardKeys)
  const DEFAULT_CARD_KEYS = [
    'total_donations_amount',
    'donation_box_donations_amount',
    'total_recurring_collection',
    'individual_donors_count',
    'corporate_donors_count',
    'recurring_donors_count',
    'total_pending_installments_amount',
    'recurring_donations_count',
    'multi_time_donors_count',
    'active_donation_boxes_count',
    'events_count',
    'campaigns_count',
    'total_donations_count',
  ];

  const keysToShow =
    Array.isArray(cardKeys) && cardKeys.length > 0 ? cardKeys : DEFAULT_CARD_KEYS;

  const visibleItems = keysToShow
    .map((key) => cardItems.find((item) => item.key === key))
    .filter(Boolean);

  return (
    <div className={`fundraising-cards ${className}`.trim()}>
      {title && <h2 className="fundraising-cards__title">{title}</h2>}
      <div className="fundraising-cards__list">
        {visibleItems.map(({ key, label, isCurrency, subtitle }) => (
          <FundraisingCard
            key={key}
            title={label}
            value={cards[key]}
            isCurrency={isCurrency}
            subtitle={subtitle}
            icon={ICON_BY_KEY[key]}
            tone={TONE_BY_KEY[key]}
            to={cardLinks?.[key] || null}
          />
        ))}
      </div>
    </div>
  );
};

export default FundraisingCards;
export { FundraisingCard, formatValue };
