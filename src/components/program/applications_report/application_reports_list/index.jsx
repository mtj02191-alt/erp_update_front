import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiEye, FiPlus } from 'react-icons/fi';
import axiosInstance from '../../../../utils/axios';
import '../../../../styles/variables.css';
import '../../../../styles/components.css';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ConfirmationModal from '../../../common/ConfirmationModal';
import ActionMenu from '../../../common/ActionMenu';
import Pagination from '../../../common/Pagination';
import './ApplicationList.css';

const ApplicationReportsList = () => {
  const [applicationReports, setApplicationReports] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplicationReports();
  }, [currentPage, pageSize, sortField, sortOrder]);

  const fetchApplicationReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        sortField: sortField,
        sortOrder: sortOrder
      });
      
      const response = await axiosInstance.get(`/program/application-reports?${params}`);
      
      // Handle the controller's response structure
      if (response.data.success) {
        setApplicationReports(response.data.data || []);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        setError(response.data.message || 'Failed to fetch application reports');
        setApplicationReports([]);
      }
      setError('');
    } catch (err) {
      setError('Failed to fetch application reports. Please try again.');
      console.error('Error fetching application reports:', err);
      setApplicationReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (report) => {
    setReportToDelete(report);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (reportToDelete) {
      try {
        await axiosInstance.delete(`/program/application-reports/${reportToDelete.id}`);
        fetchApplicationReports(); // Refresh the list
        setError('');
      } catch (err) {
        setError('Failed to delete report');
        console.error('Error deleting report:', err);
      }
    }
    setShowDeleteModal(false);
    setReportToDelete(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setReportToDelete(null);
  };

  const handleView = (report) => {
    navigate(`/program/applications_reports/view_application_report/${report.id}`);
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

  const filteredReports = applicationReports.filter(report => {
    const matchesSearch = 
      report.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.applications.some(app => 
        app.project.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesDate = !dateFilter || report.report_date === dateFilter;

    return matchesSearch && matchesDate;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTotalApplications = (applications) => {
    return applications.reduce((total, app) => total + app.application_count, 0);
  };

  const getTotalPending = (applications) => {
    return applications.reduce((total, app) => total + app.pending_count, 0);
  };

  const getTotalVerified = (applications) => {
    return applications.reduce((total, app) => total + (Number(app.verified_count) || 0), 0);
  };

  const getTotalApproved = (applications) => {
    return applications.reduce((total, app) => total + (Number(app.approved_count) || 0), 0);
  };

  const getActionMenuItems = (report) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#4CAF50',
      onClick: () => handleView(report),
      visible: true
    },
    {
      icon: <FiEdit2 />,
      label: 'Edit',
      color: '#2196F3',
      onClick: () => navigate(`/program/applications_reports/edit_application_report/${report.id}`),
      visible: true
    },
    {
      icon: <FiTrash2 />,
      label: 'Delete',
      color: '#f44336',
      onClick: () => handleDeleteClick(report),
      visible: true
    }
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Created Date' },
    { value: 'report_date', label: 'Report Date' },
    { value: 'updated_at', label: 'Updated Date' }
  ];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="application-list-container">
          <div className="status-message">Loading application reports...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="application-list-container">
        <PageHeader 
          title="Application Reports"
          backPath="/program" 
          showAdd={true}
          addPath="/program/applications_reports/add"
        />

        <div className="application-list-header">
          <div className="application-list-filters">
            <input
              type="text"
              placeholder="Search reports or projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="form-input"
              placeholder="Filter by date"
            />
          </div>
        </div>

        {error && <div className="status-message status-message--error">{error}</div>}

        <div className="application-list-table-container">
          <table className="application-list-table">
            <thead>
              <tr>
                <th>Report Date</th>
                <th>Projects Count</th>
                <th>Total Applications</th>
                <th>Total Verified</th>
                <th>Total Approved</th>
                <th>Total Pending</th>
                {/* <th className="hide-on-mobile">Notes</th> */}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.id}>
                  <td>
                    <div className="report-date">
                      {formatDate(report.report_date)}
                    </div>
                  </td>
                  <td>
                    <span className="projects-count">
                      {report.applications.length} {report.applications.length === 1 ? 'Project' : 'Projects'}
                    </span>
                  </td>
                  <td>
                    <span className="total-applications">
                      {getTotalApplications(report.applications)}
                    </span>
                  </td>
                  <td>
                    <span className="total-verified">
                      {getTotalVerified(report.applications)}
                    </span>
                  </td>
                  <td>
                    <span className="total-approved">
                      {getTotalApproved(report.applications)}
                    </span>
                  </td>
                  <td>
                    <span className="total-pending">
                      {getTotalPending(report.applications)}
                    </span>
                  </td>
                  <td>
                    <ActionMenu actions={getActionMenuItems(report)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReports.length === 0 && !loading && (
          <div className="status-message">
            No application reports found.
          </div>
        )}

        {/* Pagination Component */}
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

        <ConfirmationModal
          isOpen={showDeleteModal}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          text={`Are you sure you want to delete this application report? This action cannot be undone.`}
          delete={true}
        />
      </div>
    </>
  );
};

export default ApplicationReportsList; 