import React, { useEffect, useMemo, useState } from 'react';
import { FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import ActionMenu from '../../../common/ActionMenu';
import ConfirmationModal from '../../../common/ConfirmationModal';
import Pagination from '../../../common/Pagination';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import {
  SearchFilter,
  DropdownFilter,
  CollapsibleFilters,
  SearchButton,
  ClearButton,
} from '../../../common/filters';
import useFiltersPanel from '../../../../hooks/useFiltersPanel';
import { useAuth } from '../../../../context/AuthContext';
import { hasPermission } from '../../../../utils/permissions';

const EMPTY_FILTERS = {
  search: '',
  donation_type: '',
};

const DONATION_TYPE_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'zakat', label: 'Zakat' },
];

const formatAmount = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const EventPledgesList = () => {
  const { permissions } = useAuth();
  const { filtersOpen, toggleFilters } = useFiltersPanel();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [tempFilters, setTempFilters] = useState({ ...EMPTY_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState({ ...EMPTY_FILTERS });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [listRefreshNonce, setListRefreshNonce] = useState(0);

  const canList = useMemo(() => {
    if (!permissions) return null;
    return (
      permissions.super_admin === true ||
      permissions.fund_raising_manager === true ||
      hasPermission(permissions, 'fund_raising', 'event_pledges', 'list_view') ||
      hasPermission(permissions, 'fund_raising', 'event_pledges', 'view')
    );
  }, [permissions]);

  const canCreate = useMemo(
    () =>
      permissions?.super_admin === true ||
      permissions?.fund_raising_manager === true ||
      hasPermission(permissions, 'fund_raising', 'event_pledges', 'create'),
    [permissions],
  );

  const canUpdate = useMemo(
    () =>
      permissions?.super_admin === true ||
      permissions?.fund_raising_manager === true ||
      hasPermission(permissions, 'fund_raising', 'event_pledges', 'update'),
    [permissions],
  );

  const canDelete = useMemo(
    () =>
      permissions?.super_admin === true ||
      permissions?.fund_raising_manager === true ||
      hasPermission(permissions, 'fund_raising', 'event_pledges', 'delete'),
    [permissions],
  );

  const fetchRows = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page: currentPage,
        pageSize,
        sortField: sortBy,
        sortOrder,
      };
      if (appliedFilters.search) params.search = appliedFilters.search;
      if (appliedFilters.donation_type) {
        params.donation_type = appliedFilters.donation_type;
      }

      const response = await axiosInstance.get('/dms/event-pledges', { params });
      const payload = response.data?.data;
      const list = Array.isArray(payload) ? payload : [];
      setRows(list);
      setTotalPages(response.data?.pagination?.totalPages || 1);
      setTotalItems(response.data?.pagination?.total || list.length);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch event pledges');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canList) fetchRows();
  }, [currentPage, pageSize, sortBy, sortOrder, appliedFilters, listRefreshNonce, canList]);

  const handleRefresh = () => setListRefreshNonce((n) => n + 1);

  const handleFilterChange = (key, value) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...tempFilters });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setTempFilters({ ...EMPTY_FILTERS });
    setAppliedFilters({ ...EMPTY_FILTERS });
    setCurrentPage(1);
  };

  const handleSortChange = (field, order) => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const sortOptions = [
    { value: 'created_at', label: 'Created Date' },
    { value: 'updated_at', label: 'Updated Date' },
    { value: 'donor_name', label: 'Donor Name' },
    { value: 'donation_amount', label: 'Amount' },
    { value: 'donation_type', label: 'Donation Type' },
    { value: 'contact_number', label: 'Contact Number' },
    { value: 'id', label: 'ID' },
  ];

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axiosInstance.delete(`/dms/event-pledges/${deleteTarget.id}`);
      setDeleteTarget(null);
      handleRefresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete event pledge');
      setDeleteTarget(null);
    }
  };

  const getRowActions = (item) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#4CAF50',
      to: `/dms/event-pledges/view/${item.id}`,
      visible: true,
    },
    {
      icon: <FiEdit2 />,
      label: 'Edit',
      color: '#2196F3',
      to: `/dms/event-pledges/edit/${item.id}`,
      visible: canUpdate,
    },
    {
      icon: <FiTrash2 />,
      label: 'Delete',
      color: '#f44336',
      onClick: () => setDeleteTarget(item),
      visible: canDelete,
    },
  ];

  if (canList === null) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader title="Event Pledges" />
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
          <PageHeader title="Event Pledges" />
          <div className="status-message status-message--error">
            You do not have permission to view event pledges.
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
          title="Event Pledges"
          onRefresh={handleRefresh}
          refreshing={loading}
          showFilterToggle
          filtersOpen={filtersOpen}
          onFilterToggle={toggleFilters}
          showAdd={canCreate}
          addPath="/dms/event-pledges/add"
          addTitle="Add Event Pledge"
        />

        {error && <div className="error-message">{error}</div>}

        <CollapsibleFilters open={filtersOpen}>
          <SearchFilter
            filterKey="search"
            label="Search"
            placeholder="Donor, contact, representative, address..."
            filters={tempFilters}
            onFilterChange={handleFilterChange}
          />
          <DropdownFilter
            filterKey="donation_type"
            label="Donation Type"
            data={DONATION_TYPE_OPTIONS}
            filters={tempFilters}
            onFilterChange={handleFilterChange}
          />
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <SearchButton onClick={handleApplyFilters} text="Apply" loading={loading} />
            <ClearButton onClick={handleClearFilters} text="Clear" />
          </div>
        </CollapsibleFilters>

        {loading && rows.length === 0 ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Donor Name</th>
                    <th>Contact</th>
                    <th>Care of / Rep</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center' }}>
                        No event pledges found
                      </td>
                    </tr>
                  ) : (
                    rows.map((item) => (
                      <tr key={item.id}>
                        <td>{item.donor_name}</td>
                        <td>{item.contact_number || '—'}</td>
                        <td>{item.care_of_representative || '—'}</td>
                        <td>
                          {item.donation_type === 'zakat'
                            ? 'Zakat'
                            : item.donation_type === 'general'
                              ? 'General'
                              : item.donation_type || '—'}
                        </td>
                        <td>{formatAmount(item.donation_amount)}</td>
                        <td>{formatDate(item.created_at)}</td>
                        <td>
                          <ActionMenu actions={getRowActions(item)} />
                        </td>
                      </tr>
                    ))
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
              sortField={sortBy}
              sortOrder={sortOrder}
              sortOptions={sortOptions}
            />
          </>
        )}

        <ConfirmationModal
          isOpen={!!deleteTarget}
          text={`Are you sure you want to delete pledge for "${deleteTarget?.donor_name || ''}"? This action cannot be undone.`}
          delete
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </>
  );
};

export default EventPledgesList;
