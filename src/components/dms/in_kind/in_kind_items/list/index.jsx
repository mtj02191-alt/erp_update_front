import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import ActionMenu from '../../../../common/ActionMenu';
import ConfirmationModal from '../../../../common/ConfirmationModal';
import Pagination from '../../../../common/Pagination';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import {
  SearchFilter,
  DropdownFilter,
  CollapsibleFilters,
  SearchButton,
  ClearButton,
} from '../../../../common/filters';
import useFiltersPanel from '../../../../../hooks/useFiltersPanel';
import { useAuth } from '../../../../../context/AuthContext';
import { hasPermission } from '../../../../../utils/permissions';
import {
  IN_KIND_CATEGORY_OPTIONS,
  getInKindCategoryLabel,
} from '../../../../../utils/inKindCategories';
import '../inKindItems.css';

const EMPTY_FILTERS = {
  search: '',
  category: '',
};

const categoryOptions = IN_KIND_CATEGORY_OPTIONS;

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getCategoryBadge = (category) => {
  const key = String(category || 'other').toLowerCase();
  return (
    <span className={`inkind-category-badge inkind-category-badge--${key}`}>
      {getInKindCategoryLabel(category)}
    </span>
  );
};

const getStatusBadge = (item) => {
  const archived = item?.is_archived === true;
  return (
    <span className={`status-badge ${archived ? 'status-cancelled' : 'status-completed'}`}>
      {archived ? 'Archived' : 'Active'}
    </span>
  );
};

const InKindItemsList = () => {
  const { permissions } = useAuth();
  const { filtersOpen, toggleFilters } = useFiltersPanel();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [tempFilters, setTempFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [listRefreshNonce, setListRefreshNonce] = useState(0);

  const canCreate = useMemo(
    () =>
      permissions?.super_admin === true ||
      permissions?.fund_raising_manager === true ||
      hasPermission(permissions, 'fund_raising', 'donation_in_kind_items', 'create'),
    [permissions],
  );

  const canUpdate = useMemo(
    () =>
      permissions?.super_admin === true ||
      permissions?.fund_raising_manager === true ||
      hasPermission(permissions, 'fund_raising', 'donation_in_kind_items', 'update'),
    [permissions],
  );

  const canDelete = useMemo(
    () =>
      permissions?.super_admin === true ||
      permissions?.fund_raising_manager === true ||
      hasPermission(permissions, 'fund_raising', 'donation_in_kind_items', 'delete'),
    [permissions],
  );

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: currentPage,
        pageSize,
        sortField: sortBy,
        sortOrder,
      };
      if (appliedFilters.search) params.search = appliedFilters.search;
      if (appliedFilters.category) params.category = appliedFilters.category;

      const response = await axiosInstance.get('/dms/in-kind-items/list', { params });
      const payload = response.data?.data;
      const rows = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];

      setItems(rows);
      setTotalPages(payload?.totalPages || response.data?.pagination?.totalPages || 1);
      setTotalItems(payload?.total || response.data?.pagination?.total || rows.length);
    } catch (err) {
      console.error('Error fetching in-kind items:', err);
      setError(err.response?.data?.message || 'Failed to fetch in-kind items. Please try again.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [currentPage, pageSize, sortBy, sortOrder, appliedFilters, listRefreshNonce]);

  const handleRefresh = () => setListRefreshNonce((n) => n + 1);

  const handleFilterChange = (key, value) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...tempFilters });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setTempFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setCurrentPage(1);
  };

  const handleSortChange = (field, order) => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const sortOptions = [
    { value: 'created_at', label: 'Created Date' },
    { value: 'updated_at', label: 'Updated Date' },
    { value: 'name', label: 'Name' },
    { value: 'category', label: 'Category' },
  ];

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axiosInstance.delete(`/dms/in-kind-items/${deleteTarget.id}`);
      setDeleteTarget(null);
      handleRefresh();
    } catch (err) {
      console.error('Error deleting item:', err);
      setError(err.response?.data?.message || 'Failed to delete item. Please try again.');
      setDeleteTarget(null);
    }
  };

  const getRowActions = (item) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#4CAF50',
      to: `/dms/in-kind-items/view/${item.id}`,
      visible: true,
    },
    {
      icon: <FiEdit2 />,
      label: 'Edit',
      color: '#2196F3',
      to: `/dms/in-kind-items/edit/${item.id}`,
      visible: canUpdate,
    },
    {
      icon: <FiTrash2 />,
      label: 'Delete',
      color: '#f44336',
      onClick: () => setDeleteTarget(item),
      visible: canDelete,
    },
  ];

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          title="In-Kind Items"
          showBackButton={false}
          showAdd={!!canCreate}
          addPath="/dms/in-kind-items/add"
          showFilterToggle
          filtersOpen={filtersOpen}
          onFilterToggle={toggleFilters}
          onRefresh={handleRefresh}
          refreshing={loading}
        />

        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}
          {loading && items.length === 0 && <div className="loading">Loading in-kind items...</div>}

          <CollapsibleFilters open={filtersOpen}>
            <div className="filters-section">
              <SearchFilter
                filterKey="search"
                label="Search"
                filters={tempFilters}
                onFilterChange={handleFilterChange}
                placeholder="Search by item name..."
              />
              <DropdownFilter
                filterKey="category"
                label="Category"
                filters={tempFilters}
                onFilterChange={handleFilterChange}
                data={categoryOptions}
                placeholder="All Categories"
              />
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-end',
                  marginTop: '20px',
                  width: '100%',
                }}
              >
                <SearchButton onClick={handleApplyFilters} text="Search" loading={loading} />
                <ClearButton onClick={handleClearFilters} text="Clear" />
              </div>
            </div>
          </CollapsibleFilters>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th className="hide-on-mobile">Description</th>
                  <th>Status</th>
                  <th className="hide-on-mobile">Created</th>
                  <th className="table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="no-data">
                      No in-kind items found
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Link
                          to={`/dms/in-kind-items/view/${item.id}`}
                          className="inkind-item-name"
                          style={{ color: 'inherit', textDecoration: 'inherit' }}
                        >
                          {item.name}
                        </Link>
                      </td>
                      <td>{getCategoryBadge(item.category)}</td>
                      <td className="hide-on-mobile">
                        <div className="inkind-item-description" title={item.description || ''}>
                          {item.description || '—'}
                        </div>
                      </td>
                      <td>{getStatusBadge(item)}</td>
                      <td className="hide-on-mobile">{formatDate(item.created_at)}</td>
                      <td className="table-actions" onClick={(e) => e.stopPropagation()}>
                        <ActionMenu actions={getRowActions(item)} />
                      </td>
                    </tr>
                  ))
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
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              onSortChange={handleSortChange}
              sortField={sortBy}
              sortOrder={sortOrder}
              sortOptions={sortOptions}
            />
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!deleteTarget}
        text={`Are you sure you want to delete "${deleteTarget?.name || ''}"? This action cannot be undone.`}
        delete
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default InKindItemsList;
