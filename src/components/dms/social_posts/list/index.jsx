import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import ConfirmationModal from '../../../common/ConfirmationModal';
import Pagination from '../../../common/Pagination';
import { SearchFilter, DropdownFilter, CollapsibleFilters } from '../../../common/filters';
import { SearchButton, ClearButton } from '../../../common/filters';
import useFiltersPanel from '../../../../hooks/useFiltersPanel';

import { FiEye, FiRepeat, FiRefreshCw, FiTrash2 } from 'react-icons/fi';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const SocialPostsList = () => {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { filtersOpen, toggleFilters } = useFiltersPanel();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [syncingId, setSyncingId] = useState(null);
  const [infoMessage, setInfoMessage] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  const EMPTY_FILTERS = useMemo(
    () => ({
      search: '',
      status: '',
    }),
    [],
  );

  const [tempFilters, setTempFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);

  const handleFilterChange = (key, value) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    const changed = JSON.stringify(tempFilters) !== JSON.stringify(appliedFilters);
    if (changed) {
      setAppliedFilters(tempFilters);
      setCurrentPage(1);
    } else {
      fetchSocialPosts();
    }
  };

  const handleClearFilters = () => {
    setTempFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setCurrentPage(1);
  };

  const fetchSocialPosts = async () => {
    try {
      setLoading(true);
      setError('');

      const filters = { ...appliedFilters };
      Object.keys(filters).forEach((k) => !filters[k] && delete filters[k]);

      const response = await axiosInstance.post('/social-posts/search', {
        pagination: {
          page: currentPage,
          pageSize,
          sortField,
          sortOrder,
        },
        filters,
      });

      if (response.data.success) {
        setRows(response.data.data || []);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        setError(response.data.message || 'Failed to fetch social posts');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch social posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocialPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, sortField, sortOrder, appliedFilters]);

  const handleDeleteConfirm = async () => {
    if (!rowToDelete) return;
    try {
      await axiosInstance.delete(`/social-posts/${rowToDelete.id}`);
      setShowDeleteModal(false);
      setRowToDelete(null);
      fetchSocialPosts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to archive post');
    }
  };

  const handlePublish = async (row) => {
    try {
      setError('');
      setInfoMessage('');
      await axiosInstance.post(`/social-posts/${row.id}/publish`);
      fetchSocialPosts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish to Buffer');
    }
  };

  const handleSyncStatus = async (row) => {
    try {
      setSyncingId(row.id);
      setError('');
      setInfoMessage('');
      const res = await axiosInstance.post(`/social-posts/${row.id}/sync-buffer-status`);
      if (res.data.success) {
        setInfoMessage(res.data.message || 'Status synced from Buffer');
        fetchSocialPosts();
      } else {
        setError(res.data.message || 'Failed to sync status from Buffer');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to sync status from Buffer');
    } finally {
      setSyncingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: '#6b7280',
      scheduled: '#3b82f6',
      published: '#10b981',
      failed: '#ef4444',
      cancelled: '#9ca3af',
    };
    return (
      <span
        style={{
          padding: '4px 8px',
          borderRadius: '4px',
          backgroundColor: colors[status] || '#6b7280',
          color: 'white',
          fontSize: '12px',
          textTransform: 'capitalize',
        }}
      >
        {status || '-'}
      </span>
    );
  };

  const getActions = (row) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#2196f3',
      onClick: () => navigate(`/dms/social-posts/view/${row.id}`),
      visible: true,
    },
    {
      icon: <FiRefreshCw />,
      label: 'Check Buffer Status',
      color: '#8b5cf6',
      onClick: () => handleSyncStatus(row),
      visible: !!row.buffer_post_id,
      disabled: syncingId === row.id,
    },
    {
      icon: <FiRepeat />,
      label: 'Publish to Buffer',
      color: '#10b981',
      onClick: () => handlePublish(row),
      visible: row.status !== 'published' && row.status !== 'cancelled',
    },
    {
      icon: <FiTrash2 />,
      label: 'Archive',
      color: '#f44336',
      onClick: () => {
        setRowToDelete(row);
        setShowDeleteModal(true);
      },
      visible: true,
    },
  ];

  if (loading && rows.length === 0) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader
          onRefresh={fetchSocialPosts}
          refreshing={loading} title="Social Posts" />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          onRefresh={fetchSocialPosts}
          refreshing={loading}
          title="Social Posts"
          subtitle="Create and schedule posts through Buffer"
          showBackButton={false}
          showFilterToggle
          filtersOpen={filtersOpen}
          onFilterToggle={toggleFilters}
          showAdd={true}
          addPath="/dms/social-posts/add"
        />

        {error && <div className="error-message">{error}</div>}
        {infoMessage && (
          <div
            className="error-message"
            style={{ backgroundColor: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}
          >
            {infoMessage}
          </div>
        )}

        <CollapsibleFilters open={filtersOpen}>
        <div className="filters-section">
          <SearchFilter
            value={tempFilters.search}
            onChange={(v) => handleFilterChange('search', v)}
            placeholder="Search post text/channel..."
          />

          <DropdownFilter
            label="Status"
            value={tempFilters.status}
            onChange={(v) => handleFilterChange('status', v)}
            options={STATUS_OPTIONS}
          />

          <SearchButton onClick={handleApplyFilters} />
          <ClearButton onClick={handleClearFilters} />
        </div>
        </CollapsibleFilters>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Channel</th>
                <th>Text</th>
                <th>Scheduled</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>
                    No social posts found
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.buffer_channel_name || '-'}</td>
                    <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {row.post_text || '-'}
                    </td>
                    <td>
                      {row.scheduled_at ? new Date(row.scheduled_at).toLocaleString() : '-'}
                    </td>
                    <td>{getStatusBadge(row.status)}</td>
                    <td>
                      <ActionMenu actions={getActions(row)} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        text="Archive social post?"
        delete
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteModal(false);
          setRowToDelete(null);
        }}
      />
    </>
  );
};

export default SocialPostsList;

