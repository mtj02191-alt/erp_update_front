import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import ConfirmationModal from '../../../common/ConfirmationModal';
import { SearchFilter, DropdownFilter, CollapsibleFilters } from '../../../common/filters';
import { SearchButton, ClearButton } from '../../../common/filters';
import useFiltersPanel from '../../../../hooks/useFiltersPanel';
import { FiEye, FiEdit, FiTrash2, FiAlertCircle, FiStar } from 'react-icons/fi';

const AppealsList = () => {
  const navigate = useNavigate();
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [appealToDelete, setAppealToDelete] = useState(null);
  const [tempFilters, setTempFilters] = useState({ search: '', status: '', category: '' });
  const [appliedFilters, setAppliedFilters] = useState({ search: '', status: '', category: '' });
  const { filtersOpen, toggleFilters } = useFiltersPanel();

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'ended', label: 'Ended' },
    { value: 'archived', label: 'Archived' },
  ];

  const categoryOptions = [
    { value: 'medical', label: 'Medical' },
    { value: 'education', label: 'Education' },
    { value: 'ration', label: 'Ration' },
    { value: 'widow_support', label: 'Widow Support' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'other', label: 'Other' },
  ];

  const handleFilterChange = (key, value) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    if (JSON.stringify(appliedFilters) !== JSON.stringify(tempFilters)) {
      setAppliedFilters(tempFilters);
    } else {
      fetchAppeals();
    }
  };

  const handleClearFilters = () => {
    setTempFilters({ search: '', status: '', category: '' });
    setAppliedFilters({ search: '', status: '', category: '' });
  };

  const fetchAppeals = async () => {
    try {
      setLoading(true);
      const params = { ...appliedFilters };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const response = await axiosInstance.get('/appeals', { params });
      if (response.data.success) {
        setAppeals(response.data.data || []);
      } else {
        setError('Failed to fetch appeals');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch appeals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppeals();
  }, [appliedFilters]);

  const handleDeleteConfirm = async () => {
    if (!appealToDelete) return;
    try {
      await axiosInstance.delete(`/appeals/${appealToDelete.id}`);
      setShowDeleteModal(false);
      setAppealToDelete(null);
      fetchAppeals();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to archive appeal');
    }
  };

  const getActions = (appeal) => [
    { icon: <FiEye />, label: 'View', color: '#2196f3', onClick: () => navigate(`/dms/appeals/view/${appeal.id}`), visible: true },
    { icon: <FiEdit />, label: 'Edit', color: '#ff9800', onClick: () => navigate(`/dms/appeals/edit/${appeal.id}`), visible: true },
    {
      icon: <FiTrash2 />,
      label: 'Archive',
      color: '#f44336',
      onClick: () => { setAppealToDelete(appeal); setShowDeleteModal(true); },
      visible: true,
    },
  ];

  const getStatusBadge = (status) => {
    const colors = { draft: '#6b7280', active: '#10b981', paused: '#f59e0b', ended: '#8b5cf6', archived: '#9ca3af' };
    return (
      <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: colors[status] || '#6b7280', color: 'white', fontSize: '12px', textTransform: 'capitalize' }}>
        {status}
      </span>
    );
  };

  const formatAmount = (amount, currency = 'PKR') => {
    if (amount == null) return '-';
    return `${currency} ${Number(amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <AppealsListLoading />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          onRefresh={fetchAppeals}
          refreshing={loading} title="Urgent Appeals" showBackButton={false} showFilterToggle filtersOpen={filtersOpen} onFilterToggle={toggleFilters} showAdd addPath="/dms/appeals/add" />
        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}

          <CollapsibleFilters open={filtersOpen}>
          <div className="filters-section">
            <SearchFilter filterKey="search" label="Search" filters={tempFilters} onFilterChange={handleFilterChange} placeholder="Search by title..." />
            <DropdownFilter filterKey="status" label="Status" data={statusOptions} filters={tempFilters} onFilterChange={handleFilterChange} placeholder="All Statuses" />
            <DropdownFilter filterKey="category" label="Category" data={categoryOptions} filters={tempFilters} onFilterChange={handleFilterChange} placeholder="All Categories" />
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginTop: '20px', width: '100%' }}>
              <SearchButton onClick={handleApplyFilters} text="Search" loading={loading} />
              <ClearButton onClick={handleClearFilters} text="Clear" />
            </div>
          </div>
          </CollapsibleFilters>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Raised / Goal</th>
                  <th>Progress</th>
                  <th>Flags</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appeals.length === 0 ? (
                  <tr><td colSpan="7" className="no-data">No appeals found</td></tr>
                ) : (
                  appeals.map((appeal) => (
                    <tr key={appeal.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{appeal.title}</div>
                        {appeal.slug && (
                          <div style={{ fontSize: 12, color: '#666' }}>{appeal.slug}</div>
                        )}
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{(appeal.category || '').replace('_', ' ')}</td>
                      <td>{getStatusBadge(appeal.status)}</td>
                      <td>{formatAmount(appeal.raised_amount, appeal.currency)} / {formatAmount(appeal.goal_amount, appeal.currency)}</td>
                      <td>{appeal.progress_percent ?? 0}%</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {appeal.is_urgent && <FiAlertCircle color="#ef4444" title="Urgent" />}
                          {appeal.is_featured && <FiStar color="#f59e0b" fill="#f59e0b" title="Featured" />}
                        </div>
                      </td>
                      <td><ActionMenu actions={getActions(appeal)} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        text={`Archive appeal "${appealToDelete?.title}"?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setShowDeleteModal(false); setAppealToDelete(null); }}
      />
    </>
  );
};

function AppealsListLoading() {
  return (
    <div className="list-wrapper">
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading appeals...</p>
      </div>
    </div>
  );
}

export default AppealsList;
