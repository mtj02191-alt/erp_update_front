import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const HEALTH_TYPES = ['In-house', 'Referred', 'Surgeries Supported', 'Ambulance', 'Medicines'];

const HealthReportsList = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('DESC');

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, sortField, sortOrder]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = { page: currentPage, pageSize, sortField, sortOrder };
      const response = await axiosInstance.get('/program/health/reports', { params });
      if (response.data?.success) {
        setReports(response.data.data || []);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setError('');
      } else {
        setError(response.data?.message || 'Failed to fetch reports');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch reports');
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
        await axiosInstance.delete(`/program/health/reports/date/${reportToDelete.date}`);
        fetchReports();
      } catch (err) {
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

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

  const sumObjectValues = (obj) => Object.values(obj || {}).reduce((sum, v) => sum + (Number(v) || 0), 0);

  const getTotalsByType = (distributions) => {
    const totals = HEALTH_TYPES.reduce((acc, t) => ({ ...acc, [t]: 0 }), {});
    (distributions || []).forEach((dist) => {
      const t = dist?.type;
      const count = sumObjectValues(dist?.vulnerabilities);
      if (totals[t] !== undefined) totals[t] += count;
    });
    const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);
    return { totals, grandTotal };
  };

  const getActionMenuItems = (report) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#4CAF50',
      onClick: () => navigate(`/program/health/reports/view/${report.id}`),
      visible: true,
    },
    {
      icon: <FiEdit2 />,
      label: 'Edit',
      color: '#2196F3',
      onClick: () => navigate(`/program/health/reports/update/${report.id}`),
      visible: true,
    },
    {
      icon: <FiTrash2 />,
      label: 'Delete',
      color: '#f44336',
      onClick: () => handleDeleteClick(report),
      visible: true,
    },
  ];

  const sortOptions = [
    { value: 'date', label: 'Date' },
    { value: 'type', label: 'Type' },
    { value: 'widows', label: 'Widows' },
    { value: 'divorced', label: 'Divorced' },
    { value: 'disable', label: 'Disable' },
    { value: 'indegent', label: 'Indegent' },
    { value: 'orphans', label: 'Orphans' },
    { value: 'created_at', label: 'Created At' },
  ];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader title="Health Reports" showBackButton={false} showAdd={true} addPath="/program/health/reports/add" />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader title="Health Reports" showBackButton={false} showAdd={true} addPath="/program/health/reports/add" />
        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>In-house</th>
                  <th>Referred</th>
                  <th>Surgeries Supported</th>
                  <th>Ambulance</th>
                  <th>Medicines</th>
                  <th>Grand Total</th>
                  <th className="table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => {
                  const { totals, grandTotal } = getTotalsByType(report.distributions);
                  return (
                    <tr key={report.id}>
                      <td>{formatDate(report.date)}</td>
                      <td>{totals['In-house']}</td>
                      <td>{totals['Referred']}</td>
                      <td>{totals['Surgeries Supported']}</td>
                      <td>{totals['Ambulance']}</td>
                      <td>{totals['Medicines']}</td>
                      <td>{grandTotal}</td>
                      <td className="table-actions">
                        <ActionMenu actions={getActionMenuItems(report)} />
                      </td>
                    </tr>
                  );
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
              onPageChange={(page) => setCurrentPage(page)}
              onPageSizeChange={(newPageSize) => {
                setPageSize(newPageSize);
                setCurrentPage(1);
              }}
              onSortChange={(field, order) => {
                setSortField(field);
                setSortOrder(order);
                setCurrentPage(1);
              }}
              sortField={sortField}
              sortOrder={sortOrder}
              sortOptions={sortOptions}
            />
          )}

          {reports.length === 0 && totalItems === 0 && (
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

export default HealthReportsList;

