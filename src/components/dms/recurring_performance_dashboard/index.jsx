import React from 'react';
import Navbar from '../../Navbar';
import PageHeader from '../../common/PageHeader';
import FundraisingDashboard from '../../common/charts/fundraising_dashboard';
import useFiltersPanel from '../../../hooks/useFiltersPanel';

const RECURRING_CARD_KEYS = [
  'total_recurring_collection',
  'committed_monthly_amount',
  'total_pending_installments_amount',
  'this_month_recurring_collection',
  'registered_recurring_donors_count',
  'outstanding_donors_count',
  'recurring_donors_count',
  'recurring_donations_count',
  // 'committed_amount',
  // 'individual_donors_count',
  // 'corporate_donors_count',
  // 'multi_time_donors_count',
];

const RECURRING_CARD_LINKS = {
  total_recurring_collection: '/dms/recurring-donations/list',
  total_pending_installments_amount: '/dms/recurring-donations/list',
  recurring_donors_count: '/dms/recurring-donors/list',
  recurring_donations_count: '/dms/recurring-donations/list',
  registered_recurring_donors_count: '/dms/recurring-donors/list',
  outstanding_donors_count: '/dms/recurring-donations/list',
  committed_amount: '/dms/recurring-donations/list',
  committed_monthly_amount: '/dms/recurring-donations/list',
  this_month_recurring_collection: '/dms/recurring-donations/list',
  individual_donors_count: '/dms/online_donors/list',
  corporate_donors_count: '/dms/csr-donors/list',
  multi_time_donors_count: '/dms/online_donors/list',
};

function getDefaultFiltersOpen() {
  if (typeof window === 'undefined') return true;
  return !window.matchMedia('(max-width: 768px)').matches;
}

const RecurringPerformanceDashboardPage = () => {
  const { filtersOpen, toggleFilters } = useFiltersPanel(getDefaultFiltersOpen());

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          title="Recurring Performance"
          showBackButton={false}
          showAdd={false}
          showFilterToggle
          filtersOpen={filtersOpen}
          onFilterToggle={toggleFilters}
        />
        <div className="list-content">
          <FundraisingDashboard
            months={12}
            apiEndpoint="/dashboard/recurring-performance"
            storageKeyPrefix="recurring-performance-dashboard"
            cardsTitle=""
            cardKeys={RECURRING_CARD_KEYS}
            cardLinks={RECURRING_CARD_LINKS}
            forbiddenMessage="You do not have permission to view recurring performance dashboard."
            showCumulative={false}
            showOverviewComparison={false}
            showRecurringAnalyticsDoughnuts
            filtersOpen={filtersOpen}
          />
        </div>
      </div>
    </>
  );
};

export default RecurringPerformanceDashboardPage;
