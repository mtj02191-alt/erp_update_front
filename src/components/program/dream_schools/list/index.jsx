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

const DreamSchoolsList = () => {
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
      const res = await axiosInstance.get('/program/dream-schools', {
        params: { page: currentPage, pageSize, sortField, sortOrder },
      });
      if (res.data.success) {
        setRows(res.data.data || []);
        setTotalItems(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } else {
        setError(res.data.message || 'Failed to fetch dream schools');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dream schools');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const sortOptions = [
    { value: 'created_at', label: 'Created At' },
    { value: 'school_code', label: 'School ID' },
    { value: 'student_count', label: 'Students' },
    { value: 'location', label: 'Location' },
    { value: 'kawish_id', label: 'Kawish ID' },
  ];

  const getActions = (row) => [
    { icon: <FiEye />, label: 'View', color: '#4CAF50', onClick: () => navigate(`/program/dream_schools/view/${row.id}`), visible: true },
    { icon: <FiEdit2 />, label: 'Edit', color: '#2196F3', onClick: () => navigate(`/program/dream_schools/update/${row.id}`), visible: true },
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
      await axiosInstance.delete(`/program/dream-schools/${toDelete.id}`);
      setShowDeleteModal(false);
      setToDelete(null);
      fetchRows();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading && rows.length === 0) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader title="Dream Schools" showBackButton={false} showAdd={true} addPath="/program/dream_schools/add" />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader title="Dream Schools" showBackButton={false} showAdd={true} addPath="/program/dream_schools/add" />
        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>School ID</th>
                  <th>Students</th>
                  <th className="hide-on-mobile">Location</th>
                  <th>Kawish ID</th>
                  <th className="table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="mono">{row.school_code}</td>
                    <td>{row.student_count}</td>
                    <td className="hide-on-mobile">{row.location}</td>
                    <td>{row.kawish_id}</td>
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
        delete={true}
        text={`Delete dream school "${toDelete?.school_code}"?`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setToDelete(null);
        }}
      />
    </>
  );
};

export default DreamSchoolsList;
