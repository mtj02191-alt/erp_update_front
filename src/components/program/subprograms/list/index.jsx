import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import ConfirmationModal from '../../../common/ConfirmationModal';
import Pagination from '../../../common/Pagination';
import SearchableDropdown from '../../../common/SearchableDropdown';
import { SearchFilter, SearchButton, ClearButton } from '../../../common/filters';
import { FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi';
import './index.css';

const SubprogramsList = () => {
  const navigate = useNavigate();

  const [subprograms, setSubprograms] = useState([]);
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

  // Filter state
  const [tempFilters, setTempFilters] = useState({ search: '', program_id: '' });
  const [appliedFilters, setAppliedFilters] = useState({ search: '', program_id: '' });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [targetToDelete, setTargetToDelete] = useState(null);

  useEffect(() => {
    fetchSubprograms();
    // eslint-disable-next-line
  }, [currentPage, pageSize, sortField, sortOrder, appliedFilters]);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await axiosInstance.get('/program/programs', {
          params: { page: 1, pageSize: 1000 },
        });
        if (response.data?.success) {
          setPrograms(response.data.data || []);
        }
      } catch (err) {
        console.error('Error fetching programs:', err);
      }
    };
    fetchPrograms();
  }, []);

  const fetchSubprograms = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        pageSize: pageSize,
        sortField: sortField,
        sortOrder: sortOrder,
        search: appliedFilters.search,
        program_id: appliedFilters.program_id,
      };

      const response = await axiosInstance.get('/program/subprograms', { params });
      if (response.data.success) {
        setSubprograms(response.data.data || []);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        setError('Failed to fetch subprograms');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch subprograms');
      console.error('Error fetching subprograms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters(tempFilters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    const empty = { search: '', program_id: '' };
    setTempFilters(empty);
    setAppliedFilters(empty);
    setCurrentPage(1);
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

  const getProgramTitle = (programId) => {
    const program = programs.find((p) => p.id === programId);
    return program ? program.label : programId;
  };

  const handleDeleteClick = (row) => {
    setTargetToDelete(row);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!targetToDelete) return;
    try {
      await axiosInstance.delete(`/program/subprograms/${targetToDelete.id}`);
      setShowDeleteModal(false);
      setTargetToDelete(null);
      fetchSubprograms();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete subprogram');
      console.error('Error deleting subprogram:', err);
    }
  };

  const getActionMenuItems = (row) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#4CAF50',
      onClick: () => navigate(`/program/subprograms/view/${row.id}`),
      visible: true,
    },
    {
      icon: <FiEdit2 />,
      label: 'Edit',
      color: '#2196F3',
      onClick: () => navigate(`/program/subprograms/update/${row.id}`),
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
    { value: 'program_id', label: 'Program' },
    { value: 'key', label: 'Key' },
    { value: 'label', label: 'Label' },
    { value: 'status', label: 'Status' },
  ];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader title="Subprograms" showBackButton={false} showAdd={true} addPath="/program/subprograms/add" />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader title="Subprograms" showBackButton={false} showAdd={true} addPath="/program/subprograms/add" />
        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}

          <div className="filters-container card">
            <div className="filters-grid">
              <div className="filter-item" style={{ marginBottom: '20px' }}>
                <SearchableDropdown
                  label="Filter by Program"
                  placeholder="Search and select program..."
                  apiEndpoint="/program/programs"
                  displayKey="label"
                  value={programs.find(p => p.id === tempFilters.program_id)}
                  onSelect={(item) => handleFilterChange('program_id', item?.id)}
                  onClear={() => handleFilterChange('program_id', '')}
                />
              </div>
            </div>
            <div className="filters-actions">
              <SearchButton onClick={handleApplyFilters} />
              <ClearButton onClick={handleClearFilters} />
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Program</th>
                  <th>Key</th>
                  <th>Label</th>
                  <th>Status</th>
                  <th className="table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subprograms.map((row) => (
                  <tr key={row.id}>
                    <td>{getProgramTitle(row.program_id)}</td>
                    <td className="subprogram-key">{row.key}</td>
                    <td>{row.label}</td>
                    <td>
                      <span className={`status-badge ${row.status === 'active' ? 'active' : 'inactive'}`}>
                        {row.status}
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
        text={`Delete subprogram "${targetToDelete?.label}"?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteModal(false);
          setTargetToDelete(null);
        }}
      />
    </>
  );
};

export default SubprogramsList;

