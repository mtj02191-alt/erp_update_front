import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi';

import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import ConfirmationModal from '../../../common/ConfirmationModal';
import Pagination from '../../../common/Pagination';

// Reuse existing table/list styling
import '../../programs/list/index.css';

const AlHasanainClgList = () => {
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

  const fetchRows = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/program/al-hasanain-clg', {
        params: { page: currentPage, pageSize, sortField, sortOrder },
      });
      if (res.data?.success) {
        setRows(res.data?.data || []);
        setTotalItems(res.data?.pagination?.total || 0);
        setTotalPages(res.data?.pagination?.totalPages || 1);
        setError('');
      } else {
        setRows([]);
        setError(res.data?.message || 'Failed to load');
      }
    } catch (err) {
      setRows([]);
      setError(err.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line
  }, [currentPage, pageSize, sortField, sortOrder]);

  const sortOptions = [
    { value: 'created_at', label: 'Created At' },
    { value: 'total_students', label: 'Total Students' },
    { value: 'attendance_percent', label: 'Attendance %' },
    { value: 'dropout_rate', label: 'Dropout %' },
    { value: 'pass_rate', label: 'Pass %' },
    { value: 'fee_collection', label: 'Fee Collection' },
    { value: 'active_teachers', label: 'Active Teachers' },
  ];

  const getActions = (row) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#4CAF50',
      onClick: () => navigate(`/program/al_hasanain_clg/view/${row.id}`),
      visible: true,
    },
    {
      icon: <FiEdit2 />,
      label: 'Edit',
      color: '#2196F3',
      onClick: () => navigate(`/program/al_hasanain_clg/update/${row.id}`),
      visible: true,
    },
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
      await axiosInstance.delete(`/program/al-hasanain-clg/${toDelete.id}`);
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
            title="Al Hasanain CLG"
            showBackButton={false}
            showAdd
            addPath="/program/al_hasanain_clg/add"
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
          title="Al Hasanain CLG"
          showBackButton={false}
          showAdd
          addPath="/program/al_hasanain_clg/add"
        />

        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Students</th>
                  <th className="hide-on-mobile">Attendance %</th>
                  <th className="hide-on-mobile">Dropout %</th>
                  <th className="hide-on-mobile">Pass %</th>
                  <th>Fee</th>
                  <th className="hide-on-mobile">Teachers</th>
                  <th className="table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.total_students}</td>
                    <td className="hide-on-mobile">{row.attendance_percent}</td>
                    <td className="hide-on-mobile">{row.dropout_rate}</td>
                    <td className="hide-on-mobile">{row.pass_rate}</td>
                    <td>{row.fee_collection}</td>
                    <td className="hide-on-mobile">{row.active_teachers}</td>
                    <td className="table-actions">
                      <ActionMenu actions={getActions(row)} />
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '1rem' }}>
                      No rows found.
                    </td>
                  </tr>
                )}
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
        text={`Are you sure you want to delete this entry?`}
        delete={true}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setToDelete(null);
        }}
      />
    </>
  );
};

export default AlHasanainClgList;

