import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../../utils/axios';
import PageHeader from '../../../../../common/PageHeader';
import ActionMenu from '../../../../../common/ActionMenu';
import Pagination from '../../../../../common/Pagination';
import ConfirmationModal from '../../../../../common/ConfirmationModal';
import Navbar from '../../../../../Navbar';
import { FiEdit, FiEye, FiTrash2, FiFilter } from 'react-icons/fi';

const AdminApplicationsList = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Filter state
  const [filters, setFilters] = useState({
    department: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState(null);

  // Sort options for the pagination component
  const sortOptions = [
    { value: 'created_at', label: 'Application Date' },
    { value: 'applicant_name', label: 'Applicant Name' },
    { value: 'email', label: 'Email' },
    { value: 'department_id', label: 'Department' }
  ];

  useEffect(() => {
    fetchApplications();
  }, [currentPage, pageSize, sortField, sortOrder, filters]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/applications', {
        params: {
          page: currentPage,
          pageSize: pageSize,
          sortField: sortField,
          sortOrder: sortOrder,
          ...filters
        }
      });
      
      if (response.data && response.data.data) {
        setApplications(response.data.data);
        setTotalItems(response.data.pagination.total);
        setTotalPages(response.data.pagination.totalPages);
      } else {
        setApplications(response.data || []);
        setTotalItems(response.data?.length || 0);
        setTotalPages(1);
      }
    } catch (err) {
      setError('Failed to fetch applications');
      console.error('Error fetching applications:', err);
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

  const handleView = (id) => {
    navigate(`/hr/career/applications/view/${id}`);
  };

  const handleEdit = (id) => {
    navigate(`/hr/career/applications/edit/${id}`);
  };

  const handleDeleteClick = (application) => {
    setApplicationToDelete(application);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (applicationToDelete) {
      try {
        await axiosInstance.delete(`/admin/applications/${applicationToDelete.id}`);
        setApplications(applications.filter(app => app.id !== applicationToDelete.id));
        setShowDeleteModal(false);
        setApplicationToDelete(null);
      } catch (err) {
        console.error('Error deleting application:', err);
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      department: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    });
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'pending': 'status-badge status-badge--pending',
      'reviewed': 'status-badge status-badge--reviewed',
      'shortlisted': 'status-badge status-badge--shortlisted',
      'rejected': 'status-badge status-badge--rejected',
      'hired': 'status-badge status-badge--hired'
    };
    
    return (
      <span className={statusClasses[status] || 'status-badge'}>
        {status || 'Pending'}
      </span>
    );
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="list-content">
            <div className="empty-state">Loading applications...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <div className="list-content">
          <PageHeader 
            title="Job Applications Management" 
            subtitle="Review and manage all job applications"
            showBackButton={false}
          />
          
          {error && (
            <div className="status-message status-message--error">
              {error}
            </div>
          )}

          {/* Filters Section */}
          <div className="filters-section">
            <div className="filters-header">
              <h3 className="section-title">
                <FiFilter className="icon" />
                Filters
              </h3>
            </div>
            
            <div className="filters-grid">
              <div className="filter-item">
                <label className="filter-label">Department</label>
                <select
                  name="department"
                  value={filters.department}
                  onChange={handleFilterChange}
                  className="filter-select"
                >
                  <option value="">All Departments</option>
                  <option value="1">IT</option>
                  <option value="2">Marketing</option>
                  <option value="3">Finance</option>
                  <option value="4">HR</option>
                </select>
                <button 
                onClick={clearFilters}
              >
                Clear Filters
              </button>
              </div>
            </div>
          </div>

          {/* Applications Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Applied Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-state">
                      No applications found
                    </td>
                  </tr>
                ) : (
                  applications.map((application) => (
                    <tr key={application.id}>
                      <td>
                        <div className="applicant-info">
                          <div className="applicant-name">
                            {application.applicant_name}
                          </div>
                          {application.cover_letter && (
                            <div className="cover-letter-preview">
                              {application.cover_letter.substring(0, 50)}...
                            </div>
                          )}
                        </div>
                      </td>
                      <td>{application.email}</td>
                      <td>{application.phone_number}</td>
                      <td>
                        {application.department_id ? `Dept ${application.department_id}` : 'N/A'}
                      </td>
                      <td>{getStatusBadge(application.status)}</td>
                      <td>{formatDate(application.created_at)}</td>
                      <td className="table-actions">
                                                 <ActionMenu
                           actions={[
                             {
                               label: 'View',
                               icon: <FiEye />,
                               onClick: () => handleView(application.id),
                               className: 'action-view',
                               visible: true,
                               color: '#2563eb'
                             },
                             {
                               label: 'Edit',
                               icon: <FiEdit />,
                               onClick: () => handleEdit(application.id),
                               className: 'action-edit action-disabled',
                               visible: true,
                               disabled: true,
                               color: '#9ca3af'
                             },
                             {
                               label: 'Delete',
                               icon: <FiTrash2 />,
                               onClick: () => handleDeleteClick(application),
                               className: 'action-delete action-disabled',
                               visible: true,
                               disabled: true,
                               color: '#ef4444'
                             }
                           ]}
                         />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {applications.length > 0 && (
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Application"
        message={`Are you sure you want to delete the application from ${applicationToDelete?.applicant_name}?`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="danger_btn"
      />
    </>
  );
};

export default AdminApplicationsList;
