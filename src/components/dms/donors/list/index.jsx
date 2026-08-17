import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import { useAuth } from '../../../../context/AuthContext';
import { fundRaisingDonorsHas, hasPermission } from '../../../../utils/permissions';
import Navbar from '../../../Navbar'; 
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import ConfirmationModal from '../../../common/ConfirmationModal';
import Modal from '../../../common/Modal';
import Pagination from '../../../common/Pagination';
import { SearchFilter, DropdownFilter, DateFilter, DateRangeFilter, CollapsibleFilters } from '../../../common/filters';
import { SearchButton, ClearButton } from '../../../common/filters';
import SearchableDropdown from '../../../common/SearchableDropdown';
import HybridDropdown from '../../../common/HybridDropdown';
import useFiltersPanel from '../../../../hooks/useFiltersPanel';
import { DownloadCSV } from '../../../common/download';
import DataImport from '../../../common/DataImport';
import { FiEye, FiEdit, FiTrash2, FiUser, FiKey, FiPlusCircle } from 'react-icons/fi';
import { BsFillBuildingsFill } from "react-icons/bs";
import FormInput from '../../../common/FormInput';
import useOfflineDataRefresh from '../../../../hooks/useOfflineDataRefresh';
import useListRowSelection from '../../../../hooks/useListRowSelection';
import DonorBulkActionsModal from './DonorBulkActionsModal';
import {
  DONOR_PIPELINE_FILTER_OPTIONS,
  formatPipelineStage,
} from '../shared/donorPipelineConstants';

const DONOR_ASSIGNED_FILTER_ALL = {
  id: '__all__',
  first_name: 'Select all',
  filterValue: '',
};

const DONOR_ASSIGNED_FILTER_ME = {
  id: '__me__',
  first_name: 'Me',
  filterValue: 'me',
};

const DonorsList = () => {
  const { permissions, user } = useAuth();
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const { filtersOpen, toggleFilters } = useFiltersPanel();
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [donorToDelete, setDonorToDelete] = useState(null);
  const [revealModalOpen, setRevealModalOpen] = useState(false);
  const [revealModalTitle, setRevealModalTitle] = useState('');
  const [revealedPassword, setRevealedPassword] = useState('');
  const [revealError, setRevealError] = useState('');
  const [revealLoading, setRevealLoading] = useState(false);
  const [selectedAssignedUser, setSelectedAssignedUser] = useState(null);
  const [bulkActionsOpen, setBulkActionsOpen] = useState(false);
  const [bulkAudienceMode, setBulkAudienceMode] = useState('manual'); // manual | filters
  const [bulkDonorIds, setBulkDonorIds] = useState([]);
  const [bulkDonorFilters, setBulkDonorFilters] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Filter state - Temporary filters (not applied until search button is clicked)
  const [tempFilters, setTempFilters] = useState({
    search: '',
    donor_type: '',
    city: '',
    date: '',
    start_date: '',
    end_date: '',
    source: '',
    multi_time_donors: null,
    recurring: null,
    is_mature_donor: null,
    assigned_to_user_id: '',
    donated_amount: '',
    donated_amount_operator: '',
    pipeline_stage: '',
  });

  // Applied filters - Actually sent to API
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    donor_type: '',
    city: '',
    date: '',
    start_date: '',
    end_date: '',
    source: '',
    multi_time_donors: null,
    recurring: null,
    is_mature_donor: null,
    assigned_to_user_id: '',
    donated_amount: '',
    donated_amount_operator: '',
    pipeline_stage: '',
  });

  const selectionResetKey = useMemo(
    () => JSON.stringify({ currentPage, pageSize, appliedFilters }),
    [currentPage, pageSize, appliedFilters],
  );
  const {
    selectedIds,
    selectedCount,
    isSelected,
    toggleOne,
    toggleAllOnPage,
    clearSelection,
    allOnPageSelected,
    headerCheckboxRef,
  } = useListRowSelection(donors, 'id', selectionResetKey);

  const hasActiveFilters = useMemo(() => {
    const empty = {
      search: '',
      donor_type: '',
      donation_type: '',
      city: '',
      date: '',
      start_date: '',
      end_date: '',
      source: '',
      multi_time_donors: null,
      recurring: null,
      is_mature_donor: null,
      assigned_to_user_id: '',
      donated_amount: '',
      donated_amount_operator: '',
      pipeline_stage: '',
    };
    return JSON.stringify(appliedFilters) !== JSON.stringify(empty);
  }, [appliedFilters]);

  const handleActionsForSelected = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    setBulkAudienceMode('manual');
    setBulkDonorIds(ids);
    setBulkDonorFilters(null);
    setBulkActionsOpen(true);
  };

  const handleActionsForFiltered = () => {
    setBulkAudienceMode('filters');
    setBulkDonorIds([]);
    setBulkDonorFilters({ ...appliedFilters });
    setBulkActionsOpen(true);
  };

  const handleBulkActionsClose = () => {
    setBulkActionsOpen(false);
  };

  const handleBulkSendSuccess = () => {
    if (bulkAudienceMode === 'manual') {
      clearSelection();
    }
  };

  const canSearchAssignees = useMemo(() => {
    if (!permissions) return false;
    if (permissions.super_admin === true) return true;
    if (permissions.fund_raising_manager === true) return true;
    const role = String(user?.role || '').toLowerCase();
    return [
      'manager',
      'assistant_manager',
      'team_lead',
      'department_head',
      'director',
    ].includes(role);
  }, [permissions, user]);

  const assignedFilterStaticOptions = useMemo(
    () => [DONOR_ASSIGNED_FILTER_ALL, DONOR_ASSIGNED_FILTER_ME],
    [],
  );

  const searchAssignedUsers = async (term) => {
    const trimmed = String(term || '').trim();
    const query = trimmed.toLowerCase();
    const matchedStatic = query
      ? assignedFilterStaticOptions.filter((option) =>
          option.first_name.toLowerCase().includes(query),
        )
      : assignedFilterStaticOptions;

    if (!canSearchAssignees || trimmed.length < 2) {
      return matchedStatic;
    }

    const response = await axiosInstance.get('/users/options', {
      params: {
        department: 'fund_raising',
        search: term,
        assignment_scope: 'donor_assigned_filter',
      },
    });
    const users = Array.isArray(response.data)
      ? response.data
      : response.data?.data || [];

    return [...matchedStatic, ...users];
  };

  // Universal filter change handler - Updates temporary filters only
  const handleFilterChange = (key, value) => {
    // Normalize boolean dropdown values
    if (key === 'multi_time_donors') {
      // DropdownFilter provides string values; store boolean when selected, null when "All"
      if (value === '' || value === null || value === undefined) {
        value = null;
      } else if (value === 'true' || value === true) {
        value = true;
      } else if (value === 'false' || value === false) {
        value = false;
      }
    }
    if (key === 'recurring') {
      // DropdownFilter provides string values; store boolean when selected, null when "All"
      if (value === '' || value === null || value === undefined) {
        value = null;
      } else if (value === 'true' || value === true) {
        value = true;
      } else if (value === 'false' || value === false) {
        value = false;
      }
    }
    if (key === 'is_mature_donor') {
      if (value === '' || value === null || value === undefined) {
        value = null;
      } else if (value === 'true' || value === true) {
        value = true;
      } else if (value === 'false' || value === false) {
        value = false;
      }
    }
    setTempFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleAssignedUserSelect = (item) => {
    setSelectedAssignedUser(item);
    if (item?.filterValue !== undefined) {
      handleFilterChange('assigned_to_user_id', item.filterValue);
      return;
    }
    if (item?.id) {
      handleFilterChange('assigned_to_user_id', item.id);
    }
  };

  const handleAssignedUserClear = () => {
    setSelectedAssignedUser(null);
    handleFilterChange('assigned_to_user_id', '');
  };

  // Apply filters - Triggered by Search button
  const handleApplyFilters = () => {
    // Check if filters have changed
    const filtersChanged = JSON.stringify(appliedFilters) !== JSON.stringify(tempFilters);
    
    if (filtersChanged) {
      // If filters changed, apply them
      setAppliedFilters(tempFilters);
      setCurrentPage(1);
    } else {
      // If filters haven't changed, force refresh by calling fetchDonors
      fetchDonors();
    }
  };

  const canExportCsv = useMemo(() => {
    if (!permissions) return false;
    return permissions.super_admin === true || fundRaisingDonorsHas(permissions, 'csv_xport');
  }, [permissions]);

  const canImportCsv = useMemo(() => {
    if (!permissions) return false;
    return permissions.super_admin === true || fundRaisingDonorsHas(permissions, 'create');
  }, [permissions]);

  const canRevealPassword = useMemo(() => {
    if (!permissions) return false;
    // UI-only gating; backend enforces final access control.
    return permissions.super_admin === true || fundRaisingDonorsHas(permissions, 'update');
  }, [permissions]);

  const canAddDonation = useMemo(() => {
    if (!permissions) return false;
    return (
      permissions.super_admin === true ||
      hasPermission(permissions, 'fund_raising', 'online_donations', 'create')
    );
  }, [permissions]);

  /** Align with server: online = source website; offline = all other sources. Empty value = all (select placeholder). */
  const donorSourceFilterOptions = useMemo(() => {
    if (!permissions) {
      return [
        { value: 'online', label: 'Online donors' },
        { value: 'offline', label: 'Offline donors' },
      ];
    }
    if (permissions.super_admin === true) {
      return [
        { value: 'online', label: 'Online donors' },
        { value: 'offline', label: 'Offline donors' },
      ];
    }
    const fr = permissions.fund_raising || {};
    const unified =
      fr.donors?.list_view === true ||
      fr.donors?.view === true;
    const online =
      unified ||
      fr.online_donors?.list_view === true ||
      fr.online_donors?.view === true;
    const offline =
      unified ||
      fr.offline_donors?.list_view === true ||
      fr.offline_donors?.view === true;
    const opts = [];
    if (online) opts.push({ value: 'online', label: 'Online donors' });
    if (offline) opts.push({ value: 'offline', label: 'Offline donors' });
    return opts;
  }, [permissions]);

  const csvColumns = [
    { key: 'donor_type', label: 'Type' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'city', label: 'City' },
    { key: 'created_at', label: 'Registration Date' }
  ];

  const prepareCSVData = () => {
    return donors.map(donor => ({
      ...donor,
      donor_type: getDonorTypeLabel(donor.donor_type),
      created_at: new Date(donor.created_at).toLocaleDateString()
    }));
  };

  const getCSVFilename = () => {
    const today = new Date().toISOString().split('T')[0];
    return `donors-export-${today}`;
  };

  // Clear filters - Triggered by Clear button
  const handleClearFilters = () => {
    const emptyFilters = {
      search: '',
      donor_type: '',
      city: '',
      date: '',
      start_date: '',
      end_date: '',
      source: '',
      multi_time_donors: null,
      recurring: null,
      is_mature_donor: null,
      assigned_to_user_id: '',
      donated_amount: '',
      donated_amount_operator: '',
      pipeline_stage: '',
    };
    
    setSelectedAssignedUser(null);
    
    // Check if filters are already empty
    const filtersAreEmpty = JSON.stringify(appliedFilters) === JSON.stringify(emptyFilters);
    
    if (!filtersAreEmpty) {
      // Only clear and call API if there are active filters
      setTempFilters(emptyFilters);
      setAppliedFilters(emptyFilters);
      setCurrentPage(1);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, [currentPage, pageSize, sortField, sortOrder, appliedFilters]);

  useOfflineDataRefresh(() => fetchDonors(), [
    currentPage,
    pageSize,
    sortField,
    sortOrder,
    appliedFilters,
  ]);

  const fetchDonors = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        pageSize: pageSize,
        sortField: sortField,
        sortOrder: sortOrder,
        ...appliedFilters
      };

      // Don't send multi_time_donors when it's not selected
      if (params.multi_time_donors === null || params.multi_time_donors === undefined) {
        delete params.multi_time_donors;
      }
      if (params.recurring === null || params.recurring === undefined) {
        delete params.recurring;
      }
      if (params.is_mature_donor === null || params.is_mature_donor === undefined) {
        delete params.is_mature_donor;
      }
      if (!params.source) {
        delete params.source;
      }
      if (!params.pipeline_stage) {
        delete params.pipeline_stage;
      }
      if (
        params.assigned_to_user_id === null ||
        params.assigned_to_user_id === undefined ||
        params.assigned_to_user_id === ''
      ) {
        delete params.assigned_to_user_id;
      }
      if (!params.donated_amount || !params.donated_amount_operator) {
        delete params.donated_amount;
        delete params.donated_amount_operator;
      }
      
      const response = await axiosInstance.get('/donors', { params });
      if (response.data.success) {
        setDonors(response.data.data || []);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        setError('Failed to fetch donors');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch donors');
      console.error('Error fetching donors:', err);
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

  const handleDeleteClick = (donor) => {
    setDonorToDelete(donor);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!donorToDelete) return;

    try {
      await axiosInstance.delete(`/donors/${donorToDelete.id}`);
      setShowDeleteModal(false);
      setDonorToDelete(null);
      fetchDonors(); // Refresh the list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete donor');
      console.error('Error deleting donor:', err);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDonorToDelete(null);
  };

  const closeRevealModal = () => {
    setRevealModalOpen(false);
    setRevealModalTitle('');
    setRevealedPassword('');
    setRevealError('');
    setRevealLoading(false);
  };

  const handleRevealPassword = async (donor) => {
    try {
      setRevealError('');
      setRevealLoading(true);
      setRevealModalTitle(`Donor Password — ${donor?.name || donor?.email || 'Donor'}`);
      setRevealModalOpen(true);

      const res = await axiosInstance.get(`/donors/${donor.id}/reveal-password`);
      const password = res?.data?.data?.password || '';
      setRevealedPassword(password);
      if (!password) setRevealError('No password returned.');
    } catch (err) {
      setRevealError(err.response?.data?.message || 'Failed to reveal password');
    } finally {
      setRevealLoading(false);
    }
  };

  const getDonorActions = (donor) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#2196f3',
      to: `/dms/donors/view/${donor.id}`,
      visible: true
    },
    {
      icon: <FiEdit />,
      label: 'Edit',
      color: '#ff9800',
      to: `/dms/donors/edit/${donor.id}`,
      visible: true
    },
    {
      icon: <FiKey />,
      label: 'Reveal Password',
      color: '#111827',
      onClick: () => handleRevealPassword(donor),
      visible: canRevealPassword === true
    },
    {
      icon: <FiPlusCircle />,
      label: 'Add Donation',
      color: '#16a34a',
      to: `/donations/online_donations/add?donor_id=${donor.id}`,
      visible: canAddDonation
    },
    {
      icon: <FiTrash2 />,
      label: 'Delete',
      color: '#f44336',
      onClick: () => handleDeleteClick(donor),
      visible: true
    }
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Registration Date' },
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'donor_type', label: 'Type' },
    { value: 'city', label: 'City' }
  ];

  // Filter options
  const donorTypeOptions = [
    { value: 'individual', label: 'Individual' },
    { value: 'csr', label: 'CSR (Corporate)' },
  ];

  // 
  const donationTypeOptions = [
    { value: 'one_time_donor', label: 'One Time Donor' },
    { value: 'recurring_donor', label: 'Recurring Donor' }
  ];

  const multiTimeDonorsOptions = [
    { value: 'true', label: 'Yes' },
    { value: 'false', label: 'No' },
  ];

  const matureDonorOptions = [
    { value: 'true', label: 'Matured Donors' },
    { value: 'false', label: 'Not matured (no completed donation)' },
  ];

  const recurringOptions = [
    { value: 'true', label: 'Yes' },
    { value: 'false', label: 'No' },
  ];

  const donatedAmountOptions = [
    { value: '', label: 'Any Amount' },
    { value: '1000', label: '1,000' },
    { value: '5000', label: '5,000' },
    { value: '10000', label: '10,000' },
    { value: '25000', label: '25,000' },
    { value: '50000', label: '50,000' },
    { value: '100000', label: '100,000' },
    { value: '250000', label: '250,000' },
    { value: '500000', label: '500,000' },
    { value: '1000000', label: '1,000,000' },
  ];

  const donatedAmountOperatorOptions = [
    { value: '', label: 'Select Operator' },
    { value: '>', label: 'Greater than' },
    { value: '<', label: 'Less than' },
    { value: '=', label: 'Equal to' },
    { value: '>=', label: 'Greater than or equal' },
    { value: '<=', label: 'Less than or equal' },
  ];

  const getDonorTypeIcon = (type) => {
    return type === 'csr' ? <BsFillBuildingsFill /> : <FiUser />;
  };

  const getDonorTypeLabel = (type) => {
    return type === 'csr' ? 'CSR' : 'Individual';
  };

  const getDonorTypeClass = (type) => {
    return type === 'csr' ? 'donor-type--csr' : 'donor-type--individual';
  };

  if (loading && donors.length === 0) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader
          onRefresh={fetchDonors}
          refreshing={loading} 
            title="Registered Donors" 
            showBackButton={false}
            showAdd={true}
            addPath='/dms/donors/add'
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
          onRefresh={fetchDonors}
          refreshing={loading} 
          title="Registered Donors" 
          showBackButton={false}
          showFilterToggle
          filtersOpen={filtersOpen}
          onFilterToggle={toggleFilters}
          showAdd={true}
          addPath='/dms/donors/add'
        />
        
        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}
          {loading && <div className="loading">Loading...</div>}
          
          {/* Filters Section */}
          <CollapsibleFilters open={filtersOpen}>
          <div className="filters-section">
            <SearchFilter
              filterKey="search"
              label="Search"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="Search by name, email, phone..."
            />
            
            <DropdownFilter
              filterKey="donor_type"
              label="Donor Type"
              data={donorTypeOptions}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All Types"
            />

            <DropdownFilter
              filterKey="source"
              label="Donor source"
              data={donorSourceFilterOptions}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All sources"
            />

            <DropdownFilter
              filterKey="pipeline_stage"
              label="Pipeline Stage"
              data={DONOR_PIPELINE_FILTER_OPTIONS.filter((o) => o.value !== '')}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All Stages"
            />
            
            <DropdownFilter
              filterKey="donation_type"
              label="Donation Type"
              data={donationTypeOptions}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All Donation Types"
            />
            
            <DropdownFilter
              filterKey="multi_time_donors"
              label="Multi-Time Donors"
              data={multiTimeDonorsOptions}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All"
            />
            
            <DropdownFilter
              filterKey="is_mature_donor"
              label="Matured Donors"
              data={matureDonorOptions}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All donors"
            />

            <DropdownFilter
              filterKey="recurring"
              label="Recurring Donors"
              data={recurringOptions}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All"
            />

            <HybridDropdown
              label="Total Donated Amount"
              placeholder="Type or select amount..."
              options={donatedAmountOptions}
              value={tempFilters.donated_amount}
              onChange={(value) => handleFilterChange('donated_amount', value)}
              allowCustom={true}
            />

            <DropdownFilter
              filterKey="donated_amount_operator"
              label="Donated Amount Operator"
              data={donatedAmountOperatorOptions}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="Select operator"
            />

            <SearchableDropdown
              label="Donor Assigned"
              placeholder={
                canSearchAssignees
                  ? 'Select all, Me, or type to search users...'
                  : 'Select all or Me...'
              }
              staticOptions={assignedFilterStaticOptions}
              onSearch={searchAssignedUsers}
              onSelect={handleAssignedUserSelect}
              onClear={handleAssignedUserClear}
              value={selectedAssignedUser}
              displayKey="first_name"
              debounceDelay={400}
              minSearchLength={2}
              allowResearch={true}
              renderOption={(assignee, index) => (
                <>
                  <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                    {assignee.first_name}
                    {assignee.last_name ? ` ${assignee.last_name}` : ''}
                  </div>
                  {assignee.email && (
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {assignee.email}
                    </div>
                  )}
                  {assignee.department && (
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                      {assignee.department} • {assignee.role || 'User'}
                    </div>
                  )}
                </>
              )}
            />
               
            {/* <DateFilter
              filterKey="date"
              label="Registration Date"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
            />
            
            <DateRangeFilter
              startKey="start_date"
              endKey="end_date"
              label="Date Range"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
            /> */}
            
            {/* Filter Action Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              alignItems: 'flex-end',
              marginTop: '20px',
              width: '100%'
            }}>
              <SearchButton
                onClick={handleApplyFilters}
                text="Search"
                loading={loading}
              />
              <ClearButton
                onClick={handleClearFilters}
                text="Clear"
              />
              {canExportCsv && (
                <DownloadCSV
                  data={prepareCSVData()}
                  filename={getCSVFilename()}
                  columns={csvColumns}
                  buttonText="Download as CSV"
                  disabled={loading || donors.length === 0}
                />
              )}
              {canImportCsv && (
                <DataImport
                  entityName="donors"
                  buttonText="Import CSV"
                  disabled={loading}
                  onImportComplete={() => fetchDonors()}
                />
              )}
            </div>
          </div>
          </CollapsibleFilters>
          
          {selectedCount > 0 && (
            <div className="list-selection-bar">
              <span className="list-selection-bar__count">
                {selectedCount} donor{selectedCount === 1 ? '' : 's'} selected
              </span>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={handleActionsForSelected}
                >
                  Actions
                </button>
                <button
                  type="button"
                  className="list-selection-bar__clear"
                  onClick={clearSelection}
                >
                  Clear selection
                </button>
              </div>
            </div>
          )}

          {hasActiveFilters && (
            <div className="list-selection-bar">
              <span className="list-selection-bar__count">
                Filters applied — actions for all matching donors ({totalItems})
              </span>
              <button
                type="button"
                className="primary-btn"
                onClick={handleActionsForFiltered}
              >
                Actions for filtered donors
              </button>
            </div>
          )}

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="table-select-col">
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={toggleAllOnPage}
                      disabled={donors.length === 0}
                      aria-label="Select all donors on this page"
                    />
                  </th>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Pipeline</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Registration Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {donors.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="no-data">
                      No donors found
                    </td>
                  </tr>
                ) : (
                  donors.map((donor) => (
                    <tr key={donor.id} className={isSelected(donor.id) ? 'row-selected' : ''}>
                      <td className="table-select-col">
                        <input
                          type="checkbox"
                          checked={isSelected(donor.id)}
                          onChange={() => toggleOne(donor.id)}
                          aria-label={`Select ${donor.name || 'donor'}`}
                        />
                      </td>
                      <td>
                        <div className={`donor-type ${getDonorTypeClass(donor.donor_type)}`}>
                          {getDonorTypeIcon(donor.donor_type)}
                          <span>{getDonorTypeLabel(donor.donor_type)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="donor-info">
                          <Link
                            to={`/dms/donors/view/${donor.id}`}
                            className="donor-name"
                            style={{ color: 'inherit', textDecoration: 'inherit' }}
                          >
                            {donor.name}
                            {donor._pending_sync && (
                              <span
                                style={{
                                  marginLeft: 8,
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  color: '#b45309',
                                  background: '#fef3c7',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                }}
                              >
                                Pending sync
                              </span>
                            )}
                          </Link>
                          {donor.donor_type === 'csr' && (
                            <div className="company-name">CSR contact</div>
                          )}
                        </div>
                      </td>
                      <td>
                        {formatPipelineStage(
                          donor.effective_pipeline_stage || donor.pipeline_stage,
                        )}
                      </td>
                      <td>{donor.email}</td>
                      <td>{donor.phone}</td>
                      <td>{donor.city}</td>
                      <td>{new Date(donor.created_at).toLocaleDateString()}</td>
                      <td>
                        <ActionMenu actions={getDonorActions(donor)} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {donors.length > 0 && (
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
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        text={`Are you sure you want to delete donor "${donorToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      <Modal
        open={revealModalOpen}
        onClose={closeRevealModal}
        title={revealModalTitle || 'Reveal Password'}
        details={{
          Status: revealLoading ? 'Loading...' : revealError ? 'Error' : 'Success',
          ...(revealError ? { Message: revealError } : {}),
          ...(revealedPassword ? { Password: revealedPassword } : {}),
          Note: 'Password is shown for operational use only. Close this dialog when done.',
        }}
      />

      <DonorBulkActionsModal
        isOpen={bulkActionsOpen}
        onClose={handleBulkActionsClose}
        audienceMode={bulkAudienceMode}
        donorIds={bulkDonorIds}
        donorFilters={bulkDonorFilters}
        selectedCount={bulkAudienceMode === 'manual' ? bulkDonorIds.length : 0}
        matchedHint={bulkAudienceMode === 'filters' ? totalItems : null}
        onSendSuccess={handleBulkSendSuccess}
      />
    </>
  );
};

export default DonorsList;