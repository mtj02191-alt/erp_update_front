import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';
import axiosInstance from '../../../../utils/axios';
import { useAuth } from '../../../../context/AuthContext';
import { canViewModule, hasPermissionByPath } from '../../../../utils/permissions';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import Pagination from '../../../common/Pagination';
import ConfirmationModal from '../../../common/ConfirmationModal';
import { SearchFilter, SearchButton, ClearButton, CollapsibleFilters } from '../../../common/filters';
import useFiltersPanel from '../../../../hooks/useFiltersPanel';

const OrganizationsList = () => {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const { filtersOpen, toggleFilters } = useFiltersPanel();

  const canCreate =
    hasPermissionByPath(permissions, 'fund_raising.organizations.create') ||
    permissions?.super_admin ||
    permissions?.fund_raising_manager;
  const canUpdate =
    hasPermissionByPath(permissions, 'fund_raising.organizations.update') ||
    permissions?.super_admin ||
    permissions?.fund_raising_manager;
  const canDelete =
    hasPermissionByPath(permissions, 'fund_raising.organizations.delete') ||
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
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [tempFilters, setTempFilters] = useState({ search: '' });
  const [appliedFilters, setAppliedFilters] = useState({ search: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleFilterChange = (key, value) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  const fetchRows = async () => {
    if (!canList) {
      setError('You do not have permission to view organizations.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await axiosInstance.get('/organizations', {
        params: {
          search: appliedFilters.search || undefined,
          page: currentPage,
          pageSize,
        },
      });
      setRows(res.data?.data || []);
      const p = res.data?.pagination;
      if (p) {
        setTotalItems(p.total || 0);
        setTotalPages(p.totalPages || 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, appliedFilters]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axiosInstance.delete(`/organizations/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchRows();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to archive organization');
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <div className="list-content">
          <PageHeader
            title="Organizations"
            onBack={() => navigate('/dms')}
            showAdd={!!canCreate}
            addPath="/dms/organizations/add"
          />

          {error && <div className="status-message status-message--error">{error}</div>}

          <CollapsibleFilters open={filtersOpen} onToggle={toggleFilters}>
            <SearchFilter
              filterKey="search"
              label="Search"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="Search by name, registration, city..."
            />
            <SearchButton
              onClick={() => {
                setAppliedFilters(tempFilters);
                setCurrentPage(1);
              }}
            />
            <ClearButton
              onClick={() => {
                const empty = { search: '' };
                setTempFilters(empty);
                setAppliedFilters(empty);
                setCurrentPage(1);
              }}
            />
          </CollapsibleFilters>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Registration</th>
                    <th>City</th>
                    <th>Phone</th>
                    <th>Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6}>No organizations found.</td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.name}</td>
                        <td>{row.registration_number || '—'}</td>
                        <td>{row.city || '—'}</td>
                        <td>{row.phone || '—'}</td>
                        <td>{row.is_active ? 'Yes' : 'No'}</td>
                        <td>
                          <button
                            type="button"
                            className="icon-btn"
                            title="View"
                            onClick={() => navigate(`/dms/organizations/view/${row.id}`)}
                          >
                            <FiEye />
                          </button>
                          {canUpdate && (
                            <button
                              type="button"
                              className="icon-btn"
                              title="Edit"
                              onClick={() => navigate(`/dms/organizations/edit/${row.id}`)}
                            >
                              <FiEdit />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              className="icon-btn danger"
                              title="Archive"
                              onClick={() => setDeleteTarget(row)}
                            >
                              <FiTrash2 />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

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
      </div>

      <ConfirmationModal
        isOpen={!!deleteTarget}
        text={`Archive "${deleteTarget?.name || ''}"? Donors and donations stay linked; the organization is hidden from lists.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default OrganizationsList;
