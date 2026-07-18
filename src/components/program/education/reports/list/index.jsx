import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import ActionMenu from '../../../../common/ActionMenu';
import Pagination from '../../../../common/Pagination';
import ConfirmationModal from '../../../../common/ConfirmationModal';
import { FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';

const ListEducationReports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('DESC');

  useEffect(() => {
    fetchReports();
  }, [currentPage, pageSize, sortField, sortOrder]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        pageSize: pageSize,
        sortField: sortField,
        sortOrder: sortOrder
      };
      
      const response = await axiosInstance.get('/program/education/reports', { params });
      if (response.data.success) {
        setReports(response.data.data || []);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        setError('Failed to fetch reports');
      }
    } catch (err) {
      setError('Failed to fetch reports');
      console.error('Error fetching reports:', err);
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

  const handleDeleteClick = (report) => {
    setReportToDelete(report);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (reportToDelete) {
      try {
        await axiosInstance.delete(`/program/education/reports/${reportToDelete.id}`);
        // Refresh the current page after deletion
        fetchReports();
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

  const getMaleTotal = (report) => {
    return (report.male_orphans || 0) + (report.male_divorced || 0) + (report.male_disable || 0) + (report.male_indegent || 0);
  };

  const getFemaleTotal = (report) => {
    return (report.female_orphans || 0) + (report.female_divorced || 0) + (report.female_disable || 0) + (report.female_indegent || 0);
  };

  const getOverallTotal = (report) => {
    return getMaleTotal(report) + getFemaleTotal(report);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const getActionMenuItems = (report) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#4CAF50',
      onClick: () => navigate(`/program/education/reports/view/${report.id}`),
      visible: true
    },
    {
      icon: <FiEdit2 />,
      label: 'Edit',
      color: '#2196F3',
      onClick: () => navigate(`/program/education/reports/update/${report.id}`),
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
    { value: 'date', label: 'Date' },
    { value: 'male_orphans', label: 'Male Orphans' },
    { value: 'male_divorced', label: 'Male Divorced' },
    { value: 'male_disable', label: 'Male Disable' },
    { value: 'male_indegent', label: 'Male Indegent' },
    { value: 'female_orphans', label: 'Female Orphans' },
    { value: 'female_divorced', label: 'Female Divorced' },
    { value: 'female_disable', label: 'Female Disable' },
    { value: 'female_indegent', label: 'Female Indegent' },
    { value: 'created_at', label: 'Created At' }
  ];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-education-reports">
          <div className="list-wrapper">
            <div className="list-content">
              <PageHeader 
                title="Education Reports" 
                breadcrumbs={[
                  { label: 'Program', path: '/program' },
                  { label: 'Education Reports' }
                ]}
                showAdd={true}
                addPath="/program/education/reports/add"
              />
              <div className="loading">Loading...</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-education-reports">
        <div className="list-wrapper">
          <div className="list-content">
            <PageHeader 
              title="Education Reports" 
              breadcrumbs={[
                { label: 'Program', path: '/program' },
                { label: 'Education Reports' }
              ]}
              showAdd={true}
              addPath="/program/education/reports/add"
            />
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Male Total</th>
                    <th>Female Total</th>
                    <th>Overall Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="no-data">No reports found</td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr key={report.id}>
                        <td>{formatDate(report.date)}</td>
                        <td>{getMaleTotal(report)}</td>
                        <td>{getFemaleTotal(report)}</td>
                        <td className="overall-total">{getOverallTotal(report)}</td>
                        <td>
                          <ActionMenu actions={getActionMenuItems(report)} />
                        </td>
                      </tr>
                    ))
                  )}
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
            
            {reports.length === 0 && totalItems === 0 && !error && (
              <div className="empty-state">
                <div className="empty-state-icon">📄</div>
                <div className="empty-state-text">No reports found</div>
                <div className="empty-state-subtext">Create your first report to get started.</div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ConfirmationModal
        isOpen={showDeleteModal}
        text={`Are you sure you want to delete the education report for ${reportToDelete?.date ? formatDate(reportToDelete.date) : ''}?`}
        delete={true}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};

export default ListEducationReports; 