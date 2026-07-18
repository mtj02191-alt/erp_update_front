import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import ConfirmationModal from '../../../common/ConfirmationModal';
import Pagination from '../../../common/Pagination';
import { FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi';
import '../../programs/list/index.css';

const AasCollectionCentersReportsList = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line
  }, [currentPage, pageSize, sortField, sortOrder]);

  const fetchRows = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/program/aas-collection-centers-reports', {
        params: { page: currentPage, pageSize, sortField, sortOrder },
      });
      if (res.data.success) {
        setRows(res.data.data || []);
        setTotalItems(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setError('');
      } else {
        setError(res.data.message || 'Failed to load');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const sortOptions = [
    { value: 'created_at', label: 'Created At' },
    { value: 'total_patients', label: 'Total Patients' },
    { value: 'revenue', label: 'Revenue' },
    { value: 'total_camps', label: 'Total Camps' },
  ];

  const getActions = (row) => [
    { icon: <FiEye />, label: 'View', color: '#4CAF50', onClick: () => navigate(`/program/aas_collection_centers_reports/view/${row.id}`), visible: true },
    { icon: <FiEdit2 />, label: 'Edit', color: '#2196F3', onClick: () => navigate(`/program/aas_collection_centers_reports/update/${row.id}`), visible: true },
    {
      icon: <FiTrash2 />,
      label: 'Delete',
      color: '#f44336',
      onClick: () => {
        setToDelete(row);
        setShowDeleteModal(true);
      },
      visible: true,
    },
  ];

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await axiosInstance.delete(`/program/aas-collection-centers-reports/${toDelete.id}`);
      setShowDeleteModal(false);
      setToDelete(null);
      fetchRows();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  if (loading && rows.length === 0) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader
            title="AAS Lab — Collection Centers Report"
            showBackButton={false}
            showAdd
            addPath="/program/aas_collection_centers_reports/add"
          />
          <div className="loading">Loading…</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          title="AAS Lab — Collection Centers Report"
          showBackButton={false}
          showAdd
          addPath="/program/aas_collection_centers_reports/add"
        />
        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patients</th>
                  <th className="hide-on-mobile">Tests</th>
                  <th>Revenue</th>
                  <th className="hide-on-mobile">Camps</th>
                  <th className="table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.total_patients}</td>
                    <td className="hide-on-mobile">{row.tests_conducted}</td>
                    <td>{row.revenue}</td>
                    <td className="hide-on-mobile">{row.total_camps}</td>
                    <td className="table-actions">
                      <ActionMenu actions={getActions(row)} />
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
              onPageChange={setCurrentPage}
              onPageSizeChange={(n) => {
                setPageSize(n);
                setCurrentPage(1);
              }}
              onSortChange={(f, o) => {
                setSortField(f);
                setSortOrder(o);
                setCurrentPage(1);
              }}
              sortField={sortField}
              sortOrder={sortOrder}
              sortOptions={sortOptions}
            />
          )}
        </div>
      </div>
      <ConfirmationModal
        isOpen={showDeleteModal}
        delete
        text="Delete this AAS collection centers report?"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setToDelete(null);
        }}
      />
    </>
  );
};

export default AasCollectionCentersReportsList;
