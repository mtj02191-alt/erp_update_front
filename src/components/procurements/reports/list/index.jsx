import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import Pagination from '../../../common/Pagination';
import ConfirmationModal from '../../../common/ConfirmationModal';
import Navbar from '../../../Navbar';
import { FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi';
import '../../Procurements.css';

const ProcurementReportsList = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);

  // Sort options for the pagination component
  const sortOptions = [
    { value: 'created_at', label: 'Created Date' },
    { value: 'date', label: 'Report Date' },
    { value: 'total_generated_pos', label: 'Total Generated POs' },
    { value: 'total_generated_pis', label: 'Total Generated PIs' },
    { value: 'total_paid_amount', label: 'Total Paid Amount' }
  ];

  useEffect(() => {
    fetchReports();
  }, [currentPage, pageSize, sortField, sortOrder]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/procurements/reports', {
        params: {
          page: currentPage,
          pageSize: pageSize,
          sortField: sortField,
          sortOrder: sortOrder
        }
      });
      
      if (response.data && response.data.data) {
        setReports(response.data.data);
        setTotalItems(response.data.pagination.total);
        setTotalPages(response.data.pagination.totalPages);
      } else {
        setReports(response.data || []);
        setTotalItems(response.data?.length || 0);
        setTotalPages(1);
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
    setCurrentPage(1); // Reset to first page when changing sort
  };

  const handleEdit = (id) => {
    navigate(`/procurements/reports/update/${id}`);
  };

  const handleView = (id) => {
    navigate(`/procurements/reports/view/${id}`);
  };

  const handleDeleteClick = (report) => {
    setReportToDelete(report);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (reportToDelete) {
      try {
        await axiosInstance.delete(`/procurements/reports/${reportToDelete.id}`);
        fetchReports(); // Refresh the list
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="list-content">
            <div className="empty-state">Loading...</div>
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
            title="Procurement Reports" 
            showBackButton={false}
            showAdd={true}
            addPath="/procurements/reports/add"
          />

          {error && (
            <div className="status-message status-message--error">{error}</div>
          )}

          {reports.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-text">No procurement reports found</div>
              <div className="empty-state-subtext">Click the + icon to create your first report</div>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th style={{textAlign: 'center'}}>POs 
                        <br /> (Gen.../Pend.../Fulf...)
                        </th>
                      <th style={{textAlign: 'center'}}>PIs 
                        <br /> (Gen.../Unpaid)
                        </th>
                      <th style={{textAlign: 'center'}}>Amount 
                        <br /> (Paid/Unpaid)
                        </th>
                      <th style={{textAlign: 'center'}}>Tenders</th>
                      <th className="hide-on-mobile">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id}>
                        <td>{formatDate(report.date)}</td>
                        <td>
                          <div className="po-summary">
                            <span className="po-value po-generated">{report.total_generated_pos}</span>
                            <span className="po-value po-pending">{report.pending_pos}</span>
                            <span className="po-value po-fulfilled">{report.fulfilled_pos}</span>
                          </div>
                        </td>
                        <td>
                          <div className="pi-summary">
                            <span className="pi-value pi-generated">{report.total_generated_pis}</span>
                            <span className="pi-value pi-unpaid">{report.unpaid_pis}</span>
                          </div>
                        </td>
                        <td>
                          <div className="amount-summary">
                            <span className="amount-value amount-paid">{formatCurrency(report.total_paid_amount)}</span>
                            <span className="amount-value amount-unpaid">{formatCurrency(report.unpaid_amount)}</span>
                          </div>
                        </td>
                        <td>{report.tenders}</td>
                        <td className="table-actions">
                          <ActionMenu
                            actions={[
                              {
                                label: 'View',
                                icon: <FiEye />,
                                color: '#4CAF50',
                                onClick: () => handleView(report.id),
                                visible: true
                              },
                              {
                                label: 'Edit',
                                icon: <FiEdit2 />,
                                color: '#2196F3',
                                onClick: () => handleEdit(report.id),
                                visible: true
                              },
                              {
                                label: 'Delete',
                                icon: <FiTrash2 />,
                                color: '#f44336',
                                onClick: () => handleDeleteClick(report),
                                visible: true
                              }
                            ]}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

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
            </>
          )}

          <ConfirmationModal
            isOpen={showDeleteModal}
            onConfirm={handleDeleteConfirm}
            onCancel={handleDeleteCancel}
            title="Delete Report"
            message={`Are you sure you want to delete the procurement report for ${reportToDelete ? formatDate(reportToDelete.date) : ''}?`}
            confirmText="Delete"
            cancelText="Cancel"
          />
        </div>
      </div>
    </>
  );
};

export default ProcurementReportsList; 