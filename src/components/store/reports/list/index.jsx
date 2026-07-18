import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import Pagination from '../../../common/Pagination';
import ConfirmationModal from '../../../common/ConfirmationModal';
import Navbar from '../../../Navbar';
import { FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';
import '../../Store.css';

const StoreReportsList = () => {
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
    { value: 'generated_demands', label: 'Demand Generated' },
    { value: 'generated_grn', label: 'Generated GRN' }
  ];

  useEffect(() => {
    fetchReports();
  }, [currentPage, pageSize, sortField, sortOrder]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/store/reports', {
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
    navigate(`/store/reports/update/${id}`);
  };

  const handleView = (id) => {
    navigate(`/store/reports/view/${id}`);
  };

  const handleDeleteClick = (report) => {
    setReportToDelete(report);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (reportToDelete) {
      try {
        await axiosInstance.delete(`/store/reports/${reportToDelete.id}`);
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

  const handleBack = () => {
    navigate('/store');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Helper function to format demands data
  const formatDemandsData = (report) => {
    const generated = report.generated_demands || 0;
    const pending = report.pending_demands || 0;
    const rejected = report.rejected_demands || 0;
    
    return (
      <div className="demands-summary">
        <span className="demand-value demand-generated">{generated}</span>
        <span className="demand-value demand-pending">{pending}</span>
        <span className="demand-value demand-rejected">{rejected}</span>
      </div>
    );
  };

  // Helper function to format GRN data
  const formatGRNData = (report) => {
    const generated = report.generated_grn || 0;
    const pending = report.pending_grn || 0;
    
    return (
      <div className="grn-summary">
        <span className="grn-value grn-generated">{generated}</span>
        <span className="grn-value grn-pending">{pending}</span>
      </div>
    );
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
            title="Store Reports" 
            showBackButton={false}
            showAdd={true}
            addPath="/store/reports/add"
          />

          {error && (
            <div className="status-message status-message--error">
              {error}
            </div>
          )}

          {reports.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-text">No store reports found</div>
              <div className="empty-state-subtext">Click the + icon to create your first report</div>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th style={{textAlign: 'center'}}>Demands 
                        <br />(Generated/Pending/Rejected)
                        </th>
                      <th style={{textAlign: 'center'}}>GRNs <br /> (Generated/Pending)</th>
                      <th className="hide-on-mobile">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id}>
                        <td>{formatDate(report.date)}</td>
                        <td>{formatDemandsData(report)}</td>
                        <td>{formatGRNData(report)}</td>
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
        text={`Are you sure you want to delete the store report from ${reportToDelete?.date ? formatDate(reportToDelete.date) : ''}?`}
        delete={true}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};

export default StoreReportsList; 