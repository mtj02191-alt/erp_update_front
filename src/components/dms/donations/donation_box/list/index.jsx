import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import ActionMenu from '../../../../common/ActionMenu';
import ConfirmationModal from '../../../../common/ConfirmationModal';
import Pagination from '../../../../common/Pagination';
import { DownloadCSV } from '../../../../common/download';
import { SearchFilter, DateFilter, DateRangeFilter } from '../../../../common/filters';
import { ClearButton, SearchButton } from '../../../../common/filters/index';
import FormInput from '../../../../common/FormInput';

import { FiEye, FiTrash2, FiDollarSign, FiCalendar, FiBox, FiTrendingUp } from 'react-icons/fi';

const DonationBoxDonationsList = () => {
  const navigate = useNavigate();
  const { id: donationBoxId } = useParams(); // Get donation box ID from URL if present
  const [donations, setDonations] = useState([]);
  const [donationBoxInfo, setDonationBoxInfo] = useState(null); // Store donation box info if filtering by ID
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [donationToDelete, setDonationToDelete] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('collection_date');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Filter state - Temporary filters (not applied until search button is clicked)
  const [tempFilters, setTempFilters] = useState({
    search: '',
    min_amount: '',
    max_amount: '',
    date: '',
    start_date: '',
    end_date: ''
  });

  // Applied filters - Actually sent to API
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    min_amount: '',
    max_amount: '',
    date: '',
    start_date: '',
    end_date: ''
  });

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
      fetchDonations();
    }
  };

  // Clear filters - Triggered by Clear button
  const handleClearFilters = () => {
    const emptyFilters = {
      search: '',
      min_amount: '',
      max_amount: '',
      date: '',
      start_date: '',
      end_date: ''
    };
    
    const filtersAreEmpty = JSON.stringify(appliedFilters) === JSON.stringify(emptyFilters);
    
    if (!filtersAreEmpty) {
      setTempFilters(emptyFilters);
      setAppliedFilters(emptyFilters);
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
  }, [currentPage, pageSize, sortField, sortOrder, appliedFilters, donationBoxId]);

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

  const fetchDonations = async () => {
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
          search: appliedFilters.search,
          min_amount: appliedFilters.min_amount,
          max_amount: appliedFilters.max_amount,
          date: appliedFilters.date,
          start_date: appliedFilters.start_date,
          end_date: appliedFilters.end_date
        }
      };

      // Conditional API call based on URL params
      let response;
      if (donationBoxId) {
        // Get donations for specific donation box
        response = await axiosInstance.get(`/donation-box-donation/box/${donationBoxId}`, filterPayload);
      } else {
        // Get all donation box donations
        response = await axiosInstance.get('/donation-box-donation', filterPayload); 
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
        await axiosInstance.delete(`/dms/donation-box-donations/${donationToDelete.id}`);
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
      onClick: () => navigate(`/dms/donation-box-donations/view/${donation.id}`, { state: { donation } }),
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
  ];

  // CSV Download Configuration
  const csvColumns = [
    { key: 'id', label: 'ID' },
    { key: 'box_id_no', label: 'Box Number' },
    { key: 'shop_name', label: 'Shop Name' },
    { key: 'shopkeeper', label: 'Shopkeeper' },
    { key: 'location', label: 'Location' },
    { key: 'collection_amount', label: 'Collection Amount' },
    { key: 'collection_date', label: 'Collection Date' },
  ];

  // Prepare CSV data with formatted values
  const prepareCSVData = () => {
    return donations.map(donation => ({
      id: donation.id,
      box_id_no: donation.donation_box?.box_id_no || '-',
      shop_name: donation.donation_box?.shop_name || '-',
      shopkeeper: donation.donation_box?.shopkeeper || '-',
      location: donation.donation_box ? `${donation.donation_box.city}, ${donation.donation_box.region}` : '-',
      collection_amount: donation.collection_amount || 0,
      collection_date: donation.collection_date ? new Date(donation.collection_date).toLocaleDateString() : '-',
      created_at: donation.created_at ? new Date(donation.created_at).toLocaleDateString() : '-'
    }));
  };

  // Generate filename with current date
  const getCSVFilename = () => {
    const today = new Date().toISOString().split('T')[0];
    if (donationBoxId && donationBoxInfo) {
      return `donation-box-${donationBoxInfo.box_id_no}-collections-${today}`;
    }
    return `donation-box-collections-${today}`;
  };

  // Get back path based on context
  const getBackPath = () => {
    if (donationBoxId) {
      return `/dms/donation_box/view/${donationBoxId}`;
    }
    return null;
  };

  if (loading && !donations.length) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader 
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
            title = 'Donation Box Collections'  
            showBackButton={!!donationBoxId} 
            backPath={getBackPath()}
            showAdd={true}
            addPath= {donationBoxId ? `/dms/donation-box-donations/add/${donationBoxId}` : '/dms/donation-box-donations/add'}
        />
        
        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}
          
          {/* Donation Box Info Card (only when filtering by specific box) */}
          {/* {donationBoxId && donationBoxInfo && (
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#f0f9ff', 
              borderRadius: '8px',
              border: '1px solid #bae6fd',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '1.1em', fontWeight: '600', color: '#0369a1', marginBottom: '12px' }}>
                <FiBox style={{ display: 'inline', marginRight: '8px' }} />
                Donation Box Information
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div>
                  <div style={{ fontSize: '0.85em', color: '#666' }}>Key</div>
                  <div style={{ fontWeight: '600', color: '#333' }}>{donationBoxInfo.key_no}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85em', color: '#666' }}>Shop Name</div>
                  <div style={{ fontWeight: '600', color: '#333' }}>{donationBoxInfo.shop_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85em', color: '#666' }}>Shopkeeper</div>
                  <div style={{ fontWeight: '600', color: '#333' }}>{donationBoxInfo.shopkeeper || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85em', color: '#666' }}>Location</div>
                  <div style={{ fontWeight: '600', color: '#333' }}>{donationBoxInfo.city}, {donationBoxInfo.region}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85em', color: '#666' }}>Box Type</div>
                  <div style={{ fontWeight: '600', color: '#333', textTransform: 'capitalize' }}>{donationBoxInfo.box_type}</div>
                </div>
              </div>
            </div>
          )} */}
          
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
              placeholder="Search by key number, shopkeeper name..."
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
          </div>
           */}
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
                  <th className="table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {donations.map(donation => (
                  <tr key={donation.id}>
                    <td>
                      <div style={{ fontWeight: '600', color: '#0369a1' }}>
                        COL-{donation.id}
                      </div>
                    </td>
                    {!donationBoxId && (
                      <td>
                        <div className="box-info">
                          <div style={{ fontWeight: '600', color: '#333' }}>
                            <FiBox style={{ display: 'inline', marginRight: '5px' }} />
                            Key: {donation.donation_box?.key_no || 'N/A'}
                          </div>
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
                    <td className="table-actions">
                      <ActionMenu actions={getActionMenuItems(donation)} />
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
              onDownloadStart={() => console.log('Downloading donation box collections CSV...')}
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

