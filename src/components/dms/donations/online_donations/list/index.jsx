import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
// import { truncate } from '../../../../../utils/functions/column_function';
import Pagination from '../../../../common/Pagination';
import { DownloadCSV } from '../../../../common/download';
import { SearchFilter, DropdownFilter, DateFilter, DateRangeFilter } from '../../../../common/filters';
import { ClearButton } from '../../../../common/filters/index';
import { SearchButton } from '../../../../common/filters/index';
import HybridDropdown from '../../../../common/HybridDropdown';
import SearchableDropdown from '../../../../common/SearchableDropdown';
import { getDate, getTime } from '../../../../../utils/functions';
import usePersistedFilters from '../../../../../hooks/usePersistedFilters';

import { FiEye, FiEdit2, FiTrash2, FiDollarSign, FiFileText, FiDownload, FiTrendingUp } from 'react-icons/fi';
import PageHeader from '../../../../common/PageHeader';
import Navbar from '../../../../Navbar';
import ActionMenu from '../../../../common/ActionMenu';
import ConfirmationModal from '../../../../common/ConfirmationModal';
import MultiSelect from '../../../../common/MultiSelect';

const OnlineDonationsList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const urlDonorId = searchParams.get('donor_id'); // Get donor_id from URL query param
  const isOnlineRoute = location.pathname.includes('/donations/online_donations');
  const isOfflineRoute = location.pathname.includes('/donations/offline_donations');
  
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [donationToDelete, setDonationToDelete] = useState(null);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [totalDonationAmount, setTotalDonationAmount] = useState(0);
  const [workflowTemplates, setWorkflowTemplates] = useState([]);
  
  // Report generation state
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportMessage, setReportMessage] = useState({ type: '', text: '' });
  const [showCustomReportModal, setShowCustomReportModal] = useState(false);
  const [customReportDates, setCustomReportDates] = useState({
    startDate: '',
    endDate: '',
    type: 'daily'
  });
  
  // Pagination state — persisted so it survives navigation
  const [paginationState, setPaginationState] = usePersistedFilters(
    'donations-online-list:pagination',
    { currentPage: 1, pageSize: 10, sortField: 'created_at', sortOrder: 'DESC' }
  );
  const { currentPage, pageSize, sortField, sortOrder } = paginationState;
  const setCurrentPage = (v) => setPaginationState(prev => ({ ...prev, currentPage: typeof v === 'function' ? v(prev.currentPage) : v }));
  const setPageSize = (v) => setPaginationState(prev => ({ ...prev, pageSize: v, currentPage: 1 }));
  const setSortField = (v) => setPaginationState(prev => ({ ...prev, sortField: v, currentPage: 1 }));
  const setSortOrder = (v) => setPaginationState(prev => ({ ...prev, sortOrder: v, currentPage: 1 }));

  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const EMPTY_FILTERS = {
    search: '',
    status: '',
    donation_type: '',
    donation_method: '',
    donation_source: '',
    progress_workflow_template_id: '',
    date: '',
    start_date: '',
    end_date: '',
    amount: '',
    ref: [],
    price_operator: '',
    donor_id: '',
    donor_search: '',
    orderId: '',
    relationsFilters: {
      donor: {
        search: '',
      }
    }
  };

  // Filter state - persisted across navigation via sessionStorage
  const [tempFilters, setTempFilters, clearTempFilters] = usePersistedFilters(
    'donations-online-list:temp', EMPTY_FILTERS
  );
  const [appliedFilters, setAppliedFilters, clearAppliedFilters] = usePersistedFilters(
    'donations-online-list:applied', EMPTY_FILTERS
  );

  // Initialize donor_id from URL on mount
  useEffect(() => {
    if (urlDonorId) {
      // Set donor_id from URL query param
      setTempFilters(prev => ({
        ...prev,
        donor_id: urlDonorId
      }));
      setAppliedFilters(prev => ({
        ...prev,
        donor_id: urlDonorId
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlDonorId]);

  // Load workflow templates for filtering
  useEffect(() => {
    const run = async () => {
      try {
        const res = await axiosInstance.get('/progress/workflow-templates');
        if (res.data?.success) setWorkflowTemplates(res.data.data || []);
      } catch (_) {
        // non-blocking
      }
    };
    run();
  }, []);

  // Universal filter change handler - Updates temporary filters only
  const handleFilterChange = (key, value) => {
    setTempFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Relational filters change handler - Updates nested relation filters in temporary filters
  const handleRelationalFilterChange = (relationKey, relationColumn, value) => {
    setTempFilters(prev => ({
      ...prev,
      relationsFilters: {
        ...(prev.relationsFilters || {}),
        [relationKey]: {
          ...(prev.relationsFilters?.[relationKey] || {}),
          [relationColumn]: value
        }
      }
    }));
  };

  // Specific handler to keep Search input controlled while updating relationsFilters
  const handleDonorSearchChange = (value) => {
    setTempFilters(prev => ({
      ...prev,
      donor_search: value,
      relationsFilters: {
        ...(prev.relationsFilters || {}),
        donor: {
          ...(prev.relationsFilters?.donor || {}),
          search: value
        }
      }
    }));
  };

  // Handle donor selection for filtering
  const handleDonorSelect = (donor) => {
    setSelectedDonor(donor);
    setTempFilters(prev => ({
      ...prev,
      donor_id: donor.id
    }));
  };

  // Handle donor clear
  const handleDonorClear = () => {
    setSelectedDonor(null);
    setTempFilters(prev => ({
      ...prev,
      donor_id: ''
    }));
  };

  // Apply filters - Triggered by Search button
  const handleApplyFilters = () => {
    // Check if filters have changed
    const filtersChanged = JSON.stringify(appliedFilters) !== JSON.stringify(tempFilters);
    
    console.log("Temp filters", tempFilters);
    // return;
    // Always include donor_id from URL if present
    const filtersToApply = { ...tempFilters };
    if (urlDonorId) {
      filtersToApply.donor_id = urlDonorId;
    }
    
    if (filtersChanged) {
      // If filters changed, apply them
      setAppliedFilters(filtersToApply);
      setCurrentPage(1);
    } else {
      // If filters haven't changed, force refresh by calling fetchDonations
      fetchDonations();
    }
  };

  // Clear filters - Triggered by Clear button
  const handleClearFilters = () => {
    setSelectedDonor(null);
    clearTempFilters();
    clearAppliedFilters();
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchDonations();
  }, [currentPage, pageSize, sortField, sortOrder, appliedFilters]);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      
      // Always include donor_id from URL if present
      const donorIdForFilter = urlDonorId || appliedFilters.donor_id;
      // Use relationsFilters directly from applied filters
      const relationsFiltersPayload = appliedFilters.relationsFilters || {};
      
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
          donation_type: appliedFilters.donation_type,
          donation_method: appliedFilters.donation_method,
          donation_source: appliedFilters.donation_source,
          progress_workflow_template_id: appliedFilters.progress_workflow_template_id || undefined,
          orderId: appliedFilters.orderId,
          
          // Date filters
          date: appliedFilters.date,
          start_date: appliedFilters.start_date,
          end_date: appliedFilters.end_date,
          
          // Donor filter - always use URL donor_id if present
          donor_id: donorIdForFilter,
          
          // Future filters can be easily added here
          // amount_range: { min: 1000, max: 50000 },
          // donor_categories: ['premium', 'regular'],
          // payment_status: ['completed', 'pending'],
          // locations: ['karachi', 'lahore', 'islamabad']
        },
          //multiselect filters like key will col name and value will be in a array and we will use IN operator in Backend 
          // 1 ref filter
          multiselectFilters: (() => {
           if(appliedFilters.ref && appliedFilters.ref.length > 0) {
            return {
              ref: appliedFilters.ref,
              }
            }
            return {};
          })(),
        relationsFilters: relationsFiltersPayload,
        hybrid_filters:[ {
          value: appliedFilters.amount,
          operator: appliedFilters.price_operator,
          column: 'amount',
        }
      ]
      };


      console.log("filterPayload", filterPayload);
      // return;
      
      //  adding endpoint for testing 
      // const test  = await axiosInstance.get('/payfast');
      // console.log("test", test.data?.data);
      // return;
      const response = await axiosInstance.post('/donations/search', filterPayload); 
      if (response.data.success) {
        setDonations(response.data.data || []);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotalDonationAmount(response.data.totalDonationAmount || 0);
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
  };

  const handleSortChange = (field, order) => {
    setPaginationState(prev => ({ ...prev, sortField: field, sortOrder: order, currentPage: 1 }));
  };

  const handleDeleteClick = (donation) => {
    setDonationToDelete(donation);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (donationToDelete) {
      try {
        await axiosInstance.delete(`/donations/${donationToDelete.id}`);
        // Refresh the current page after deletion
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

  // Report generation handlers
  const handleGenerateDailyReport = async () => {
    try {
      setGeneratingReport(true);
      setReportMessage({ type: '', text: '' });
      
      const response = await axiosInstance.post('/donations-report/daily', {});
      
      if (response.data.success) {
        setReportMessage({ 
          type: 'success', 
          text: 'Daily report generated and sent successfully via email!' 
        });
        // Clear message after 5 seconds
        setTimeout(() => setReportMessage({ type: '', text: '' }), 5000);
      } else {
        setReportMessage({ 
          type: 'error', 
          text: response.data.message || 'Failed to generate daily report' 
        });
      }
    } catch (err) {
      setReportMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to generate daily report' 
      });
      console.error('Error generating daily report:', err);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleGenerateWeeklyReport = async () => {
    try {
      setGeneratingReport(true);
      setReportMessage({ type: '', text: '' });
      
      const response = await axiosInstance.post('/donations-report/weekly', {});
      
      if (response.data.success) {
        setReportMessage({ 
          type: 'success', 
          text: 'Weekly report generated and sent successfully via email!' 
        });
        setTimeout(() => setReportMessage({ type: '', text: '' }), 5000);
      } else {
        setReportMessage({ 
          type: 'error', 
          text: response.data.message || 'Failed to generate weekly report' 
        });
      }
    } catch (err) {
      setReportMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to generate weekly report' 
      });
      console.error('Error generating weekly report:', err);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleGenerateMonthlyReport = async () => {
    try {
      setGeneratingReport(true);
      setReportMessage({ type: '', text: '' });
      
      const response = await axiosInstance.post('/donations-report/monthly', {});
      
      if (response.data.success) {
        setReportMessage({ 
          type: 'success', 
          text: 'Monthly report generated and sent successfully via email!' 
        });
        setTimeout(() => setReportMessage({ type: '', text: '' }), 5000);
      } else {
        setReportMessage({ 
          type: 'error', 
          text: response.data.message || 'Failed to generate monthly report' 
        });
      }
    } catch (err) {
      setReportMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to generate monthly report' 
      });
      console.error('Error generating monthly report:', err);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleGenerateCustomReport = async () => {
    if (!customReportDates.startDate || !customReportDates.endDate) {
      setReportMessage({ 
        type: 'error', 
        text: 'Please select both start and end dates' 
      });
      return;
    }

    try {
      setGeneratingReport(true);
      setReportMessage({ type: '', text: '' });
      
      const response = await axiosInstance.post('/donations-report/custom', {
        startDate: customReportDates.startDate,
        endDate: customReportDates.endDate,
        type: customReportDates.type
      });
      
      if (response.data.success) {
        setReportMessage({ 
          type: 'success', 
          text: 'Custom report generated and sent successfully via email!' 
        });
        setShowCustomReportModal(false);
        setCustomReportDates({ startDate: '', endDate: '', type: 'daily' });
        setTimeout(() => setReportMessage({ type: '', text: '' }), 5000);
      } else {
        setReportMessage({ 
          type: 'error', 
          text: response.data.message || 'Failed to generate custom report' 
        });
      }
    } catch (err) {
      setReportMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to generate custom report' 
      });
      console.error('Error generating custom report:', err);
    } finally {
      setGeneratingReport(false);
    }
  };

  const formatDate = (dateString) => getDate(dateString);

  const formatAmount = (amount, currency = 'PKR') => {
    if (!amount) return '0';
    return `${currency} ${parseFloat(amount).toLocaleString()}`;
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { class: 'status-pending', text: 'Pending' },
      'completed': { class: 'status-completed', text: 'Completed' },
      'failed': { class: 'status-failed', text: 'Failed' },
      'cancelled': { class: 'status-cancelled', text: 'Cancelled' },
      'registered': { class: 'status-registered', text: 'Registered' }
    };
    
    const statusInfo = statusMap[status] || { class: 'status-pending', text: status };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  const getActionMenuItems = (donation) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#4CAF50',
      onClick: () => navigate(`/donations/online_donations/view/${donation.id}`),
      visible: true
    },
    {
      icon: <FiTrendingUp />,
      label: 'Tracking',
      color: '#7c3aed',
      onClick: () => {
        const t =
          (Array.isArray(donation?.progress_trackers) && donation.progress_trackers[0]) ||
          donation?.progress_tracker;
        if (t?.id) navigate(`/progress/trackers/${t.id}/steps`);
      },
      visible: Boolean(
        (Array.isArray(donation?.progress_trackers) && donation.progress_trackers[0]?.id) ||
          donation?.progress_tracker?.id,
      ),
    },
    {
      icon: <FiEdit2 />,
      label: 'Edit',
      color: '#2196F3',
      onClick: () =>
        navigate(`/donations/online_donations/update/${donation.id}`, {
          state: { fromList: location.pathname },
        }),
      visible: true
    },
    // {
    //   icon: <FiTrash2 />,
    //   label: 'Delete',
    //   color: '#f44336',
    //   onClick: () => handleDeleteClick(donation),
    //   visible: true
    // }
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Created Date' },
    { value: 'date', label: 'Donation Date' },
    { value: 'amount', label: 'Amount' },
    { value: 'donor_name', label: 'Donor Name' },
    { value: 'donation_type', label: 'Type' },
    { value: 'status', label: 'Status' }
  ];

  // Filter options
  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'registered', label: 'Registered' }
  ];

  // for ref/campaign tracking
  const campaignOptions = [
    { value: 'MTJ-1234567890', label: 'MTJ-1234567890' },
    { value: 'MTJ-1234567891', label: 'MTJ-1234567891' },
  ];
  const donationTypeOptions = [
    { value: 'zakat', label: 'Zakat' },
    { value: 'sadqa', label: 'Sadqa' },
    { value: 'general', label: 'General' }
  ];

  const donationMethodOptions = [
    { value: 'meezan', label: 'Meezan Bank' },
    { value: 'blinq', label: 'Blinq' },
    { value: 'payfast', label: 'Payfast' }
  ];

  const donationSourceOptions = [
    { value: 'website', label: 'Website' },
    { value: 'mobile_app', label: 'Mobile App' },
    { value: 'collection_center', label: 'Collection Center' },
    { value: 'home_collection', label: 'Home Collection' },
    { value: 'email_campaign', label: 'Email Campaign' },
    { value: 'event', label: 'Event' },
    { value: 'referral', label: 'Referral' },
    { value: 'collection_box', label: 'Collection Box' },
    {value:'bank', label:'Bank'}
  ];

  const workflowTemplateOptions = useMemo(() => {
    const opts = (workflowTemplates || []).map((t) => ({
      value: String(t.id),
      label: t.name || t.code || String(t.id),
    }));
    return [{ value: '', label: 'All Templates' }, ...opts];
  }, [workflowTemplates]);

  const priceRangeOptions = [
    { value: '', label: 'Any Amount' },
    { value: '1000', label: '1,000' },
    { value: '5000', label: '5,000' },
    { value: '10000', label: '10,000' },
    { value: '25000', label: '25,000' },
    { value: '50000', label: '50,000' },
    { value: '100000', label: '100,000' },
    { value: '250000', label: '250,000' },
    { value: '500000', label: '500,000' },
    { value: '1000000', label: '1,000,000' }
  ];

  const priceOperatorOptions = [
    { value: '', label: 'Select Operator' },
    { value: '>', label: 'Greater than' },
    { value: '<', label: 'Less than' },
    { value: '=', label: 'Equal to' },
    { value: '>=', label: 'Greater than or equal' },
    { value: '<=', label: 'Less than or equal' }
  ];

  // CSV Download Configuration
  const csvColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Donor Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'amount', label: 'Amount' },
    { key: 'currency', label: 'Currency' },
    { key: 'donation_type', label: 'Type' },
    { key: 'donation_method', label: 'Method' },
    { key: 'status', label: 'Status' },
    { key: 'item_name', label: 'Item Name' },
    { key: 'country', label: 'Country' },
    { key: 'city', label: 'City' },
    { key: 'orderId', label: 'Order ID' },
    { key: 'date', label: 'Donation Date' },
    { key: 'created_at', label: 'Created Date' }
  ];

  // Prepare CSV data with formatted values
  const prepareCSVData = () => {
    return donations.map(donation => {
      // Extract donor information from nested object
      const donorName = donation.donor?.name || donation.donor_name || 'Anonymous';
      const donorEmail = donation.donor?.email || donation.donor_email || '-';
      const donorPhone = donation.donor?.phone || donation.donor_phone || '-';
      
      return {
        ...donation,
        // Flatten donor data for CSV
        name: donorName,
        email: donorEmail,
        phone: donorPhone,
        // Keep original fields for backward compatibility
        donor_name: donorName,
        donor_email: donorEmail,
        donor_phone: donorPhone,
        amount: donation.amount ? parseFloat(donation.amount) : 0,
        currency: donation.currency || 'PKR',
        donation_type: donation.donation_type === 'zakat' ? 'Zakat' : 
        donation.donation_type === 'sadqa' ? 'Sadqa' : 
        donation.donation_type || 'General',
        donation_method: donation.donation_method?.toUpperCase() || 'N/A',
        status: donation.status || 'pending',
        item_name: donation.item_name || '-',
        country: donation.country || '-',
        city: donation.city || '-',
        orderId: donation.orderId || '-',
        date: donation.date ? new Date(donation.date).toLocaleDateString() : '-',
        created_at: donation.created_at ? new Date(donation.created_at).toLocaleDateString() : '-'
      };
    });
  };

  // Generate filename with current date
  const getCSVFilename = () => {
    const today = new Date().toISOString().split('T')[0];
    return `online-donations-${today}`;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader 
            title="Donations Listing" 
            showBackButton={false} 
            showAdd={true}
            addPath=''
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
          title="Donations Listing" 
          showBackButton={urlDonorId ? true :false} 
          backPath={urlDonorId ? `/dms/donors/view/${urlDonorId}` : null}
          showAdd={true}
          addPath='/donations/online_donations/add'
        />
        
        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}
          


          {/* Report Message */}
          {reportMessage.text && (
            <div className={`status-message status-message--${reportMessage.type}`} style={{ marginBottom: '15px' }}>
              {reportMessage.text}
            </div>
          )}
          
          {/* Filters Section */}
          <div className="filters-section" style={{ 
            display: 'flex', 
            gap: '20px', 
            flexWrap: 'wrap', 
            padding: '20px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px'
          }}>
            {/* Only show Search filter if not filtered via URL query param */}
            {!urlDonorId && (
              <SearchFilter
                filterKey="donor_search"
                label="Search"
                filters={tempFilters}
                onFilterChange={(key, value) => handleDonorSearchChange(value)}
                placeholder="Search by donor name, email, phone..."
              />
            )}
            
            <DropdownFilter
              filterKey="status"
              label="Status"
              data={statusOptions}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All Status"
            />

            {/* <DropdownFilter
              filterKey="ref"
              label="Ref/Campaign"
              data={campaignOptions}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="GeneraAll Campaigns"
            /> */}

            {/* i want multiselect filter for campaign options */}
            <MultiSelect
              name="ref"
              label="Ref/Campaign"
              options={campaignOptions}
              value={tempFilters.ref}
              onChange={(value) => handleFilterChange('ref', value)} // value is an array of selected values
              placeholder="Select Campaigns"
            />
            
            
            <DropdownFilter
              filterKey="donation_type"
              label="Donation Type"
              data={donationTypeOptions}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All Types"
            />
            
            <DropdownFilter
              filterKey="donation_method"
              label="Payment Method"
              data={donationMethodOptions}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All Methods"
            />

            <DropdownFilter
              filterKey="donation_source"
              label="Donation Source"
              data={donationSourceOptions}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All Sources"
            />

            <DropdownFilter
              filterKey="progress_workflow_template_id"
              label="Workflow Template"
              data={workflowTemplateOptions}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All Templates"
            />
            
            {/* <HybridDropdown
              label="Amount"
              placeholder="Type or select amount..."
              options={priceRangeOptions}
              value={tempFilters.amount}
              onChange={(value) => handleFilterChange('amount', value)}
              allowCustom={true}
            /> */}
            
            {/* Custom plus specified options */}
            {/* <HybridDropdown
              label="Amount Operator"
              placeholder="Type or select operator..."
              options={priceOperatorOptions}
              value={tempFilters.price_operator}
              onChange={(value) => handleFilterChange('price_operator', value)}
              allowCustom={true}
            /> */}
            
            <DateFilter
              filterKey="date"
              label="Specific Date"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
            />

            {/* Transaction ID filter */}
            <SearchFilter
              filterKey="orderId"
              label="Transaction ID"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="Enter transaction ID..."
            />
            
            <DateRangeFilter
              startKey="start_date"
              endKey="end_date"
              label="Date Range"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
            />
            
            {/* Only show Filter by Donor dropdown if not filtered via URL query param */}
            {!urlDonorId && (
              <SearchableDropdown
                label="Filter by Donor"
                placeholder="Search donors..."
                apiEndpoint="/donors"
                onSelect={handleDonorSelect}
                onClear={handleDonorClear}
                value={selectedDonor}
                displayKey="name"
                debounceDelay={500}
                minSearchLength={2}
                allowResearch={true}
                renderOption={(donor, index) => (
                  <div 
                    key={donor.id}
                    className="searchable-dropdown__option"
                    onClick={() => handleDonorSelect(donor)}
                    style={{ 
                      padding: '12px',
                      borderBottom: index < donor.length - 1 ? '1px solid #eee' : 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                      {donor.name || `${donor.first_name} ${donor.last_name}`}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {donor.email} • {donor.phone}
                    </div>
                  </div>
                )}
              />
            )}
            
            {/* Filter Action Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              alignItems: 'flex-end',
              marginTop: '20px',
              width: '100%',
              flexWrap: 'wrap'
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
                        {/* <FiDollarSign style={{ fontSize: '20px', color: '#28a745' }} /> */}
           <div style={{marginLeft: '10px'}}>
                <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '2px' , marginLeft: '10px'}}>
                  Total Donation Amount
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#28a745' }}>
                  PKR {totalDonationAmount.toLocaleString()}
                </div>
              </div>
          <div className="table-container"> 
            <table className="data-table">
              <thead>
                <tr>
                  <th>Donor </th>
                  <th>Amount</th>
                  {/* <th>Type</th> */}
                  <th>Project</th>
                  <th>Method</th>
                  <th className="hide-on-mobile">Email</th>
                  {/* <th className="hide-on-mobile">Phone</th> */}
                  <th>Status</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th className="table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {donations.map(donation => (
                  <tr key={donation.id}>
                    <td>
                      <div className="donor-info">
                        <div className="donor-name">{donation?.donor?.name?.slice(0, 15) + '...' || 'Anonymous'}</div>
                        {donation.item_name && (
                          <div className="donor-item hide-on-mobile">{donation.item_name?.slice(0, 15) + '...'}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="amount-info">
                        <div className="amount-value">{formatAmount(donation.amount, donation.currency)}</div>
                        {donation.item_price && (
                          <div className="item-price hide-on-mobile">
                            Item: {formatAmount(donation.item_price, donation.currency)}
                          </div>
                        )}
                      </div>
                    </td>
                    {/* <td>
                      <span className="donation-type">
                        {donation.donation_type === 'zakat' ? 'Zakat' : 
                         donation.donation_type === 'sadqa' ? 'Sadqa' : 
                         donation.donation_type || 'General'}
                      </span>
                    </td> */}
                    <td>
                      <span className="donation-project">
                        {donation.project_name || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className="donation-method">
                        {donation.donation_method?.toUpperCase() || 'N/A'}
                      </span>
                    </td>
                    <td className="hide-on-mobile">{donation?.donor?.email?.slice(0, 15) + '...' || '-'}</td>
                    {/* <td className="hide-on-mobile">{donation?.donor?.phone?.slice(0, 15) + '...' || '-'}</td> */}
                    <td>{getStatusBadge(donation.status)}</td>
                    <td>{formatDate(donation.date || donation.created_at)}</td>
                    <td>{getTime(donation.created_at)}</td>
                    <td className="table-actions">
                      <ActionMenu actions={getActionMenuItems(donation)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="list-header" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginTop: '20px',
            padding: '15px 0'
          }}>
            <div className="total-amount-display" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>

            </div>
            
            {/* <DownloadCSV
              data={prepareCSVData()}
              filename={getCSVFilename()}
              columns={csvColumns}
              buttonText="Export to CSV"
              onDownloadStart={() => console.log('Downloading donations CSV...')}
              onDownloadComplete={() => console.log('Download complete!')}
            /> */}
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
              <div className="empty-state-text">No online donations found</div>
              <div className="empty-state-subtext">Donations will appear here once they are received</div>
            </div>
          )}
        </div>
      </div>
      
      <ConfirmationModal
        isOpen={showDeleteModal}
        text={`Are you sure you want to delete the donation from ${donationToDelete?.donor?.name || 'Anonymous'}?`}
        delete={true}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* Custom Report Modal */}
      {showCustomReportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#2c5aa0' }}>
              Generate Custom Report
            </h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Start Date
              </label>
              <input
                type="date"
                value={customReportDates.startDate}
                onChange={(e) => setCustomReportDates(prev => ({ ...prev, startDate: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                End Date
              </label>
              <input
                type="date"
                value={customReportDates.endDate}
                onChange={(e) => setCustomReportDates(prev => ({ ...prev, endDate: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Report Type
              </label>
              <select
                value={customReportDates.type}
                onChange={(e) => setCustomReportDates(prev => ({ ...prev, type: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCustomReportModal(false);
                  setCustomReportDates({ startDate: '', endDate: '', type: 'daily' });
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateCustomReport}
                disabled={generatingReport}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: generatingReport ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: generatingReport ? 0.6 : 1
                }}
              >
                {generatingReport ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OnlineDonationsList;
