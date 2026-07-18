import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import ConfirmationModal from '../../../common/ConfirmationModal';
import Pagination from '../../../common/Pagination';
import { DownloadCSV } from '../../../common/download';
import { SearchFilter, DropdownFilter, DateFilter, DateRangeFilter } from '../../../common/filters';
import { ClearButton } from '../../../common/filters/index';
import { SearchButton } from '../../../common/filters/index';
import HybridDropdown from '../../../common/HybridDropdown';

import { FiEye, FiTrash2, FiBox, FiMapPin } from 'react-icons/fi';

const DonationBoxList = () => {
  const navigate = useNavigate();
  const [donationBoxes, setDonationBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [boxToDelete, setBoxToDelete] = useState(null);
  
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
    status: '',
    box_type: '',
    region: '',
    city: '',
    date: '',
    start_date: '',
    end_date: '',
    frd_officer: ''
  });

  // Applied filters - Actually sent to API
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    status: '',
    box_type: '',
    region: '',
    city: '',
    date: '',
    start_date: '',
    end_date: '',
    frd_officer: ''
  });

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
      // If filters haven't changed, force refresh by calling fetchDonationBoxes
      fetchDonationBoxes();
    }
  };

  // Clear filters - Triggered by Clear button
  const handleClearFilters = () => {
    const emptyFilters = {
      search: '',
      status: '',
      box_type: '',
      region: '',
      city: '',
      date: '',
      start_date: '',
      end_date: '',
      frd_officer: ''
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
    fetchDonationBoxes();
  }, [currentPage, pageSize, sortField, sortOrder, appliedFilters]);

  const fetchDonationBoxes = async () => {
    try {
      setLoading(true);
      
      // Prepare filter payload
      const filterPayload = {
        pagination: {
          page: currentPage,
          pageSize: pageSize,
          sortField: sortField,
          sortOrder: sortOrder
        },
        filters: {
          // Basic filters
          search: appliedFilters.search,
          status: appliedFilters.status,
          box_type: appliedFilters.box_type,
          region: appliedFilters.region,
          city: appliedFilters.city,
          frd_officer: appliedFilters.frd_officer,
          
          // Date filters
          date: appliedFilters.date,
          start_date: appliedFilters.start_date,
          end_date: appliedFilters.end_date
        }
      };
      
      const response = await axiosInstance.get('/donation-box', filterPayload);  
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
      'inactive': { class: 'status-cancelled', text: 'Inactive' },
      'maintenance': { class: 'status-pending', text: 'Maintenance' },
      'damaged': { class: 'status-failed', text: 'Damaged' },
      'retired': { class: 'status-cancelled', text: 'Retired' },
      'pending': { class: 'status-pending', text: 'Pending' }
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

  const getActionMenuItems = (donationBox) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#4CAF50',
      onClick: () => navigate(`/dms/donation_box/view/${donationBox.id}`),
      visible: true
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
    { value: 'box_id_no', label: 'Box ID' },
    { value: 'shop_name', label: 'Shop Name' },
    { value: 'box_type', label: 'Box Type' },
    { value: 'status', label: 'Status' },
    { value: 'region', label: 'Region' }
  ];

  // Filter options
  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'damaged', label: 'Damaged' },
    { value: 'retired', label: 'Retired' },
    { value: 'pending', label: 'Pending' }
  ];

  const boxTypeOptions = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'medium_star', label: 'Medium/Star' },
    { value: 'premium', label: 'Premium' },
    { value: 'standard', label: 'Standard' }
  ];

  const regionOptions = [
    { value: 'karachi', label: 'Karachi' },
    { value: 'lahore', label: 'Lahore' },
    { value: 'islamabad', label: 'Islamabad' },
    { value: 'rawalpindi', label: 'Rawalpindi' },
    { value: 'faisalabad', label: 'Faisalabad' },
    { value: 'multan', label: 'Multan' },
    { value: 'peshawar', label: 'Peshawar' },
    { value: 'quetta', label: 'Quetta' },
    { value: 'hyderabad', label: 'Hyderabad' },
    { value: 'sukkur', label: 'Sukkur' }
  ];

  const cityOptions = [
    { value: 'karachi', label: 'Karachi' },
    { value: 'lahore', label: 'Lahore' },
    { value: 'islamabad', label: 'Islamabad' },
    { value: 'rawalpindi', label: 'Rawalpindi' },
    { value: 'faisalabad', label: 'Faisalabad' },
    { value: 'multan', label: 'Multan' },
    { value: 'peshawar', label: 'Peshawar' },
    { value: 'quetta', label: 'Quetta' },
    { value: 'hyderabad', label: 'Hyderabad' },
    { value: 'sukkur', label: 'Sukkur' }
  ];

  const frdOfficerOptions = [
    { value: 'faisal_maqbool', label: 'Faisal Maqbool' },
    { value: 'ahmed_khan', label: 'Ahmed Khan' },
    { value: 'sara_ahmed', label: 'Sara Ahmed' },
    { value: 'muhammad_ali', label: 'Muhammad Ali' },
    { value: 'fatima_raza', label: 'Fatima Raza' },
    { value: 'hassan_malik', label: 'Hassan Malik' }
  ];

  // CSV Download Configuration
  const csvColumns = [
    { key: 'id', label: 'ID' },
    { key: 'box_id_no', label: 'Box ID' },
    { key: 'key_no', label: 'Key No' },
    { key: 'region', label: 'Region' },
    { key: 'city', label: 'City' },
    { key: 'frd_officer_reference', label: 'FRD Officer' },
    { key: 'shop_name', label: 'Shop Name' },
    { key: 'shopkeeper', label: 'Shopkeeper' },
    { key: 'cell_no', label: 'Cell No' },
    { key: 'landmark_marketplace', label: 'Landmark' },
    { key: 'route', label: 'Route' },
    { key: 'box_type', label: 'Box Type' },
    { key: 'active_since', label: 'Active Since' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Created Date' }
  ];

  // Prepare CSV data with formatted values
  const prepareCSVData = () => {
    return donationBoxes.map(box => ({
      ...box,
      box_id_no: box.box_id_no || '-',
      key_no: box.key_no || '-',
      region: box.region || '-',
      city: box.city || '-',
      frd_officer_reference: box.frd_officer_reference || '-',
      shop_name: box.shop_name || '-',
      shopkeeper: box.shopkeeper || '-',
      cell_no: box.cell_no || '-',
      landmark_marketplace: box.landmark_marketplace || '-',
      route: box.route || '-',
      box_type: box.box_type || '-',
      active_since: box.active_since ? new Date(box.active_since).toLocaleDateString() : '-',
      status: box.status || 'pending',
      created_at: box.created_at ? new Date(box.created_at).toLocaleDateString() : '-'
    }));
  };

  // Generate filename with current date
  const getCSVFilename = () => {
    const today = new Date().toISOString().split('T')[0];
    return `donation-boxes-${today}`;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader 
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
          title="Donation Boxes" 
          showBackButton={false} 
          showAdd={true}
          addPath='/dms/donation_box/add'
        />
        
        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}
          
          {/* Filters Section */}
          {/* <div className="filters-section" style={{ 
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
              placeholder="Search by box ID, shop name, shopkeeper..."
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
              filterKey="region"
              label="Region"
              data={regionOptions}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All Regions"
            />
            
            <DropdownFilter
              filterKey="city"
              label="City"
              data={cityOptions}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All Cities"
            />
            
            <HybridDropdown
              label="FRD Officer"
              placeholder="Type or select officer..."
              options={frdOfficerOptions}
              value={tempFilters.frd_officer}
              onChange={(value) => handleFilterChange('frd_officer', value)}
              allowCustom={true}
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
            </div>
          </div> */}
          
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Box ID</th>
                  <th>Shop Name</th>
                  <th>Location</th>
                  <th>Box Type</th>
                  <th className="hide-on-mobile">Shopkeeper</th>
                  <th className="hide-on-mobile">Cell No</th>
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
                        <div className="box-id">{box.box_id_no}</div>
                        {box.key_no && (
                          <div className="box-key hide-on-mobile">Key: {box.key_no}</div>
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
                        <div className="location-main">{box.city}, {box.region}</div>
                        {box.landmark_marketplace && (
                          <div className="location-landmark hide-on-mobile">{box.landmark_marketplace}</div>
                        )}
                      </div>
                    </td>
                    <td>{getBoxTypeBadge(box.box_type)}</td>
                    <td className="hide-on-mobile">{box.shopkeeper || '-'}</td>
                    <td className="hide-on-mobile">{box.cell_no || '-'}</td>
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
          
          {/* <div className="list-header">
            <DownloadCSV
              data={prepareCSVData()}
              filename={getCSVFilename()}
              columns={csvColumns}
              buttonText="Export to CSV"
              onDownloadStart={() => console.log('Downloading donation boxes CSV...')}
              onDownloadComplete={() => console.log('Download complete!')}
            />
          </div> */}
          
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
