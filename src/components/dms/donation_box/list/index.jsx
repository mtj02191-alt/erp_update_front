import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import ConfirmationModal from '../../../common/ConfirmationModal';
import Pagination from '../../../common/Pagination';
import DataImport from '../../../common/DataImport';
import { useAuth } from '../../../../context/AuthContext';
import { hasPermission } from '../../../../utils/permissions';
import {
  SearchFilter,
  DropdownFilter,
  DateFilter,
  DateRangeFilter,
  CollapsibleFilters,
  TeamFilter,
  defaultTeamFilterState,
  appendTeamFilterParams,
} from '../../../common/filters';
import { ClearButton, SearchButton } from '../../../common/filters/index';
import SearchableDropdown from '../../../common/SearchableDropdown';
import usePersistedFilters from '../../../../hooks/usePersistedFilters';
import useFiltersPanel from '../../../../hooks/useFiltersPanel';

import { FiEye, FiEdit2, FiTrash2, FiPlusCircle } from 'react-icons/fi';

const EMPTY_FILTERS = {
  search: '',
  status: '',
  box_type: '',
  frequency: '',
  region_id: '',
  city_id: '',
  route_id: '',
  assigned_user_id: '',
  date: '',
  start_date: '',
  end_date: '',
  ...defaultTeamFilterState(),
};

const DonationBoxList = () => {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const [donationBoxes, setDonationBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [boxToDelete, setBoxToDelete] = useState(null);
  const [regionCatalog, setRegionCatalog] = useState([]);
  const [cityCatalog, setCityCatalog] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const { filtersOpen, toggleFilters } = useFiltersPanel();

  const [paginationState, setPaginationState] = usePersistedFilters(
    'donation-box-list:pagination',
    { currentPage: 1, pageSize: 10, sortField: 'created_at', sortOrder: 'DESC' },
  );
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
    'donation-box-list:temp',
    EMPTY_FILTERS,
  );
  const [appliedFilters, setAppliedFilters, clearAppliedFilters] = usePersistedFilters(
    'donation-box-list:applied',
    EMPTY_FILTERS,
  );

  // Universal filter change handler - Updates temporary filters only
  const handleFilterChange = (key, value) => {
    setTempFilters(prev => ({
      ...prev,
      [key]: value
    }));
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
      handleRefresh();
    }
  };

  const handleClearFilters = () => {
    const filtersAreEmpty =
      JSON.stringify(appliedFilters) === JSON.stringify(EMPTY_FILTERS);

    if (!filtersAreEmpty) {
      clearTempFilters();
      clearAppliedFilters();
      setSelectedAssignee(null);
      setSelectedRegion(null);
      setSelectedCity(null);
      setCurrentPage(1);
    }
  };

  useEffect(() => {
    const loadGeoCatalogs = async () => {
      try {
        const [regionsRes, citiesRes] = await Promise.all([
          axiosInstance.get('/regions', { params: { country_id: 1 } }),
          axiosInstance.get('/cities', { params: { country_id: 1 } }),
        ]);
        if (regionsRes.data?.success) {
          setRegionCatalog(regionsRes.data.data || []);
        }
        if (citiesRes.data?.success) {
          setCityCatalog(citiesRes.data.data || []);
        }
      } catch (err) {
        console.error('Error loading geographic catalogs:', err);
      }
    };
    loadGeoCatalogs();
  }, []);

  // Restore selected geo labels when persisted filter IDs exist.
  useEffect(() => {
    if (!selectedRegion && tempFilters.region_id && regionCatalog.length) {
      const match = regionCatalog.find(
        (r) => String(r.id) === String(tempFilters.region_id),
      );
      if (match) setSelectedRegion(match);
    }
    if (!selectedCity && tempFilters.city_id && cityCatalog.length) {
      const match = cityCatalog.find(
        (c) => String(c.id) === String(tempFilters.city_id),
      );
      if (match) setSelectedCity(match);
    }
  }, [
    regionCatalog,
    cityCatalog,
    tempFilters.region_id,
    tempFilters.city_id,
    selectedRegion,
    selectedCity,
  ]);

  const filterByName = (rows, term) => {
    const q = String(term || '').trim().toLowerCase();
    if (!q) return rows.slice(0, 30);
    return rows
      .filter((row) => String(row.name || '').toLowerCase().includes(q))
      .slice(0, 30);
  };

  const searchRegions = async (term) => filterByName(regionCatalog, term);
  const searchCities = async (term) => filterByName(cityCatalog, term);

  const handleRegionSelect = (region) => {
    setSelectedRegion(region);
    setTempFilters((prev) => ({
      ...prev,
      region_id: region?.id ? String(region.id) : '',
    }));
  };

  const handleRegionClear = () => {
    setSelectedRegion(null);
    setTempFilters((prev) => ({ ...prev, region_id: '' }));
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setTempFilters((prev) => ({
      ...prev,
      city_id: city?.id ? String(city.id) : '',
    }));
  };

  const handleCityClear = () => {
    setSelectedCity(null);
    setTempFilters((prev) => ({ ...prev, city_id: '' }));
  };

  const handleAssigneeSelect = (user) => {
    setSelectedAssignee(user);
    setTempFilters((prev) => ({
      ...prev,
      assigned_user_id: user?.id ? String(user.id) : '',
    }));
  };

  const handleAssigneeClear = () => {
    setSelectedAssignee(null);
    setTempFilters((prev) => ({ ...prev, assigned_user_id: '' }));
  };

  useEffect(() => {
    fetchDonationBoxes();
  }, [currentPage, pageSize, sortField, sortOrder, appliedFilters, listRefreshNonce]);

  const handleRefresh = () => setListRefreshNonce((n) => n + 1);

  const buildListParams = () => {
    const params = {
      page: currentPage,
      pageSize,
      sortField,
      sortOrder,
      ...appliedFilters,
    };
    appendTeamFilterParams(params, appliedFilters);
    Object.keys(params).forEach((key) => {
      if (params[key] === '' || params[key] == null) {
        delete params[key];
      }
    });
    return params;
  };

  const fetchDonationBoxes = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/donation-box', {
        params: buildListParams(),
      });
      if (response.data.success) {
        setDonationBoxes(response.data.data || []);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        setError('Failed to fetch donation boxes');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch donation boxes');
      console.error('Error fetching donation boxes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleSortChange = (field, order) => {
    setSortField(field);
    setSortOrder(order);
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handleDeleteClick = (donationBox) => {
    setBoxToDelete(donationBox);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (boxToDelete) {
      try {
        await axiosInstance.delete(`/dms/donation-boxes/${boxToDelete.id}`);
        // Refresh the current page after deletion
        fetchDonationBoxes();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete donation box');
        console.error('Error deleting donation box:', err);
      }
    }
    setShowDeleteModal(false);
    setBoxToDelete(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setBoxToDelete(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'active': { class: 'status-completed', text: 'Active' },
      'inactive': { class: 'status-cancelled', text: 'In Active' },
      'removed': { class: 'status-cancelled', text: 'Removed' },
      'broken': { class: 'status-failed', text: 'Broken' },
      'snr': { class: 'status-pending', text: 'SNR' },
    };
    
    const statusInfo = statusMap[status] || { class: 'status-pending', text: status };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  const getBoxTypeBadge = (boxType) => {
    const typeMap = {
      'small': { class: 'box-type-small', text: 'Small' },
      'medium': { class: 'box-type-medium', text: 'Medium' },
      'large': { class: 'box-type-large', text: 'Large' },
      'medium_star': { class: 'box-type-premium', text: 'Medium/Star' },
      'premium': { class: 'box-type-premium', text: 'Premium' },
      'standard': { class: 'box-type-standard', text: 'Standard' }
    };
    
    const typeInfo = typeMap[boxType] || { class: 'box-type-standard', text: boxType };
    return <span className={`box-type-badge ${typeInfo.class}`}>{typeInfo.text}</span>;
  };

  const canImportCsv = useMemo(() => {
    if (!permissions) return false;
    return (
      permissions.super_admin === true ||
      hasPermission(permissions, 'fund_raising', 'donation_box', 'create')
    );
  }, [permissions]);

  const canUpdateBox = useMemo(() => {
    if (!permissions) return false;
    return (
      permissions.super_admin === true ||
      permissions.fund_raising_manager === true ||
      hasPermission(permissions, 'fund_raising', 'donation_box', 'update')
    );
  }, [permissions]);

  const canAddDonation = useMemo(() => {
    if (!permissions) return false;
    return (
      permissions.super_admin === true ||
      hasPermission(permissions, 'fund_raising', 'donation_box_donations', 'create')
    );
  }, [permissions]);

  const getActionMenuItems = (donationBox) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#4CAF50',
      to: `/dms/donation_box/view/${donationBox.id}`,
      visible: true
    },
    {
      icon: <FiEdit2 />,
      label: 'Update / Relocate',
      color: '#2196F3',
      to: `/dms/donation_box/edit/${donationBox.id}`,
      visible: canUpdateBox
    },
    {
      icon: <FiPlusCircle />,
      label: 'Add Donation',
      color: '#16a34a',
      to: `/dms/donation-box-donations/add/${donationBox.id}`,
      visible: canAddDonation
    },
    {
      icon: <FiTrash2 />,
      label: 'Delete',
      color: '#f44336',
      onClick: () => handleDeleteClick(donationBox),
      visible: true
    }
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Created Date' },
    { value: 'active_since', label: 'Active Since' },
    { value: 'key_no', label: 'Key No' },
    { value: 'shop_name', label: 'Shop Name' },
    { value: 'box_type', label: 'Box Type' },
    { value: 'status', label: 'Status' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'In Active' },
    { value: 'removed', label: 'Removed' },
    { value: 'broken', label: 'Broken' },
    { value: 'snr', label: 'SNR' },
  ];

  const boxTypeOptions = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'custom', label: 'Custom' },
  ];

  const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'bi-weekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'as-needed', label: 'As needed' },
  ];

  const getLocationLabel = (box) => {
    const cityName =
      box?.city?.name ||
      box?.route?.cities?.find((c) => c.id === box.city_id)?.name ||
      box.city ||
      '';
    const regionName = box?.route?.region?.name || box.region || '';
    if (cityName && regionName) return `${cityName}, ${regionName}`;
    return cityName || regionName || '—';
  };

  if (loading && donationBoxes.length === 0) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader
          onRefresh={handleRefresh}
          refreshing={loading} 
            title="Donation Boxes" 
            showBackButton={false} 
            showAdd={true}
            addPath='/dms/donation-boxes/add'
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
          title="Donation Boxes"
          showBackButton={false}
          showFilterToggle
          filtersOpen={filtersOpen}
          onFilterToggle={toggleFilters}
          showAdd={true}
          addPath="/dms/donation_box/add"
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
                placeholder="Search by key no, shop name, shopkeeper, route..."
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
                filterKey="box_type"
                label="Box Type"
                data={boxTypeOptions}
                filters={tempFilters}
                onFilterChange={handleFilterChange}
                placeholder="All Types"
              />

              <DropdownFilter
                filterKey="frequency"
                label="Collection Frequency"
                data={frequencyOptions}
                filters={tempFilters}
                onFilterChange={handleFilterChange}
                placeholder="All Frequencies"
              />

              <SearchableDropdown
                label="Region"
                placeholder="Search region..."
                onSearch={searchRegions}
                onSelect={handleRegionSelect}
                onClear={handleRegionClear}
                value={selectedRegion}
                displayKey="name"
                debounceDelay={300}
                minSearchLength={1}
                allowResearch
                renderOption={(region) => (
                  <>
                    <div style={{ fontWeight: 500 }}>{region.name}</div>
                    {region.country?.name && (
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {region.country.name}
                      </div>
                    )}
                  </>
                )}
              />

              <SearchableDropdown
                label="City"
                placeholder="Search city..."
                onSearch={searchCities}
                onSelect={handleCitySelect}
                onClear={handleCityClear}
                value={selectedCity}
                displayKey="name"
                debounceDelay={300}
                minSearchLength={1}
                allowResearch
                renderOption={(city) => (
                  <>
                    <div style={{ fontWeight: 500 }}>{city.name}</div>
                    {(city.region?.name || city.district?.name) && (
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {[city.region?.name, city.district?.name]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    )}
                  </>
                )}
              />

              <SearchableDropdown
                label="Assigned Officer"
                placeholder="Search fundraising users..."
                apiEndpoint="/users/options"
                apiParams={{ department: 'fund_raising' }}
                onSelect={handleAssigneeSelect}
                onClear={handleAssigneeClear}
                value={selectedAssignee}
                displayKey="first_name"
                debounceDelay={400}
                minSearchLength={2}
                allowResearch
              />

              <TeamFilter
                filters={tempFilters}
                onFilterChange={handleFilterChange}
              />

              <DateFilter
                filterKey="date"
                label="Active Since (exact)"
                filters={tempFilters}
                onFilterChange={handleFilterChange}
              />

              <DateRangeFilter
                startKey="start_date"
                endKey="end_date"
                label="Active Since Range"
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
                entityName="donation_box"
                buttonText="Import CSV"
                disabled={loading}
                onImportComplete={() => fetchDonationBoxes()}
              />
            </div>
          )}

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Box ID</th>
                  <th>Shop Name</th>
                  <th>Location</th>
                  <th>Box Type</th>
                  <th className="hide-on-mobile">Last Collection</th>
                  <th>Status</th>
                  <th>Active Since</th>
                  <th className="table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {donationBoxes.map(box => (
                  <tr key={box.id}>
                    <td>
                      <div className="box-info">
                        <Link
                          to={`/dms/donation_box/view/${box.id}`}
                          className="box-id"
                          style={{ color: 'inherit', textDecoration: 'inherit' }}
                        >
                          {box.box_id_no || 'N/A'}
                        </Link>
                        {box.route?.name && (
                          <div className="box-key hide-on-mobile">Route: {box.route.name}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="shop-info">
                        <div className="shop-name">{box.shop_name}</div>
                        {box.route && (
                          <div className="shop-route hide-on-mobile">Route: {box.route?.name}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="location-info">
                        <div className="location-main">{getLocationLabel(box)}</div>
                        {box.landmark_marketplace && (
                          <div className="location-landmark hide-on-mobile">{box.landmark_marketplace}</div>
                        )}
                      </div>
                    </td>
                    <td>{getBoxTypeBadge(box.box_type)}</td>
                    <td className="hide-on-mobile">{box.last_collection_date ? formatDate(box.last_collection_date) : '-'}</td>
                    <td>{getStatusBadge(box.status)}</td>
                    <td>{formatDate(box.active_since || box.created_at)}</td>
                    <td className="table-actions">
                      <ActionMenu actions={getActionMenuItems(box)} />
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
          
          {donationBoxes.length === 0 && totalItems === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <div className="empty-state-text">No donation boxes found</div>
              <div className="empty-state-subtext">Donation boxes will appear here once they are registered</div>
            </div>
          )}
        </div>
      </div>
      
      <ConfirmationModal
        isOpen={showDeleteModal}
        text={`Are you sure you want to delete donation box ${boxToDelete?.box_id_no} at ${boxToDelete?.shop_name}?`}
        delete={true}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};

export default DonationBoxList;
