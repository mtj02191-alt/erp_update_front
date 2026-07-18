import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { marriage_gifts_vulnerabilities } from '../../../../../utils/program';
import axiosInstance from '../../../../../utils/axios';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import ActionMenu from '../../../../common/ActionMenu';
import ConfirmationModal from '../../../../common/ConfirmationModal';
import Pagination from '../../../../common/Pagination';
import { FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi';
import './index.css';

const MarriageGiftsList = () => {
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
  const [sortField, setSortField] = useState('report_date');
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
      
      const response = await axiosInstance.get('/program/marriage-gifts/reports', { params });
      if (response.data.success) {
        setReports(response.data.data || []);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        setError('Failed to fetch reports');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch reports');
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
        await axiosInstance.delete(`/program/marriage-gifts/reports/${reportToDelete.id}`);
        // Refresh the current page after deletion
        fetchReports();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete report');
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

  const getTotal = (gifts) => {
    if (!gifts) return 0;
    return Object.values(gifts).reduce((total, count) => total + count, 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getActionMenuItems = (report) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#4CAF50',
      onClick: () => navigate(`/program/marriage_gifts/reports/view/${report.id}`),
      visible: true
    },
    {
      icon: <FiEdit2 />,
      label: 'Edit',
      color: '#2196F3',
      onClick: () => navigate(`/program/marriage_gifts/reports/update/${report.id}`),
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
    { value: 'report_date', label: 'Date' },
    { value: 'orphans', label: 'Orphans' },
    { value: 'divorced', label: 'Divorced' },
    { value: 'disable', label: 'Disable' },
    { value: 'indegent', label: 'Indegent' },
    { value: 'created_at', label: 'Created At' }
  ];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader 
            title="Marriage Gifts Reports" 
            showBackButton={false} 
            showAdd={true}
            addPath="/program/marriage_gifts/reports/add"
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
          title="Marriage Gifts Reports" 
          showBackButton={false} 
          showAdd={true}
          addPath="/program/marriage_gifts/reports/add"
        />
        
        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}
          
          <div className="list-header">
            {/* <h2 className="header-title">All Reports</h2> */}
          </div>
          
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Total Gifts</th>
                  <th className="hide-on-mobile">Orphans</th>
                  <th className="hide-on-mobile">Divorced</th>
                  <th className="hide-on-mobile">Disable</th>
                  <th className="hide-on-mobile">Indegent</th>
                  <th className="show-on-mobile">Distribution</th>
                  <th className="table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(report => (
                  <tr key={report.id}>
                    <td>{formatDate(report.date)}</td>
                    <td>{getTotal(report.gifts)}</td>
                    <td className="hide-on-mobile">{report.gifts?.Orphans || 0}</td>
                    <td className="hide-on-mobile">{report.gifts?.Divorced || 0}</td>
                    <td className="hide-on-mobile">{report.gifts?.Disable || 0}</td>
                    <td className="hide-on-mobile">{report.gifts?.Indegent || 0}</td>
                    <td className="show-on-mobile">
                      {report.gifts?.Orphans || 0}/{report.gifts?.Divorced || 0}/{report.gifts?.Disable || 0}/{report.gifts?.Indegent || 0}
                    </td>
                    <td className="table-actions">
                      <ActionMenu actions={getActionMenuItems(report)} />
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
          
          {reports.length === 0 && totalItems === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">🎁</div>
              <div className="empty-state-text">No marriage gifts reports found</div>
              <div className="empty-state-subtext">Create your first report to get started</div>
            </div>
          )}
        </div>
      </div>
      
      <ConfirmationModal
        isOpen={showDeleteModal}
        text={`Are you sure you want to delete the marriage gifts report for ${reportToDelete?.date ? formatDate(reportToDelete.date) : ''}?`}
        delete={true}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};

export default MarriageGiftsList; 