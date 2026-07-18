import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import ConfirmationModal from '../../../common/ConfirmationModal';
import Pagination from '../../../common/Pagination';
import '../../programs/list/index.css';

const DreamSchoolReportsList = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField] = useState('created_at');
  const [sortOrder] = useState('DESC');
  const [deleteRow, setDeleteRow] = useState(null);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line
  }, [currentPage, pageSize]);

  const fetchRows = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(currentPage),
        pageSize: String(pageSize),
        sortField,
        sortOrder,
      });
      const res = await axiosInstance.get(`/program/dream-school-reports?${params}`);
      if (res.data.success) {
        setRows(res.data.data || []);
        setTotalItems(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setError('');
      } else {
        setError(res.data.message || 'Failed to load');
        setRows([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const getActions = (row) => [
    { icon: <FiEye />, label: 'View', color: '#4CAF50', onClick: () => navigate(`/program/dream_school_reports/view/${row.id}`), visible: true },
    { icon: <FiEdit2 />, label: 'Edit', color: '#2196F3', onClick: () => navigate(`/program/dream_school_reports/edit/${row.id}`), visible: true },
    {
      icon: <FiTrash2 />,
      label: 'Delete',
      color: '#f44336',
      onClick: () => {
        setDeleteRow(row);
        setShowDelete(true);
      },
      visible: true,
    },
  ];

  const confirmDelete = async () => {
    if (!deleteRow) return;
    try {
      await axiosInstance.delete(`/program/dream-school-reports/${deleteRow.id}`);
      setShowDelete(false);
      setDeleteRow(null);
      fetchRows();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          title="Dream School Reports"
          showBackButton={false}
          showAdd={true}
          addPath="/program/dream_school_reports/add"
          addTitle="New report"
        />
        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}
          {loading && rows.length === 0 ? (
            <div className="loading">Loading…</div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Schools</th>
                    <th className="table-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.report_month}</td>
                      <td>{Array.isArray(row.lines) ? row.lines.length : 0}</td>
                      <td className="table-actions">
                        <ActionMenu actions={getActions(row)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
              onSortChange={() => {}}
              sortField={sortField}
              sortOrder={sortOrder}
              sortOptions={[{ value: 'created_at', label: 'Created' }]}
            />
          )}
        </div>
      </div>
      <ConfirmationModal
        isOpen={showDelete}
        delete={true}
        text={`Delete report for ${deleteRow?.report_month}?`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDelete(false);
          setDeleteRow(null);
        }}
      />
    </>
  );
};

export default DreamSchoolReportsList;
