import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import Pagination from '../../../common/Pagination';
import ConfirmationModal from '../../../common/ConfirmationModal';
import Navbar from '../../../Navbar';
import { FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';
import '../../AccountsAndFinance.css';

const AccountsAndFinanceReportsList = () => {
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
    { value: 'daily_inflow', label: 'Daily Inflow' },
    { value: 'daily_outflow', label: 'Daily Outflow' },
    { value: 'available_funds', label: 'Available Funds' }
  ];

  useEffect(() => {
    fetchReports();
  }, [currentPage, pageSize, sortField, sortOrder]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/accounts-and-finance/reports', {
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
      setError(err.message);
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
    navigate(`/accounts_and_finance/reports/update/${id}`);
  };

  const handleView = (id) => {
    navigate(`/accounts_and_finance/reports/view/${id}`);
  };

  const handleDeleteClick = (report) => {
    setReportToDelete(report);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (reportToDelete) {
      try {
        await axiosInstance.delete(`/accounts-and-finance/reports/${reportToDelete.id}`);
        fetchReports(); // Refresh the list
        setError('');
      } catch (err) {
        setError(err?.message);
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

  const handleBack = () => {
    navigate('/accounts_and_finance');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2
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
            title="Accounts & Finance Reports" 
            showBackButton={false}
            showAdd={true}
            addPath="/accounts_and_finance/reports/add"
          />

          {error && (
            <div className="status-message status-message--error">
              {error}
            </div>
          )}

          {reports.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-text">No accounts and finance reports found</div>
              <div className="empty-state-subtext">Click the + icon to create your first report</div>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Daily Inflow</th>
                      <th>Daily Outflow</th>
                      <th>Available Funds</th>
                      <th>Pending Payable</th>
                      <th className="hide-on-mobile">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id}>
                        <td>{formatDate(report.date)}</td>
                        <td className="amount-positive">{formatCurrency(report.daily_inflow)}</td>
                        <td className="amount-negative">{formatCurrency(report.daily_outflow)}</td>
                        <td className="amount-positive">{formatCurrency(report.available_funds)}</td>
                        <td className="amount-neutral">{formatCurrency(report.pending_payable)}</td>
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
                                icon: <FiEdit />,
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
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        text={`Are you sure you want to delete the accounts and finance report from ${reportToDelete?.date ? formatDate(reportToDelete.date) : ''}?`}
        delete={true}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};

export default AccountsAndFinanceReportsList; 