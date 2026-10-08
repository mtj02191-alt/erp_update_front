import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';
import axiosInstance from '../../../../utils/axios';
import { useAuth } from '../../../../context/AuthContext';
import { canViewModule, fundRaisingOrganizationsOrPocsHas } from '../../../../utils/permissions';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import Pagination from '../../../common/Pagination';
import ConfirmationModal from '../../../common/ConfirmationModal';
import {
  SearchFilter,
  SearchButton,
  ClearButton,
  CollapsibleFilters,
  DropdownFilter,
} from '../../../common/filters';
import useFiltersPanel from '../../../../hooks/useFiltersPanel';

const emptyFilters = { search: '', city: '', is_active: '' };

const OrganizationsList = () => {
  const { permissions } = useAuth();
  const { filtersOpen, toggleFilters } = useFiltersPanel();

  const canCreate =
    fundRaisingOrganizationsOrPocsHas(permissions, 'create') ||
    permissions?.super_admin ||
    permissions?.fund_raising_manager;
  const canUpdate =
    fundRaisingOrganizationsOrPocsHas(permissions, 'update') ||
    permissions?.super_admin ||
    permissions?.fund_raising_manager;
  const canDelete =
    fundRaisingOrganizationsOrPocsHas(permissions, 'delete') ||
    permissions?.super_admin ||
    permissions?.fund_raising_manager;
  const canList =
    canViewModule(permissions, 'fund_raising', 'organizations') ||
    permissions?.super_admin ||
    permissions?.fund_raising_manager;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [tempFilters, setTempFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleFilterChange = (key, value) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSortChange = (field, order) => {
    setSortField(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const sortOptions = [
    { value: 'created_at', label: 'Created Date' },
    { value: 'updated_at', label: 'Updated Date' },
    { value: 'name', label: 'Name' },
    { value: 'city', label: 'City' },
    { value: 'is_active', label: 'Active' },
    { value: 'id', label: 'ID' },
  ];

  const fetchRows = async () => {
    if (!canList) {
      setError('You do not have permission to view CSR donors.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await axiosInstance.get('/csr-donors', {
        params: {
          search: appliedFilters.search || undefined,
          city: appliedFilters.city || undefined,
          is_active: appliedFilters.is_active !== '' ? appliedFilters.is_active : undefined,
          page: currentPage,
          pageSize,
          sortField,
          sortOrder,
        },
      });
      setRows(res.data?.data || []);
      const p = res.data?.pagination;
      if (p) {
        setTotalItems(p.total || 0);
        setTotalPages(p.totalPages || 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load CSR donors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, sortField, sortOrder, appliedFilters]);

  const handleApplyFilters = () => {
    setAppliedFilters(tempFilters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setTempFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setCurrentPage(1);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axiosInstance.delete(`/csr-donors/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchRows();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to archive CSR donor');
      setDeleteTarget(null);
    }
  };

  const getRowActions = (row) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#2196f3',
      to: `/dms/csr-donors/view/${row.id}`,
      visible: true,
    },
    {
      icon: <FiEdit />,
      label: 'Edit',
      color: '#ff9800',
      to: `/dms/csr-donors/edit/${row.id}`,
      visible: canUpdate,
    },
    {
      icon: <FiTrash2 />,
      label: 'Archive',
      color: '#f44336',
      onClick: () => setDeleteTarget(row),
      visible: canDelete,
    },
  ];

  if (!canList && !loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader title="CSR Donors" backPath="/dms" showBackButton />
          <div className="list-content">
            <div className="status-message status-message--error">
              You do not have permission to view CSR donors.
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          title="CSR Donors"
          backPath="/dms"
          showBackButton
          showAdd={!!canCreate}
          addPath="/dms/csr-donors/add"
          showFilterToggle
          filtersOpen={filtersOpen}
          onFilterToggle={toggleFilters}
          onRefresh={fetchRows}
          refreshing={loading}
        />

        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}
          {loading && <div className="loading">Loading...</div>}

          <CollapsibleFilters open={filtersOpen}>
            <div className="filters-section">
              <SearchFilter
                filterKey="search"
                label="Search"
                filters={tempFilters}
                onFilterChange={handleFilterChange}
                placeholder="Search by name, registration, city, email, phone..."
              />
              <SearchFilter
                filterKey="city"
                label="City"
                filters={tempFilters}
                onFilterChange={handleFilterChange}
                placeholder="Exact city name"
              />
              <DropdownFilter
                filterKey="is_active"
                label="Active"
                filters={tempFilters}
                onFilterChange={handleFilterChange}
                placeholder="All statuses"
                data={[
                  { value: 'true', label: 'Active' },
                  { value: 'false', label: 'Inactive' },
                ]}
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
                <SearchButton
                  onClick={handleApplyFilters}
                  text="Search"
                  loading={loading}
                />
                <ClearButton onClick={handleClearFilters} text="Clear" />
              </div>
            </div>
          </CollapsibleFilters>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Registration</th>
                  <th>City</th>
                  <th>Phone</th>
                  <th>Active</th>
                  <th className="table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="no-data">
                      No CSR donors found
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <Link
                          to={`/dms/csr-donors/view/${row.id}`}
                          className="donor-name"
                          style={{ color: 'inherit', textDecoration: 'inherit' }}
                        >
                          {row.name}
                        </Link>
                      </td>
                      <td>{row.registration_number || '—'}</td>
                      <td>{row.city || '—'}</td>
                      <td>{row.phone || '—'}</td>
                      <td>{row.is_active ? 'Yes' : 'No'}</td>
                      <td className="table-actions">
                        <ActionMenu actions={getRowActions(row)} />
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
              sortField={sortField}
              sortOrder={sortOrder}
              sortOptions={sortOptions}
            />
          )}

          {rows.length === 0 && totalItems === 0 && !loading && (
            <div className="empty-state">
              <div className="empty-state-text">No CSR donors found</div>
              <div className="empty-state-subtext">
                CSR donor companies will appear here once registered
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!deleteTarget}
        text={`Archive "${deleteTarget?.name || ''}"? POCs and donations stay linked; the CSR donor is hidden from lists.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default OrganizationsList;
