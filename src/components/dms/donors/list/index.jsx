import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import { useAuth } from '../../../../context/AuthContext';
import { fundRaisingDonorsHas } from '../../../../utils/permissions';
import Navbar from '../../../Navbar'; 
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import ConfirmationModal from '../../../common/ConfirmationModal';
import Modal from '../../../common/Modal';
import Pagination from '../../../common/Pagination';
import { SearchFilter, DropdownFilter, DateFilter, DateRangeFilter } from '../../../common/filters';
import { SearchButton, ClearButton } from '../../../common/filters';
import { DownloadCSV } from '../../../common/download';
import DataImport from '../../../common/DataImport';
import { FiEye, FiEdit, FiTrash2, FiUser, FiKey } from 'react-icons/fi';
import { BsFillBuildingsFill } from "react-icons/bs";
import FormInput from '../../../common/FormInput';

const DonorsList = () => {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [donorToDelete, setDonorToDelete] = useState(null);
  const [revealModalOpen, setRevealModalOpen] = useState(false);
  const [revealModalTitle, setRevealModalTitle] = useState('');
  const [revealedPassword, setRevealedPassword] = useState('');
  const [revealError, setRevealError] = useState('');
  const [revealLoading, setRevealLoading] = useState(false);
  
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
    recurring: null
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
    recurring: null
  });

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
    { key: 'company_name', label: 'Company' },
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
      recurring: null
    };
    
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
      if (!params.source) {
        delete params.source;
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
      onClick: () => navigate(`/dms/donors/view/${donor.id}`),  
      visible: true
    },
    {
      icon: <FiEdit />,
      label: 'Edit',
      color: '#ff9800',
      onClick: () => navigate(`/dms/donors/edit/${donor.id}`),
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

  const recurringOptions = [
    { value: 'true', label: 'Yes' },
    { value: 'false', label: 'No' },
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

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading donors...</p>
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
          title="Registered Donors" 
          showBackButton={false} 
          showAdd={true}
          addPath='/dms/donors/add'
        />
        
        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}
          
          {/* Filters Section */}
          <div className="filters-section" style={{ 
            display: 'flex', 
            gap: '20px', 
            flexWrap: 'wrap', 
            marginBottom: '20px',
            padding: '20px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px'
          }}>
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
              filterKey="recurring"
              label="Recurring Donors"
              data={recurringOptions}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All"
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
          
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Name</th>
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
                    <td colSpan="7" className="no-data">
                      No donors found
                    </td>
                  </tr>
                ) : (
                  donors.map((donor) => (
                    <tr key={donor.id}>
                      <td>
                        <div className={`donor-type ${getDonorTypeClass(donor.donor_type)}`}>
                          {getDonorTypeIcon(donor.donor_type)}
                          <span>{getDonorTypeLabel(donor.donor_type)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="donor-info">
                          <div className="donor-name">{donor.name}</div>
                          {donor.donor_type === 'csr' && donor.company_name && (
                            <div className="company-name">{donor.company_name}</div>
                          )}
                        </div>
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
    </>
  );
};

export default DonorsList;