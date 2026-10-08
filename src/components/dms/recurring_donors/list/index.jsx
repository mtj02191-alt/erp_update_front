import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import ConfirmationModal from '../../../common/ConfirmationModal';
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
import { hasPermission, isSuperAdmin } from '../../../../utils/permissions';
import { FiEye, FiRepeat, FiSend, FiEdit2, FiTrash2 } from 'react-icons/fi';

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
  { value: 'pending', label: 'Pending installments (none paid)' },
  { value: 'pending_initial', label: 'Pending initial donation' },
  { value: 'completed', label: 'Has paid installments' },
];

const SOURCE_OPTIONS = [
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
];

const EMPTY_FILTERS = {
  search: '',
  status: '',
  billing_interval: '',
  installment_status: '',
  source: '',
  date: '',
  start_date: '',
  end_date: '',
};

/**
 * Recurring Donors = people with a recurring_donations subscription (ledger).
 */
const RecurringDonorsList = () => {
  const navigate = useNavigate();
  const { permissions, user } = useAuth();
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
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isFrAdmin = useMemo(() => {
    const role = String(user?.role || '').toLowerCase();
    return (
      isSuperAdmin(permissions) ||
      role === 'super_admin' ||
      permissions?.fund_raising_manager === true ||
      role === 'fund_raising_manager'
    );
  }, [permissions, user]);

  const canList = useMemo(() => {
    if (!permissions && !user) return null;
    return (
      isFrAdmin ||
      hasPermission(permissions, 'fund_raising', 'recurring_donors', 'list_view') ||
      hasPermission(permissions, 'fund_raising', 'recurring_donors', 'view') ||
      hasPermission(permissions, 'fund_raising', 'recurring_donations', 'list_view') ||
      hasPermission(permissions, 'fund_raising', 'recurring_donations', 'view')
    );
  }, [permissions, user, isFrAdmin]);

  const canCreate = useMemo(
    () =>
      isFrAdmin ||
      hasPermission(permissions, 'fund_raising', 'recurring_donors', 'create') ||
      hasPermission(permissions, 'fund_raising', 'donors', 'create') ||
      hasPermission(permissions, 'fund_raising', 'offline_donors', 'create'),
    [permissions, isFrAdmin],
  );

  const canUpdate = useMemo(
    () =>
      isFrAdmin ||
      hasPermission(permissions, 'fund_raising', 'recurring_donors', 'update') ||
      hasPermission(permissions, 'fund_raising', 'recurring_donations', 'update'),
    [permissions, isFrAdmin],
  );

  const canDelete = useMemo(
    () =>
      isFrAdmin ||
      hasPermission(permissions, 'fund_raising', 'recurring_donors', 'delete') ||
      hasPermission(permissions, 'fund_raising', 'recurring_donations', 'delete'),
    [permissions, isFrAdmin],
  );

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
        setError(response.data.message || 'Failed to fetch recurring donors');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch recurring donors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, [currentPage, pageSize, sortField, sortOrder, appliedFilters]);

  const handleSortChange = (field, order) => {
    setSortField(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const sortOptions = [
    { value: 'created_at', label: 'Created Date' },
    { value: 'updated_at', label: 'Updated Date' },
    { value: 'id', label: 'ID' },
    { value: 'status', label: 'Status' },
    { value: 'amount', label: 'Amount' },
    { value: 'paid_at', label: 'Paid At' },
    { value: 'billing_interval', label: 'Billing Interval' },
  ];

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
    const completed = Number(row.completed_installment_count ?? 0);
    const initialStatus = String(row.initial_donation_status || '').toLowerCase();
    if (completed > 0) {
      return { label: 'Paid', color: '#10b981' };
    }
    if (initialStatus === 'pending' || initialStatus === 'failed') {
      return { label: 'Pending initial', color: '#f59e0b' };
    }
    return { label: 'Pending installment', color: '#ef4444' };
  };

  const sendInstallmentLink = async (rowId) => {
    setSendingLinkId(rowId);
    setError('');
    try {
      const response = await axiosInstance.post(
        `/recurring-donations/${rowId}/send-installment-link`,
      );
      if (!response.data.success) {
        setError(response.data.message || 'Failed to send installment link');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send installment link');
    } finally {
      setSendingLinkId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError('');
    try {
      const response = await axiosInstance.delete(
        `/recurring-donations/${deleteTarget.id}`,
      );
      if (response.data.success) {
        setDeleteTarget(null);
        await fetchRows();
      } else {
        setError(response.data.message || 'Failed to delete recurring donation');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to delete recurring donation',
      );
    } finally {
      setDeleting(false);
    }
  };

  const getActions = (row) => [
    {
      icon: <FiEye />,
      label: 'View subscription',
      color: '#2196f3',
      to: `/dms/recurring-donations/view/${row.id}`,
      visible: true,
    },
    {
      icon: <FiEdit2 />,
      label: 'Edit',
      color: '#f59e0b',
      onClick: () => navigate(`/dms/recurring-donations/update/${row.id}`),
      visible: canUpdate,
    },
    {
      icon: <FiTrash2 />,
      label: 'Delete',
      color: '#ef4444',
      onClick: () => setDeleteTarget(row),
      visible: canDelete,
    },
    ...(row.donor_id
      ? [
          {
            icon: <FiEye />,
            label: 'View donor',
            color: '#0ea5e9',
            to: `/dms/donors/view/${row.donor_id}`,
            visible: true,
          },
        ]
      : []),
    ...(!row.stripe_subscription_id
      ? [
          {
            icon: <FiSend />,
            label: sendingLinkId === row.id ? 'Sending...' : 'Send installment link',
            color: '#059669',
            onClick: () => sendInstallmentLink(row.id),
            disabled: sendingLinkId === row.id,
            visible: true,
          },
        ]
      : []),
  ];

  if (canList === null || (loading && rows.length === 0)) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader
            title="Recurring Donors"
            onRefresh={fetchRows}
            refreshing={loading}
            showAdd={canCreate}
            addPath="/dms/recurring-donors/add"
            addTitle="Add Recurring Donor"
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
          <PageHeader title="Recurring Donors" />
          <div className="status-message status-message--error">
            You do not have permission to view recurring donors.
          </div>
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
          title="Recurring Donors"
          subtitle="Donors with active or past recurring donation subscriptions"
          icon={<FiRepeat />}
          showFilterToggle
          filtersOpen={filtersOpen}
          onFilterToggle={toggleFilters}
          showAdd={canCreate}
          addPath="/dms/recurring-donors/add"
          addTitle="Add Recurring Donor"
        />

        {error && <div className="error-message">{error}</div>}

        <CollapsibleFilters open={filtersOpen}>
          <div className="filters-section">
            <SearchFilter
              filterKey="search"
              label="Search"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="Search donor, order, subscription..."
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
            <DropdownFilter
              filterKey="source"
              label="Source"
              data={SOURCE_OPTIONS}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="Online / Offline"
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
                <th>Donor</th>
                <th>Amount</th>
                <th>Billing</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Installments</th>
                <th>Method</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: 24 }}>
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center' }}>
                    No recurring donors found
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const collection = getCollectionBadge(row);
                  return (
                    <tr key={row.id}>
                      <td>
                        <div>{row.donor_name || '-'}</div>
                        <small style={{ color: '#6b7280' }}>{row.donor_email || ''}</small>
                      </td>
                      <td>{formatAmount(row.amount, row.currency)}</td>
                      <td>
                        {formatBilling(row.billing_interval, row.billing_interval_count)}
                      </td>
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
                      <td>{row.completed_installment_count ?? row.installment_count ?? 0}</td>
                      <td>
                        {row.stripe_subscription_id
                          ? 'Stripe'
                          : row.donation_method || 'Manual'}
                      </td>
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
          onSortChange={handleSortChange}
          sortField={sortField}
          sortOrder={sortOrder}
          sortOptions={sortOptions}
        />
      </div>

      <ConfirmationModal
        isOpen={!!deleteTarget}
        text={
          deleteTarget
            ? `Delete subscription #${deleteTarget.id}${
                deleteTarget.donor_name ? ` (${deleteTarget.donor_name})` : ''
              }? Installments will be archived. Donors and donations are not deleted.`
            : ''
        }
        delete
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />
    </>
  );
};

export default RecurringDonorsList;
