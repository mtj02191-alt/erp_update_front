import React, { useState, useEffect, useMemo } from 'react';
import axiosInstance from '../../../../utils/axios';
import usePersistedFilters from '../../../../hooks/usePersistedFilters';
import FundraisingCards from '../fundraising_cards';
import CumulativeChart from '../cumulative_chart';
import OverviewComparisonChart from '../overview_comparison_chart';
import { DateFilter, DateRangeFilter } from '../../filters';
import { SearchButton, ClearButton } from '../../filters/index';
import './styles.css';

const DEFAULT_MONTHS = 12;

const EMPTY_FILTERS = {
  date: '',
  start_date: '',
  end_date: '',
};

function mapApiToCharts(apiData) {
  if (!apiData?.cumulative?.length) {
    return {
      cumulative: { labels: [], values: [] },
    };
  }
  const cumulative = {
    labels: (apiData.cumulative || []).map((r) => r.month),
    values: (apiData.cumulative || []).map((r) => Number(r.total_cumulative ?? 0)),
  };
  return { cumulative };
}

const FundraisingDashboard = ({ months = DEFAULT_MONTHS }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isForbidden, setIsForbidden] = useState(false);
  const [cards, setCards] = useState(null);
  const [cumulativeData, setCumulativeData] = useState({ labels: [], values: [] });
  const [tempFilters, setTempFilters] = usePersistedFilters('fundraising-dashboard:temp', EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters, clearAppliedFilters] = usePersistedFilters('fundraising-dashboard:applied', EMPTY_FILTERS);

  const handleFilterChange = (key, value) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...tempFilters });
  };

  const handleClearFilters = () => {
    setTempFilters(EMPTY_FILTERS);
    clearAppliedFilters();
  };

  const apiParams = useMemo(() => {
    const params = { months };
    if (appliedFilters.date) params.date = appliedFilters.date;
    if (appliedFilters.start_date) params.start_date = appliedFilters.start_date;
    if (appliedFilters.end_date) params.end_date = appliedFilters.end_date;
    return params;
  }, [months, appliedFilters]);

  const overviewComparisonData = useMemo(() => {
    const c = cards || {};
    const labels = [
      'Individual',
      'Corporate',
      'Recurring',
      'Multi-time',
      'Donation boxes',
      'Events',
      'Campaigns',
    ];
    const values = [
      Number(c.individual_donors_count ?? 0),
      Number(c.corporate_donors_count ?? 0),
      Number(c.recurring_donors_count ?? 0),
      Number(c.multi_time_donors_count ?? 0),
      Number(c.active_donation_boxes_count ?? 0),
      Number(c.events_count ?? 0),
      Number(c.campaigns_count ?? 0),
    ];
    return { labels, values };
  }, [cards]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setIsForbidden(false);
    axiosInstance
      .get('/dashboard/fundraising-overview', { params: apiParams })
      .then((res) => {
        if (cancelled) return;
        const raw = res?.data?.data;
        if (raw?.cards) {
          setCards(raw.cards);
        }
        const { cumulative } = mapApiToCharts(raw);
        setCumulativeData(cumulative);
      })
      .catch((err) => {
        if (!cancelled) {
          const statusCode = err?.response?.status;
          if (statusCode === 401 || statusCode === 403) {
            setIsForbidden(true);
          }
          setError(err?.response?.data?.message || err?.message || 'Failed to load fundraising data');
          setCards(null);
          setCumulativeData({ labels: [], values: [] });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [apiParams]);

  return (
    <div className="fundraising-charts-demo">
      {/* Filters Section */}
      {!isForbidden &&
      <div className="fundraising-charts-demo__filters">
        <DateFilter
          filterKey="date"
          label="Specific Date"
          filters={tempFilters}
          onFilterChange={handleFilterChange}
        />
        <DateRangeFilter
          startKey="start_date"
          endKey="end_date"
          label="Date Range"
          filters={tempFilters}
          onFilterChange={handleFilterChange}
        />
        <div className="fundraising-filters__actions" style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <SearchButton onClick={handleApplyFilters} text="Apply" loading={loading} />
          <ClearButton onClick={handleClearFilters} text="Clear" />
        </div>
      </div>
}

      {loading ? (
        <div className="fundraising-charts-demo__loading">
          Loading fundraising data…
        </div>
        ) : !error ? (
        <>
          <div className="fundraising-charts-demo__cards">
            <FundraisingCards cards={cards} title="Fundraising overview" />
          </div>

          <div className="fundraising-charts-demo__charts-row">
            <div className="fundraising-charts-demo__chart">
              <CumulativeChart
                title="Cumulative Donations"
                subtitle="Cumulative total of completed donations over time"
                data={cumulativeData}
                height={280}
              />
            </div>
            <div className="fundraising-charts-demo__chart">
              <OverviewComparisonChart
                title="Overview Comparison"
                subtitle="Comparison of key counts"
                data={overviewComparisonData}
                height={280}
              />
            </div>
          </div>
        </>
        ) : (
        <div className="fundraising-charts-demo__error">
          {isForbidden
            ? 'You do not have permission to view fundraising dashboard.'
            : (error || 'Failed to load fundraising data.')}
        </div>
        )}
    </div>
  );
};

export default FundraisingDashboard;
