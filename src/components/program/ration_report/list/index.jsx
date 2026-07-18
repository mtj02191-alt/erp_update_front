import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import ConfirmationModal from '../../../common/ConfirmationModal';
import Pagination from '../../../common/Pagination';
import { FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi';
import './index.css';
import Navbar from '../../../Navbar';

const RationReportList = () => {
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
      
      const response = await axiosInstance.get('/program/ration/reports', { params });
      
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
        await axiosInstance.delete(`/program/ration/reports/${reportToDelete.id}`);
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

  const getActionMenuItems = (report) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#4CAF50',
      onClick: () => navigate(`/program/ration_report/view/${report.id}`),
      visible: true
    },
    {
      icon: <FiEdit2 />,
      label: 'Edit',
      color: '#2196F3',
      onClick: () => navigate(`/program/ration_report/update/${report.id}`),
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

  const getFullTotal = (report) => {
    if (report.full) {
      return Object.values(report.full).reduce((a, b) => a + b, 0);
    }
    return 0;
  };

  const getHalfTotal = (report) => {
    if (report.half) {
      return Object.values(report.half).reduce((a, b) => a + b, 0);
    }
    return 0;
  };

  const sortOptions = [
    { value: 'report_date', label: 'Date' },
    { value: 'life_time', label: 'Life Time' },
    { value: 'created_at', label: 'Created At' }
  ];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="page_container">
          <PageHeader 
            title="Ration Reports" 
            showBackButton={false} 
            showAdd={true}
            addPath="/program/ration_report/add"
          />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="page_container">
        <PageHeader 
          title="Ration Reports" 
          showBackButton={false} 
          showAdd={true}
          addPath="/program/ration_report/add"
        />
        {error && <div className="status-message status-message--error">{error}</div>}
        <div className="ration-table-container">
          <table className="ration-table">
            <thead>
              <tr>
                <th>Date</th>
                <th className="hide-on-mobile">Full Total</th>
                <th className="hide-on-mobile">Half Total</th>
                <th className="show-on-mobile">Full/Half</th>
                <th>Life Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(report => (
                <tr key={report.id}>
                  <td>{report.date}</td>
                  <td className="hide-on-mobile">{getFullTotal(report)}</td>
                  <td className="hide-on-mobile">{getHalfTotal(report)}</td>
                  <td className="show-on-mobile">{getFullTotal(report)} / {getHalfTotal(report)}</td>
                  <td>{report.life_time}</td>
                  <td>
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
        
        <ConfirmationModal
          isOpen={showDeleteModal}
          text={`Are you sure you want to delete the ration report for ${reportToDelete?.date}?`}
          delete={true}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      </div>
    </>
  );
};

export default RationReportList; 