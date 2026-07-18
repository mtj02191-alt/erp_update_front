import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../../utils/axios';
import Navbar from '../../../../../Navbar';
import PageHeader from '../../../../../common/PageHeader';
import ActionMenu from '../../../../../common/ActionMenu';
import ConfirmationModal from '../../../../../common/ConfirmationModal';
import Pagination from '../../../../../common/Pagination';
import { SearchFilter, DropdownFilter, DateFilter, DateRangeFilter } from '../../../../../common/filters';
import { ClearButton } from '../../../../../common/filters/index';
import { SearchButton } from '../../../../../common/filters/index';

import { FiEye, FiTrash2, FiEdit, FiBriefcase } from 'react-icons/fi';

const JobsList = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('posted_date');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Filter state - Temporary filters (not applied until search button is clicked)
  const [tempFilters, setTempFilters] = useState({
    search: '',
    status: '',
    department: '',
    type: '',
    location: ''
  });

  // Applied filters - Actually sent to API
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    status: '',
    department: '',
    type: '',
    location: ''
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
    const filtersChanged = JSON.stringify(appliedFilters) !== JSON.stringify(tempFilters);
    
    if (filtersChanged) {
      setAppliedFilters(tempFilters);
      setCurrentPage(1);
    } else {
      fetchJobs();
    }
  };

  // Clear filters - Triggered by Clear button
  const handleClearFilters = () => {
    const emptyFilters = {
      search: '',
      status: '',
      department: '',
      type: '',
      location: ''
    };
    
    const filtersAreEmpty = JSON.stringify(appliedFilters) === JSON.stringify(emptyFilters);
    
    if (!filtersAreEmpty) {
      setTempFilters(emptyFilters);
      setAppliedFilters(emptyFilters);
      setCurrentPage(1);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [currentPage, pageSize, sortField, sortOrder, appliedFilters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(appliedFilters.search && { search: appliedFilters.search }),
        ...(appliedFilters.status && { status: appliedFilters.status }),
        ...(appliedFilters.department && { department: appliedFilters.department }),
        ...(appliedFilters.type && { type: appliedFilters.type }),
        ...(appliedFilters.location && { location: appliedFilters.location })
      });
      
      const response = await axiosInstance.get(`/jobs?${params.toString()}`);
      
      if (response.data.success) {
        setJobs(response.data.data?.jobs || []);
        setTotalItems(response.data.data?.pagination?.totalItems || 0);
        setTotalPages(response.data.data?.pagination?.totalPages || 1);
      } else {
        setError('Failed to fetch jobs');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch jobs');
      console.error('Error fetching jobs:', err);
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

  const handleDeleteClick = (job) => {
    setJobToDelete(job);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (jobToDelete) {
      try {
        await axiosInstance.delete(`/jobs/${jobToDelete.id}`);
        fetchJobs();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete job');
        console.error('Error deleting job:', err);
      }
    }
    setShowDeleteModal(false);
    setJobToDelete(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setJobToDelete(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'active': { class: 'status-completed', text: 'Active' },
      'closed': { class: 'status-cancelled', text: 'Closed' },
      'draft': { class: 'status-pending', text: 'Draft' }
    };
    
    const statusInfo = statusMap[status] || { class: 'status-pending', text: status };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  const getDepartmentBadge = (department) => {
    const deptMap = {
      'IT': { class: 'job-dept-it', text: 'IT' },
      'Marketing': { class: 'job-dept-marketing', text: 'Marketing' },
      'Design': { class: 'job-dept-design', text: 'Design' },
      'Operations': { class: 'job-dept-operations', text: 'Operations' }
    };
    
    const deptInfo = deptMap[department] || { class: 'job-dept-standard', text: department };
    return <span className={`job-dept-badge ${deptInfo.class}`}>{deptInfo.text}</span>;
  };

  const getActionMenuItems = (job) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#4CAF50',
      onClick: () => navigate(`/hr/careers/jobs/view/${job.id}`),
      visible: true
    },
    // {
    //   icon: <FiEdit />,
    //   label: 'Edit',
    //   color: '#2563eb',
    //   onClick: () => navigate(`/hr/careers/jobs/edit/${job.id}`),
    //   visible: true
    // },
    {
      icon: <FiTrash2 />,
      label: 'Delete',
      color: '#f44336',
      onClick: () => handleDeleteClick(job),
      visible: true
    }
  ];

  const sortOptions = [
    { value: 'posted_date', label: 'Posted Date' },
    { value: 'closing_date', label: 'Closing Date' },
    { value: 'title', label: 'Title' },
    { value: 'department', label: 'Department' },
    { value: 'type', label: 'Type' },
    { value: 'status', label: 'Status' },
    { value: 'location', label: 'Location' }
  ];

  // Filter options
  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'closed', label: 'Closed' },
    { value: 'draft', label: 'Draft' }
  ];

  const departmentOptions = [
    { value: 'IT', label: 'IT' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Design', label: 'Design' },
    { value: 'Operations', label: 'Operations' }
  ];

  const typeOptions = [
    { value: 'Full Time', label: 'Full Time' },
    { value: 'Part Time', label: 'Part Time' },
    { value: 'Contract', label: 'Contract' }
  ];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader 
            title="Jobs" 
            showBackButton={false} 
            showAdd={true}
            addPath="/hr/careers/jobs/add"
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
          title="Jobs" 
          showBackButton={false} 
          showAdd={true}
          addPath="/hr/careers/jobs/add"
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
              placeholder="Search by title, location, about..."
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
              filterKey="department"
              label="Department"
              data={departmentOptions}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All Departments"
            />
            
            <DropdownFilter
              filterKey="type"
              label="Job Type"
              data={typeOptions}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All Types"
            />
            
            <SearchFilter
              filterKey="location"
              label="Location"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="Search by location..."
            />
            
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
            </div>
          </div>
          
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Department</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th className="hide-on-mobile">Experience</th>
                  <th>Status</th>
                  <th className="hide-on-mobile">Posted Date</th>
                  <th className="hide-on-mobile">Closing Date</th>
                  <th className="table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job.id}>
                    <td>
                      <div className="job-info">
                        <div className="job-title">
                          {job.is_featured && <span style={{ color: '#f59e0b', marginRight: '4px' }}>⭐</span>}
                          {job.title}
                        </div>
                        {job.slug && (
                          <div className="job-slug hide-on-mobile" style={{ fontSize: '12px', color: '#666' }}>
                            /{job.slug}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{getDepartmentBadge(job.department)}</td>
                    <td>{job.type}</td>
                    <td>{job.location}</td>
                    <td className="hide-on-mobile">{job.experience || '-'}</td>
                    <td>{getStatusBadge(job.status)}</td>
                    <td className="hide-on-mobile">{formatDate(job.posted_date)}</td>
                    <td className="hide-on-mobile">{formatDate(job.closing_date)}</td>
                    <td className="table-actions">
                      <ActionMenu actions={getActionMenuItems(job)} />
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
          
          {jobs.length === 0 && totalItems === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">💼</div>
              <div className="empty-state-text">No jobs found</div>
              <div className="empty-state-subtext">Jobs will appear here once they are created</div>
            </div>
          )}
        </div>
      </div>
      
      <ConfirmationModal
        isOpen={showDeleteModal}
        text={`Are you sure you want to delete job "${jobToDelete?.title}"?`}
        delete={true}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};

export default JobsList;

