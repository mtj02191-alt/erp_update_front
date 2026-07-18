import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import ConfirmationModal from '../../../common/ConfirmationModal';
import Pagination from '../../../common/Pagination';
import { FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi';
import './index.css';

const ProgramsList = () => {
  const navigate = useNavigate();

  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [programToDelete, setProgramToDelete] = useState(null);

  useEffect(() => {
    fetchPrograms();
    // eslint-disable-next-line
  }, [currentPage, pageSize, sortField, sortOrder]);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        pageSize: pageSize,
        sortField: sortField,
        sortOrder: sortOrder,
      };

      const response = await axiosInstance.get('/program/programs', { params });
      if (response.data.success) {
        setPrograms(response.data.data || []);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        setError('Failed to fetch programs');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch programs');
      console.error('Error fetching programs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => setCurrentPage(page);
  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };
  const handleSortChange = (field, order) => {
    setSortField(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const handleDeleteClick = (row) => {
    setProgramToDelete(row);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!programToDelete) return;
    try {
      await axiosInstance.delete(`/program/programs/${programToDelete.id}`);
      setShowDeleteModal(false);
      setProgramToDelete(null);
      fetchPrograms();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete program');
      console.error('Error deleting program:', err);
    }
  };

  const getActionMenuItems = (row) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#4CAF50',
      onClick: () => navigate(`/program/programs/view/${row.id}`),
      visible: true,
    },
    {
      icon: <FiEdit2 />,
      label: 'Edit',
      color: '#2196F3',
      onClick: () => navigate(`/program/programs/update/${row.id}`),
      visible: true,
    },
    {
      icon: <FiTrash2 />,
      label: 'Delete',
      color: '#f44336',
      onClick: () => handleDeleteClick(row),
      visible: true,
    },
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Created At' },
    { value: 'key', label: 'Key' },
    { value: 'label', label: 'Label' },
    { value: 'status', label: 'Status' },
    { value: 'applicationable', label: 'Application reports' },
  ];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader title="Programs" showBackButton={false} showAdd={true} addPath="/program/programs/add" />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader title="Programs" showBackButton={false} showAdd={true} addPath="/program/programs/add" />
        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Label</th>
                  <th className="hide-on-mobile">Logo</th>
                  <th>Status</th>
                  <th className="hide-on-mobile">App reports</th>
                  <th className="table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((row) => (
                  <tr key={row.id}>
                    <td className="mono">{row.key}</td>
                    <td>{row.label}</td>
                    <td className="hide-on-mobile">{row.logo || '-'}</td>
                    <td>
                      <span className={`status-badge ${row.status === 'active' ? 'active' : 'inactive'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="hide-on-mobile">
                      <span className={`status-badge ${row.applicationable !== false ? 'active' : 'inactive'}`}>
                        {row.applicationable !== false ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="table-actions">
                      <ActionMenu actions={getActionMenuItems(row)} />
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
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        delete={true}
        text={`Delete program "${programToDelete?.label}"?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteModal(false);
          setProgramToDelete(null);
        }}
      />
    </>
  );
};

export default ProgramsList;

