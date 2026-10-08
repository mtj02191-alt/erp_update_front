import React from 'react';
import Navbar from '../../Navbar';
import PageHeader from '../../common/PageHeader';
import FundraisingDashboard from '../../common/charts/fundraising_dashboard';
import useFiltersPanel from '../../../hooks/useFiltersPanel';

function getDefaultFiltersOpen() {
  if (typeof window === 'undefined') return true;
  return !window.matchMedia('(max-width: 768px)').matches;
}

const FundRaisingDashboardPage = () => {
  const { filtersOpen, toggleFilters } = useFiltersPanel(getDefaultFiltersOpen());

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          title="Fund Raising Dashboard"
          showBackButton={false}
          showAdd={false}
          showFilterToggle
          filtersOpen={filtersOpen}
          onFilterToggle={toggleFilters}
        />
        <div className="list-content">
          <FundraisingDashboard months={12} filtersOpen={filtersOpen} />
        </div>
      </div>
    </>
  );
};

export default FundRaisingDashboardPage;
