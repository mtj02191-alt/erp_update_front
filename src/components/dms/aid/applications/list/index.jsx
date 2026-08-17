import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye } from 'react-icons/fi';
import axiosInstance from '../../../../../utils/axios';
import { useAuth } from '../../../../../context/AuthContext';
import { canViewModule, hasPermissionByPath } from '../../../../../utils/permissions';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import Pagination from '../../../../common/Pagination';
import {
  SearchFilter,
  DropdownFilter,
  SearchButton,
  ClearButton,
  CollapsibleFilters,
} from '../../../../common/filters';
import useFiltersPanel from '../../../../../hooks/useFiltersPanel';
import { AID_STATUS_OPTIONS, aidStatusTone, formatAidStatus } from '../../aidConstants';
import '../../aid.css';

const AidApplicationsList = () => {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const { filtersOpen, toggleFilters } = useFiltersPanel();

  const canList =
    canViewModule(permissions, 'fund_raising', 'aid_applications') ||
    permissions?.super_admin ||
    permissions?.fund_raising_manager;
  const canCreate =
    hasPermissionByPath(permissions, 'fund_raising.aid_applications.create') ||
    permissions?.super_admin ||
    permissions?.fund_raising_manager;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [tempFilters, setTempFilters] = useState({ search: '', status: '' });
  const [appliedFilters, setAppliedFilters] = useState({ search: '', status: '' });

  const fetchRows = async () => {
    if (!canList) {
      setError('You do not have permission to view aid applications.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await axiosInstance.get('/aid/applications', {
        params: {
          search: appliedFilters.search || undefined,
          status: appliedFilters.status || undefined,
          page: currentPage,
          pageSize,
        },
      });
      setRows(res.data?.data || []);
      setTotalItems(res.data?.total || 0);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, appliedFilters]);

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          title="Aid Applications"
          backPath="/dms"
          showAdd={!!canCreate}
          addPath="/dms/aid/applications/add"
          addTitle="New application"
          showFilterToggle
          filtersOpen={filtersOpen}
          onFilterToggle={toggleFilters}
        />
        <div className="list-content">
          {error && <div className="error-message">{error}</div>}

          <CollapsibleFilters open={filtersOpen}>
            <div className="filters-row">
              <SearchFilter
                filterKey="search"
                label="Search"
                filters={tempFilters}
                onFilterChange={(k, v) => setTempFilters((p) => ({ ...p, [k]: v }))}
                placeholder="App no, name, CNIC…"
              />
              <DropdownFilter
                filterKey="status"
                label="Status"
                data={AID_STATUS_OPTIONS}
                filters={tempFilters}
                onFilterChange={(k, v) => setTempFilters((p) => ({ ...p, [k]: v }))}
                placeholder="All"
              />
              <SearchButton
                onClick={() => {
                  setCurrentPage(1);
                  setAppliedFilters({ ...tempFilters });
                }}
              />
              <ClearButton
                onClick={() => {
                  setTempFilters({ search: '', status: '' });
                  setAppliedFilters({ search: '', status: '' });
                  setCurrentPage(1);
                }}
              />
            </div>
          </CollapsibleFilters>

          <div style={{ marginBottom: 12 }}>
            <Link to="/dms/aid/people/list" className="secondary-btn">
              People / family registry
            </Link>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Application</th>
                  <th>Beneficiary</th>
                  <th>Aid type</th>
                  <th>Status</th>
                  <th>Assigned</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6}>Loading…</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No applications found.</td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <strong>{row.application_no}</strong>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{row.title || '—'}</div>
                      </td>
                      <td>{row.beneficiary?.full_name || '—'}</td>
                      <td style={{ textTransform: 'capitalize' }}>
                        {row.requested_aid_type || '—'}
                      </td>
                      <td>
                        <span className={`aid-status-pill aid-status-pill--${aidStatusTone(row.status)}`}>
                          {formatAidStatus(row.status)}
                        </span>
                      </td>
                      <td>
                        {row.assigned_to
                          ? [row.assigned_to.first_name, row.assigned_to.last_name]
                              .filter(Boolean)
                              .join(' ') || row.assigned_to.email
                          : '—'}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => navigate(`/dms/aid/applications/view/${row.id}`)}
                        >
                          <FiEye /> View
                        </button>
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
              onPageSizeChange={(n) => {
                setPageSize(n);
                setCurrentPage(1);
              }}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default AidApplicationsList;
