import React, { useState, useEffect, useMemo } from 'react';
import axiosInstance from '../../../../utils/axios';
import usePersistedFilters from '../../../../hooks/usePersistedFilters';
import FundraisingCards from '../fundraising_cards';
import CumulativeChart from '../cumulative_chart';
import OverviewComparisonChart from '../overview_comparison_chart';
import RaisedEachMonthChart from '../raised_each_month_chart';
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
  const cumulativeSeries = apiData?.cumulative || [];
  const recurringDonationsSeries = apiData?.recurring_donations_series || [];
  const recurringDonorsSeries = apiData?.recurring_donors_series || [];

  const cumulative = {
    labels: cumulativeSeries.map((r) => r.month),
    values: cumulativeSeries.map((r) => Number(r.total_cumulative ?? 0)),
  };

  const recurringDonations = {
    labels: recurringDonationsSeries.map((r) => r.month),
    values: recurringDonationsSeries.map((r) => Number(r.total_cumulative ?? 0)),
    monthly: recurringDonationsSeries.map((r) => Number(r.month_amount ?? 0)),
  };

  const recurringDonors = {
    labels: recurringDonorsSeries.map((r) => r.month),
    values: recurringDonorsSeries.map((r) => Number(r.total_cumulative ?? 0)),
    monthly: recurringDonorsSeries.map((r) => Number(r.donors_count ?? 0)),
  };

  return { cumulative, recurringDonations, recurringDonors };
}

const FundraisingDashboard = ({ months = DEFAULT_MONTHS }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isForbidden, setIsForbidden] = useState(false);
  const [cards, setCards] = useState(null);
  const [cumulativeData, setCumulativeData] = useState({ labels: [], values: [] });
  const [recurringDonationsData, setRecurringDonationsData] = useState({
    labels: [],
    values: [],
    monthly: [],
  });
  const [recurringDonorsData, setRecurringDonorsData] = useState({
    labels: [],
    values: [],
    monthly: [],
  });
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

  const recurringDonationsMonthlyChart = useMemo(() => {
    if (!recurringDonationsData.labels?.length) {
      return { labels: [], datasets: [] };
    }
    return {
      labels: recurringDonationsData.labels,
      datasets: [
        {
          label: 'Recurring donations',
          data: recurringDonationsData.monthly,
          backgroundColor: 'rgba(59, 130, 246, 0.85)',
        },
      ],
    };
  }, [recurringDonationsData]);

  const recurringDonorsMonthlyChart = useMemo(() => {
    if (!recurringDonorsData.labels?.length) {
      return { labels: [], datasets: [] };
    }
    return {
      labels: recurringDonorsData.labels,
      datasets: [
        {
          label: 'Recurring donors',
          data: recurringDonorsData.monthly,
          backgroundColor: 'rgba(99, 102, 241, 0.85)',
        },
      ],
    };
  }, [recurringDonorsData]);

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
        const { cumulative, recurringDonations, recurringDonors } = mapApiToCharts(raw);
        setCumulativeData(cumulative);
        setRecurringDonationsData(recurringDonations);
        setRecurringDonorsData(recurringDonors);
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
          setRecurringDonationsData({ labels: [], values: [], monthly: [] });
          setRecurringDonorsData({ labels: [], values: [], monthly: [] });
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

          <div className="fundraising-charts-demo__charts-row fundraising-charts-demo__charts-row--single">
            <div className="fundraising-charts-demo__chart">
              <CumulativeChart
                title="Cumulative Donations"
                subtitle="Cumulative total of completed donations over time"
                data={cumulativeData}
                height={280}
              />
            </div>
          </div>

          <div className="fundraising-charts-demo__charts-row fundraising-charts-demo__charts-row--single">
            <div className="fundraising-charts-demo__chart">
              <OverviewComparisonChart
                title="Overview Comparison"
                subtitle="Comparison of key counts"
                data={overviewComparisonData}
                height={280}
              />
            </div>
          </div>

          <div className="fundraising-charts-demo__charts-row fundraising-charts-demo__charts-row--recurring">
            <div className="fundraising-charts-demo__chart">
              {recurringDonationsMonthlyChart.labels.length > 0 ? (
                <RaisedEachMonthChart
                  title="Recurring Donations"
                  data={recurringDonationsMonthlyChart}
                  height={280}
                  downloadFileName="recurring-donations-by-month"
                />
              ) : (
                <div className="fundraising-charts-demo__chart-empty">
                  <h2 className="fundraising-charts-demo__chart-empty-title">Recurring Donations</h2>
                  <p>No recurring donation installments in the selected period.</p>
                </div>
              )}
            </div>
            <div className="fundraising-charts-demo__chart">
              {recurringDonorsMonthlyChart.labels.length > 0 ? (
                <RaisedEachMonthChart
                  title="Recurring Donors"
                  data={recurringDonorsMonthlyChart}
                  height={280}
                  downloadFileName="recurring-donors-by-month"
                />
              ) : (
                <div className="fundraising-charts-demo__chart-empty">
                  <h2 className="fundraising-charts-demo__chart-empty-title">Recurring Donors</h2>
                  <p>No recurring donor activity in the selected period.</p>
                </div>
              )}
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
