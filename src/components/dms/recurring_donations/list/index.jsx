import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import Pagination from '../../../common/Pagination';
import {
  SearchFilter,
  DropdownFilter,
  DateFilter,
  DateRangeFilter,
  CollapsibleFilters,
  SearchButton,
  ClearButton,
} from '../../../common/filters';
import useFiltersPanel from '../../../../hooks/useFiltersPanel';
import { useAuth } from '../../../../context/AuthContext';
import { hasPermission } from '../../../../utils/permissions';
import { FiEye, FiRepeat, FiSend } from 'react-icons/fi';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'canceled', label: 'Canceled' },
  { value: 'past_due', label: 'Past due' },
  { value: 'failed', label: 'Failed' },
];

const INTERVAL_OPTIONS = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
];

const INSTALLMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending / arrears' },
  { value: 'pending_dues', label: 'Has missing installments' },
  { value: 'pending_initial', label: 'Pending initial donation' },
  { value: 'completed', label: 'Has paid installments' },
];

const PAYMENT_QUICK_FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending installments' },
  { value: 'pending_initial', label: 'Pending initial' },
  { value: 'completed', label: 'Paid' },
];

const EMPTY_FILTERS = {
  search: '',
  status: '',
  billing_interval: '',
  installment_status: '',
  date: '',
  start_date: '',
  end_date: '',
};

const RecurringDonationsList = () => {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { filtersOpen, toggleFilters } = useFiltersPanel();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [tempFilters, setTempFilters] = useState({ ...EMPTY_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState({ ...EMPTY_FILTERS });
  const [sendingLinkId, setSendingLinkId] = useState(null);

  const canList = useMemo(() => {
    if (!permissions) return null;
    return (
      permissions.super_admin === true ||
      permissions.fund_raising_manager === true ||
      hasPermission(permissions, 'fund_raising', 'recurring_donations', 'list_view') ||
      hasPermission(permissions, 'fund_raising', 'recurring_donations', 'view')
    );
  }, [permissions]);

  const handleFilterChange = (key, value) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    if (JSON.stringify(appliedFilters) !== JSON.stringify(tempFilters)) {
      setAppliedFilters({ ...tempFilters });
      setCurrentPage(1);
    } else {
      fetchRows();
    }
  };

  const handleClearFilters = () => {
    setTempFilters({ ...EMPTY_FILTERS });
    setAppliedFilters({ ...EMPTY_FILTERS });
    setCurrentPage(1);
  };

  const fetchRows = async () => {
    try {
      setLoading(true);
      setError('');
      const filters = { ...appliedFilters };
      Object.keys(filters).forEach((k) => !filters[k] && delete filters[k]);

      const response = await axiosInstance.post('/recurring-donations/search', {
        pagination: {
          page: currentPage,
          pageSize,
          sortField,
          sortOrder,
        },
        filters,
      });

      if (response.data.success) {
        setRows(response.data.data || []);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        setError(response.data.message || 'Failed to fetch recurring donations');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch recurring donations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, [currentPage, pageSize, sortField, sortOrder, appliedFilters]);

  const formatAmount = (amount, currency = 'PKR') => {
    if (amount == null) return '-';
    return `${currency || 'PKR'} ${Number(amount).toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;
  };

  const formatBilling = (interval, count) => {
    if (!interval) return '-';
    const n = count && count > 1 ? `every ${count} ` : 'every ';
    return `${n}${interval}${count > 1 ? 's' : ''}`;
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: '#10b981',
      canceled: '#6b7280',
      past_due: '#f59e0b',
      failed: '#ef4444',
    };
    return (
      <span
        style={{
          padding: '4px 8px',
          borderRadius: '4px',
          backgroundColor: colors[status] || '#6b7280',
          color: 'white',
          fontSize: '12px',
          textTransform: 'capitalize',
        }}
      >
        {(status || '-').replace(/_/g, ' ')}
      </span>
    );
  };

  const getCollectionBadge = (row) => {
    const pending = Number(row.pending_installment_count ?? 0);
    const completed = Number(row.completed_installment_count ?? 0);
    const initialStatus = String(row.initial_donation_status || '').toLowerCase();
    if (pending > 0) {
      return {
        label: pending === 1 ? '1 missing' : `${pending} missing`,
        color: '#ef4444',
      };
    }
    if (completed > 0) {
      return { label: 'Paid up', color: '#10b981' };
    }
    if (initialStatus === 'pending' || initialStatus === 'failed') {
      return { label: 'Pending initial', color: '#f59e0b' };
    }
    return { label: 'Pending installment', color: '#f59e0b' };
  };

  const applyPaymentQuickFilter = (value) => {
    const next = { ...appliedFilters, installment_status: value };
    setTempFilters(next);
    setAppliedFilters(next);
    setCurrentPage(1);
  };

  const getActions = (row) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#2196f3',
      onClick: () => navigate(`/dms/recurring-donations/view/${row.id}`),
      visible: true,
    },
    ...(!row.stripe_subscription_id
      ? [
          {
            icon: <FiSend />,
            label: sendingLinkId === row.id ? 'Sending...' : 'Send installment link',
            color: '#059669',
            onClick: async () => {
              setSendingLinkId(row.id);
              setError('');
              try {
                const response = await axiosInstance.post(
                  `/recurring-donations/${row.id}/send-installment-link`,
                );
                if (!response.data.success) {
                  setError(response.data.message || 'Failed to send installment link');
                }
              } catch (err) {
                setError(err.response?.data?.message || 'Failed to send installment link');
              } finally {
                setSendingLinkId(null);
              }
            },
            disabled: sendingLinkId === row.id,
            visible: true,
          },
        ]
      : []),
  ];

  if (canList === null) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader
            onRefresh={fetchRows}
            refreshing={loading}
            title="Recurring Donations"
          />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  if (!canList) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader
          onRefresh={fetchRows}
          refreshing={loading} title="Recurring Donations" />
          <div className="status-message status-message--error">
            You do not have permission to view recurring donations.
          </div>
        </div>
      </>
    );
  }

  if (loading && rows.length === 0) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader
          onRefresh={fetchRows}
          refreshing={loading} title="Recurring Donations" />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          onRefresh={fetchRows}
          refreshing={loading}
          title="Recurring Donations"
          subtitle="Stripe subscriptions and installment history"
          icon={<FiRepeat />}
          showFilterToggle
          filtersOpen={filtersOpen}
          onFilterToggle={toggleFilters}
        />

        {error && <div className="error-message">{error}</div>}

        {/* <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            marginBottom: 12,
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 13, color: '#6b7280', marginRight: 4 }}>Payment:</span>
          {PAYMENT_QUICK_FILTERS.map((opt) => {
            const active = (appliedFilters.installment_status || '') === opt.value;
            return (
              <button
                key={opt.value || 'all'}
                type="button"
                onClick={() => applyPaymentQuickFilter(opt.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: active ? '1px solid #2563eb' : '1px solid #d1d5db',
                  background: active ? '#eff6ff' : '#fff',
                  color: active ? '#1d4ed8' : '#374151',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div> */}

        <CollapsibleFilters open={filtersOpen}>
        <div className="filters-section">
          <SearchFilter
            filterKey="search"
            label="Search"
            filters={tempFilters}
            onFilterChange={handleFilterChange}
            placeholder="Search subscription, order, donor..."
          />
          <DropdownFilter
            filterKey="status"
            label="Status"
            data={STATUS_OPTIONS}
            filters={tempFilters}
            onFilterChange={handleFilterChange}
            placeholder="All statuses"
          />
          <DropdownFilter
            filterKey="billing_interval"
            label="Billing"
            data={INTERVAL_OPTIONS}
            filters={tempFilters}
            onFilterChange={handleFilterChange}
            placeholder="All billing"
          />
          <DropdownFilter
            filterKey="installment_status"
            label="Payment / installments"
            data={INSTALLMENT_STATUS_OPTIONS}
            filters={tempFilters}
            onFilterChange={handleFilterChange}
            placeholder="All payments"
          />
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
          <SearchButton onClick={handleApplyFilters} />
          <ClearButton onClick={handleClearFilters} />
        </div>
        </CollapsibleFilters>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Donor</th>
                <th>Amount</th>
                <th>Billing</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Paid</th>
                <th>Missing</th>
                <th>Subscription</th>
                <th>Initial order</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="12" style={{ textAlign: 'center', padding: 24 }}>
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan="12" style={{ textAlign: 'center' }}>
                    No recurring donations found
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const collection = getCollectionBadge(row);
                  return (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>
                      <div>{row.donor_name || '-'}</div>
                      <small style={{ color: '#6b7280' }}>{row.donor_email || ''}</small>
                    </td>
                    <td>{formatAmount(row.amount, row.currency)}</td>
                    <td>{formatBilling(row.billing_interval, row.billing_interval_count)}</td>
                    <td>{getStatusBadge(row.status)}</td>
                    <td>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: collection.color,
                          color: 'white',
                          fontSize: '12px',
                        }}
                      >
                        {collection.label}
                      </span>
                    </td>
                    <td>{row.completed_installment_count ?? 0}</td>
                    <td>{row.pending_installment_count ?? 0}</td>
                    <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {row.stripe_subscription_id || '-'}
                    </td>
                    <td>{row.initial_order_id || row.initial_donation_id || '-'}</td>
                    <td>
                      {row.created_at
                        ? new Date(row.created_at).toLocaleDateString()
                        : '-'}
                    </td>
                    <td>
                      <ActionMenu actions={getActions(row)} />
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      </div>
    </>
  );
};

export default RecurringDonationsList;
