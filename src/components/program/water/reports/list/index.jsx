import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import ActionMenu from '../../../../common/ActionMenu';
import ConfirmationModal from '../../../../common/ConfirmationModal';
import Pagination from '../../../../common/Pagination';
import { FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi';
import axios from '../../../../../utils/axios';

const WaterReportsList = () => {
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
      
      const response = await axios.get('/program/water/reports', { params });
      
      if (response.data.success) {
        setReports(response.data.data || []);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        setError(response.data.message || 'Failed to fetch reports');
      }
    } catch (err) {
      console.error('Error fetching water reports:', err);
      setError(err.response?.data?.message || 'Failed to fetch reports');
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
        const response = await axios.delete(`/program/water/reports/date/${reportToDelete.date}`);
        
        if (response.data.success) {
          // Refresh the current page after deletion
          fetchReports();
        } else {
          setError(response.data.message || 'Failed to delete report');
        }
      } catch (err) {
        console.error('Error deleting water report:', err);
        setError(err.response?.data?.message || 'Failed to delete report');
      }
    }
    setShowDeleteModal(false);
    setReportToDelete(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setReportToDelete(null);
  };

  const getReportTotals = (activities) => {
    return activities.reduce((acc, item) => {
      acc.total_quantity += (parseInt(item.quantity) || 0);
      return acc;
    }, { total_quantity: 0 });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDateKey = (dateValue) => {
    try {
      return new Date(dateValue).toISOString().split('T')[0];
    } catch {
      return String(dateValue || '');
    }
  };

  const getActionMenuItems = (report) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#4CAF50',
      onClick: () => navigate(`/program/water/reports/view/${getDateKey(report.date)}`),
      visible: true
    },
    {
      icon: <FiEdit2 />,
      label: 'Edit',
      color: '#2196F3',
      onClick: () => navigate(`/program/water/reports/update/${getDateKey(report.date)}`),
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
    { value: 'activity', label: 'Activity' },
    { value: 'system', label: 'System' },
    { value: 'quantity', label: 'Quantity' },
    { value: 'created_at', label: 'Created At' }
  ];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader 
            title="Water Reports" 
            showBackButton={false} 
            showAdd={true}
            addPath="/program/water/reports/add"
          />
          <div className="list-content">
            <div className="loading-state">Loading...</div>
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
          title="Water Reports" 
          showBackButton={false} 
          showAdd={true}
          addPath="/program/water/reports/add"
        />
        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Total Activities</th>
                  <th>Total Quantity</th>
                  <th className="table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(report => {
                  const totals = getReportTotals(report.activities || []);
                  return (
                    <tr key={report.id}>
                      <td>{formatDate(report.date)}</td>
                      <td>{report.activities ? report.activities.length : 0}</td>
                      <td>{totals.total_quantity}</td>
                      <td className="table-actions">
                        <ActionMenu actions={getActionMenuItems(report)} />
                      </td>
                    </tr>
                  )
                })}
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
      <ConfirmationModal
        isOpen={showDeleteModal}
        text={`Are you sure you want to delete the report for ${reportToDelete?.date ? formatDate(reportToDelete.date) : ''}?`}
        delete={true}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};

export default WaterReportsList; 