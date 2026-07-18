import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import PageHeader from '../../../../common/PageHeader';
import ActionMenu from '../../../../common/ActionMenu';
import Pagination from '../../../../common/Pagination';
import ConfirmationModal from '../../../../common/ConfirmationModal';
import Navbar from '../../../../Navbar';
import { FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';
import './index.css';

const AreaRationReportsList = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('report_date');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line
  }, [currentPage, pageSize, sortField, sortOrder]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/program/area_ration/reports', {
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
        setReports([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (err) {
      setError('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => setCurrentPage(page);
  const handlePageSizeChange = (size) => { setPageSize(size); setCurrentPage(1); };
  const handleSortChange = (field, order) => { setSortField(field); setSortOrder(order); setCurrentPage(1); };
  const handleEdit = (id) => navigate(`/program/area_ration/reports/update/${id}`);
  const handleView = (id) => navigate(`/program/area_ration/reports/view/${id}`);
  const handleDeleteClick = (report) => { setReportToDelete(report); setShowDeleteModal(true); };
  const handleDeleteConfirm = async () => {
    if (reportToDelete) {
      try {
        await axiosInstance.delete(`/program/area_ration/reports/${reportToDelete.id}`);
        fetchReports();
        setError('');
      } catch (err) {
        setError('Failed to delete report');
      }
    }
    setShowDeleteModal(false);
    setReportToDelete(null);
  };
  const handleDeleteCancel = () => { setShowDeleteModal(false); setReportToDelete(null); };
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper"><div className="list-content"><div className="empty-state">Loading...</div></div></div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <div className="list-content">
          <PageHeader 
            title="Area Ration Reports" 
            showBackButton={false}
            showAdd={true}
            addPath="/program/area_ration/reports/add"
          />
          {error && <div className="status-message status-message--error">{error}</div>}
          {reports.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-text">No area ration reports found</div>
              <div className="empty-state-subtext">Click the + icon to create your first report</div>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Province</th>
                      <th>District</th>
                      <th>City</th>
                      <th>Quantity</th>
                      <th className="hide-on-mobile">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id}>
                        <td>{formatDate(report.report_date)}</td>
                        <td>{report.province}</td>
                        <td>{report.district}</td>
                        <td>{report.city}</td>
                        <td>{report.quantity}</td>
                        <td className="table-actions">
                          <ActionMenu
                            actions={[
                              { label: 'View', icon: <FiEye />, color: '#4CAF50', onClick: () => handleView(report.id), visible: true },
                              { label: 'Edit', icon: <FiEdit />, color: '#2196F3', onClick: () => handleEdit(report.id), visible: true },
                              { label: 'Delete', icon: <FiTrash2 />, color: '#f44336', onClick: () => handleDeleteClick(report), visible: true }
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
                sortOptions={[
                  { value: 'report_date', label: 'Date' },
                  { value: 'province', label: 'Province' },
                  { value: 'district', label: 'District' },
                  { value: 'city', label: 'City' },
                  { value: 'quantity', label: 'Quantity' }
                ]}
              />
            </>
          )}
        </div>
      </div>
      <ConfirmationModal
        isOpen={showDeleteModal}
        text={`Are you sure you want to delete the area ration report from ${reportToDelete?.report_date ? formatDate(reportToDelete.report_date) : ''}?`}
        delete={true}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};

export default AreaRationReportsList; 