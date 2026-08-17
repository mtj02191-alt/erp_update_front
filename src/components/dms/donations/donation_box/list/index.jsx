import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import ActionMenu from '../../../../common/ActionMenu';
import ConfirmationModal from '../../../../common/ConfirmationModal';
import Pagination from '../../../../common/Pagination';
import DataImport from '../../../../common/DataImport';
import { useAuth } from '../../../../../context/AuthContext';
import { hasPermission } from '../../../../../utils/permissions';
import {
  SearchFilter,
  DropdownFilter,
  DateFilter,
  DateRangeFilter,
  CollapsibleFilters,
} from '../../../../common/filters';
import { ClearButton, SearchButton } from '../../../../common/filters/index';
import FormInput from '../../../../common/FormInput';
import useOfflineDataRefresh from '../../../../../hooks/useOfflineDataRefresh';
import usePersistedFilters from '../../../../../hooks/usePersistedFilters';
import useFiltersPanel from '../../../../../hooks/useFiltersPanel';

import { FiEye, FiTrash2, FiCalendar, FiBox } from 'react-icons/fi';
import OfflinePendingBadge from '../../../../common/OfflinePendingBadge';

const EMPTY_FILTERS = {
  search: '',
  status: '',
  payment_method: '',
  min_amount: '',
  max_amount: '',
  date: '',
  start_date: '',
  end_date: '',
};

const DonationBoxDonationsList = () => {
  const navigate = useNavigate();
  const { id: donationBoxId } = useParams();
  const { permissions } = useAuth();
  const [donations, setDonations] = useState([]);
  const [donationBoxInfo, setDonationBoxInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [donationToDelete, setDonationToDelete] = useState(null);
  const { filtersOpen, toggleFilters } = useFiltersPanel();

  const paginationKey = donationBoxId
    ? `donation-box-donations-list:${donationBoxId}:pagination`
    : 'donation-box-donations-list:pagination';
  const tempFiltersKey = donationBoxId
    ? `donation-box-donations-list:${donationBoxId}:temp`
    : 'donation-box-donations-list:temp';
  const appliedFiltersKey = donationBoxId
    ? `donation-box-donations-list:${donationBoxId}:applied`
    : 'donation-box-donations-list:applied';

  const [paginationState, setPaginationState] = usePersistedFilters(paginationKey, {
    currentPage: 1,
    pageSize: 10,
    sortField: 'collection_date',
    sortOrder: 'DESC',
  });
  const { currentPage, pageSize, sortField, sortOrder } = paginationState;
  const setCurrentPage = (v) =>
    setPaginationState((prev) => ({
      ...prev,
      currentPage: typeof v === 'function' ? v(prev.currentPage) : v,
    }));
  const setPageSize = (v) =>
    setPaginationState((prev) => ({ ...prev, pageSize: v, currentPage: 1 }));
  const setSortField = (v) =>
    setPaginationState((prev) => ({ ...prev, sortField: v, currentPage: 1 }));
  const setSortOrder = (v) =>
    setPaginationState((prev) => ({ ...prev, sortOrder: v, currentPage: 1 }));

  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [listRefreshNonce, setListRefreshNonce] = useState(0);

  const [tempFilters, setTempFilters, clearTempFilters] = usePersistedFilters(
    tempFiltersKey,
    EMPTY_FILTERS,
  );
  const [appliedFilters, setAppliedFilters, clearAppliedFilters] = usePersistedFilters(
    appliedFiltersKey,
    EMPTY_FILTERS,
  );

  // Universal filter change handler - Updates temporary filters only
  const handleFilterChange = (key, value) => {
    setTempFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle filter changes for FormInput components
  const handleFormFilterChange = (e) => {
    const { name, value } = e.target;
    handleFilterChange(name, value);
  };

  // Apply filters - Triggered by Search button
  const handleApplyFilters = () => {
    const filtersChanged = JSON.stringify(appliedFilters) !== JSON.stringify(tempFilters);
    
    if (filtersChanged) {
      setAppliedFilters(tempFilters);
      setCurrentPage(1);
    } else {
      handleRefresh();
    }
  };

  // Clear filters - Triggered by Clear button
  const handleClearFilters = () => {
    const filtersAreEmpty =
      JSON.stringify(appliedFilters) === JSON.stringify(EMPTY_FILTERS);

    if (!filtersAreEmpty) {
      clearTempFilters();
      clearAppliedFilters();
      setCurrentPage(1);
    }
  };

  // Fetch donation box info if ID is present
  useEffect(() => {
    if (donationBoxId) {
      fetchDonationBoxInfo();
    }
  }, [donationBoxId]);

  // Fetch donations when filters or pagination changes
  useEffect(() => {
    fetchDonations();
  }, [currentPage, pageSize, sortField, sortOrder, appliedFilters, donationBoxId, listRefreshNonce]);

  const handleRefresh = () => setListRefreshNonce((n) => n + 1);

  useOfflineDataRefresh(() => setListRefreshNonce((n) => n + 1), [
    currentPage,
    pageSize,
    sortField,
    sortOrder,
    appliedFilters,
    donationBoxId,
  ]);

  const fetchDonationBoxInfo = async () => {
    try {
      const response = await axiosInstance.get(`/donation-box/${donationBoxId}`);
      if (response.data.success) {
        setDonationBoxInfo(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching donation box info:', err);
    }
  };

  const buildListParams = () => {
    const params = {
      page: currentPage,
      pageSize,
      sortField,
      sortOrder,
      ...appliedFilters,
    };
    Object.keys(params).forEach((key) => {
      if (params[key] === '' || params[key] == null) {
        delete params[key];
      }
    });
    return params;
  };

  const fetchDonations = async () => {
    try {
      setLoading(true);

      const params = buildListParams();
      let response;

      if (donationBoxId) {
        response = await axiosInstance.get(`/donation-box-donation/box/${donationBoxId}`, {
          params,
        });
      } else {
        response = await axiosInstance.get('/donation-box-donation', { params });
      }
      
      if (response.data.success) {
        setDonations(response.data.data || []);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        setError('Failed to fetch donations');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch donations');
      console.error('Error fetching donations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handleSortChange = (field, order) => {
    setSortField(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const handleDeleteClick = (donation) => {
    setDonationToDelete(donation);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (donationToDelete) {
      try {
        await axiosInstance.delete(`/donation-box-donation/${donationToDelete.id}`);
        fetchDonations();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete donation');
        console.error('Error deleting donation:', err);
      }
    }
    setShowDeleteModal(false);
    setDonationToDelete(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDonationToDelete(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getActionMenuItems = (donation) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#4CAF50',
      to: `/dms/donation-box-donations/view/${donation.id}`,
      state: { donation },
      visible: true
    },
    {
      icon: <FiTrash2 />,
      label: 'Delete',
      color: '#f44336',
      onClick: () => handleDeleteClick(donation),
      visible: true
    }
  ];

  const sortOptions = [
    { value: 'collection_date', label: 'Collection Date' },
    { value: 'collection_amount', label: 'Amount' },
    { value: 'created_at', label: 'Created Date' },
    { value: 'status', label: 'Status' },
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'verified', label: 'Verified' },
    { value: 'deposited', label: 'Deposited' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const paymentMethodOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'other', label: 'Other' },
  ];

  const getBackPath = () => {
    if (donationBoxId) {
      return `/dms/donation_box/view/${donationBoxId}`;
    }
    return null;
  };

  const canImportCsv = useMemo(() => {
    if (!permissions) return false;
    return (
      permissions.super_admin === true ||
      hasPermission(permissions, 'fund_raising', 'donation_box_donations', 'create')
    );
  }, [permissions]);

  if (loading && donations.length === 0) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader
          onRefresh={handleRefresh}
          refreshing={loading} 
            title = 'Donation Box Collections'  
            showBackButton={!!donationBoxId} 
            backPath={getBackPath()}
            showAdd={true}
            addPath='/dms/donation-box-donations/add'
          />
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
          onRefresh={handleRefresh}
          refreshing={loading}
          title={
            donationBoxId && donationBoxInfo
              ? `Collections — ${donationBoxInfo.shop_name || donationBoxInfo.key_no}`
              : 'Donation Box Collections'
          }
          showBackButton={!!donationBoxId}
          backPath={getBackPath()}
          showFilterToggle
          filtersOpen={filtersOpen}
          onFilterToggle={toggleFilters}
          showAdd={true}
          addPath={
            donationBoxId
              ? `/dms/donation-box-donations/add/${donationBoxId}`
              : '/dms/donation-box-donations/add'
          }
        />

        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}

          <CollapsibleFilters open={filtersOpen}>
            <div className="filters-section">
              <SearchFilter
                filterKey="search"
                label="Search"
                filters={tempFilters}
                onFilterChange={handleFilterChange}
                placeholder="Search collector, receipt, shop, key no..."
              />

              <DropdownFilter
                filterKey="status"
                label="Status"
                data={statusOptions}
                filters={tempFilters}
                onFilterChange={handleFilterChange}
                placeholder="All Status"
              />

              <DropdownFilter
                filterKey="payment_method"
                label="Payment Method"
                data={paymentMethodOptions}
                filters={tempFilters}
                onFilterChange={handleFilterChange}
                placeholder="All Methods"
              />

              <FormInput
                label="Min Amount"
                type="number"
                name="min_amount"
                value={tempFilters.min_amount}
                onChange={handleFormFilterChange}
                placeholder="Min amount"
                min="0"
              />

              <FormInput
                label="Max Amount"
                type="number"
                name="max_amount"
                value={tempFilters.max_amount}
                onChange={handleFormFilterChange}
                placeholder="Max amount"
                min="0"
              />

              <DateFilter
                filterKey="date"
                label="Collection Date (exact)"
                filters={tempFilters}
                onFilterChange={handleFilterChange}
              />

              <DateRangeFilter
                startKey="start_date"
                endKey="end_date"
                label="Collection Date Range"
                filters={tempFilters}
                onFilterChange={handleFilterChange}
              />

              <div className="filters-actions">
                <SearchButton onClick={handleApplyFilters} text="Search" loading={loading} />
                <ClearButton onClick={handleClearFilters} text="Clear" />
              </div>
            </div>
          </CollapsibleFilters>

          {canImportCsv && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: '16px',
              }}
            >
              <DataImport
                entityName="donation_box_donations"
                buttonText="Import CSV"
                disabled={loading}
                onImportComplete={() => fetchDonations()}
              />
            </div>
          )}

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  {!donationBoxId && <th> Box</th>}
                  {!donationBoxId && <th>Shop</th>}
                  {/* {!donationBoxId && <th>Location</th>} */}
                  <th>Collection Amount</th>
                  <th>Collection Date</th>
                  <th>Collected By</th>
                  <th>Notes</th>
                  <th className="table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {donations.map(donation => (
                  <tr key={donation.id}>
                    <td>
                      <Link
                        to={`/dms/donation-box-donations/view/${donation.id}`}
                        state={{ donation }}
                        style={{ fontWeight: '600', color: '#0369a1', textDecoration: 'inherit' }}
                      >
                        COL-{donation.id}
                      </Link>
                    </td>
                    {!donationBoxId && (
                      <td>
                        <div className="box-info">
                          {donation.donation_box?.id ? (
                            <Link
                              to={`/dms/donation_box/view/${donation.donation_box.id}`}
                              style={{
                                fontWeight: '600',
                                color: '#333',
                                textDecoration: 'inherit',
                                display: 'inline-block',
                              }}
                            >
                              <FiBox style={{ display: 'inline', marginRight: '5px' }} />
                              Key: {donation.donation_box?.key_no || 'N/A'}
                            </Link>
                          ) : (
                            <div style={{ fontWeight: '600', color: '#333' }}>
                              <FiBox style={{ display: 'inline', marginRight: '5px' }} />
                              Key: {donation.donation_box?.key_no || 'N/A'}
                            </div>
                          )}
                          {donation.donation_box?.box_type && (
                            <div style={{ fontSize: '0.85em', color: '#666', marginTop: '3px' }}>
                              Type: {donation.donation_box.box_type}
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                    {!donationBoxId && (
                      <td>
                        <div className="shop-info">
                          <div style={{ fontWeight: '600', color: '#333' }}>
                            {donation.donation_box?.shop_name || '-'}
                          </div>
                          {donation.donation_box?.shopkeeper && (
                            <div style={{ fontSize: '0.85em', color: '#666', marginTop: '3px' }}>
                              {donation.donation_box.shopkeeper}
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                    {/* {!donationBoxId && (
                      <td>
                        <div className="location-info">
                          {donation.donation_box ? (
                            <>
                              <div style={{ color: '#333' }}>
                                {donation.donation_box?.route?.cities?.find(city => city.id === donation.donation_box.city_id)?.name}
                              </div>
                              <div style={{ fontSize: '0.85em', color: '#666', marginTop: '3px' }}>
                                {donation.donation_box?.route?.region?.name}
                              </div>
                            </>
                          ) : '-'}
                        </div>
                      </td>
                    )} */}
                    <td>
                      <div style={{ 
                        fontWeight: '700', 
                        color: '#15803d',
                        fontSize: '1.05em'
                      }}>
                        {/* <FiDollarSign style={{ display: 'inline', marginRight: '3px' }} /> */}
                        {formatAmount(donation.collection_amount)}
                        <OfflinePendingBadge show={donation._pending_sync} />
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <FiCalendar style={{ color: '#6b7280' }} />
                        {formatDate(donation.collection_date)}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', color: '#333' }}>
                        {donation.collected_by?.first_name + ' ' + donation.collected_by?.last_name || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85em', color: '#6b7280', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={donation.notes || ''}>
                        {donation.notes || '—'}
                      </div>
                    </td>
                    <td className="table-actions">
                      <ActionMenu actions={getActionMenuItems(donation)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalItems > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onSortChange={handleSortChange}
              sortField={sortField}
              sortOrder={sortOrder}
              sortOptions={sortOptions}
            />
          )}
          
          {donations.length === 0 && totalItems === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">💰</div>
              <div className="empty-state-text">No donation box collections found</div>
              <div className="empty-state-subtext">
                {donationBoxId 
                  ? 'No collections recorded for this donation box yet' 
                  : 'Collections will appear here once they are recorded'}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <ConfirmationModal
        isOpen={showDeleteModal}
        text={`Are you sure you want to delete this collection of ${formatAmount(donationToDelete?.collection_amount)}?`}
        delete={true}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};

export default DonationBoxDonationsList;

