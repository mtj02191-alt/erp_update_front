import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import Pagination from '../../../common/Pagination';
import {
  SearchFilter,
  DropdownFilter,
  DateRangeFilter,
  CollapsibleFilters,
  SearchButton,
  ClearButton,
} from '../../../common/filters';
import useFiltersPanel from '../../../../hooks/useFiltersPanel';
import { useAuth } from '../../../../context/AuthContext';
import { hasPermission, isSuperAdmin } from '../../../../utils/permissions';
import {
  ORGANIZATION_OPTIONS,
  COMPLAINANT_TYPE_OPTIONS,
  DEPARTMENT_OPTIONS,
  CATEGORY_OPTIONS,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  ASLAB_BRANCH_OPTIONS,
  labelFor,
} from '../shared/ceoComplaintConfig';

const EMPTY_FILTERS = {
  search: '',
  organization: '',
  branch: '',
  complainant_type: '',
  department: '',
  category: '',
  priority: '',
  status: '',
  start_date: '',
  end_date: '',
};

const CeoComplaintsList = () => {
  const navigate = useNavigate();
  const { permissions, user } = useAuth();
  const { filtersOpen, toggleFilters } = useFiltersPanel();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [tempFilters, setTempFilters] = useState({ ...EMPTY_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState({ ...EMPTY_FILTERS });
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const canList = useMemo(() => {
    if (!permissions && !user) return null;
    return (
      isSuperAdmin(permissions) ||
      hasPermission(permissions, 'ceo_office', 'ceo_complaints', 'list_view') ||
      hasPermission(permissions, 'ceo_office', 'ceo_complaints', 'view')
    );
  }, [permissions, user]);

  const canCreate = useMemo(
    () =>
      isSuperAdmin(permissions) ||
      hasPermission(permissions, 'ceo_office', 'ceo_complaints', 'create'),
    [permissions],
  );

  const canUpdate = useMemo(
    () =>
      isSuperAdmin(permissions) ||
      hasPermission(permissions, 'ceo_office', 'ceo_complaints', 'update'),
    [permissions],
  );

  const fetchRows = async () => {
    try {
      setLoading(true);
      setError('');
      const filters = { ...appliedFilters };
      Object.keys(filters).forEach((k) => {
        if (!filters[k]) delete filters[k];
      });
      const response = await axiosInstance.post('/ceo-complaints/search', {
        pagination: { page: currentPage, pageSize, sortField, sortOrder },
        filters,
      });
      if (response.data.success) {
        setRows(response.data.data || []);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        setError(response.data.message || 'Failed to fetch complaints');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canList) fetchRows();
  }, [currentPage, pageSize, sortField, sortOrder, appliedFilters, canList]);

  const handleFilterChange = (key, value) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...tempFilters });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setTempFilters({ ...EMPTY_FILTERS });
    setAppliedFilters({ ...EMPTY_FILTERS });
    setCurrentPage(1);
  };

  const handleStatusChange = async (row, nextStatus) => {
    if (!canUpdate || !nextStatus || nextStatus === row.status) return;
    const previous = row.status;
    setRows((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, status: nextStatus } : r)),
    );
    setUpdatingStatusId(row.id);
    try {
      const res = await axiosInstance.patch(
        `/ceo-complaints/${row.id}/status`,
        { status: nextStatus },
      );
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to update status');
      }
      toast.success('Status updated');
    } catch (err) {
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, status: previous } : r)),
      );
      toast.error(
        err.response?.data?.message || err.message || 'Failed to update status',
      );
    } finally {
      setUpdatingStatusId(null);
    }
  };

  if (canList === null) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader title="CEO Complaints" />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  if (!canList) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader title="CEO Complaints" />
          <div className="status-message status-message--error">
            You do not have permission to view CEO complaints.
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
          title="CEO Complaints"
          subtitle="Public portal and DMS intake"
          icon={<FiAlertCircle />}
          onRefresh={fetchRows}
          refreshing={loading}
          showFilterToggle
          filtersOpen={filtersOpen}
          onFilterToggle={toggleFilters}
          showAdd={canCreate}
          addPath="/ceo-office/ceo-complaints/add"
          addTitle="Add Complaint"
        />

        {error && <div className="error-message">{error}</div>}

        <CollapsibleFilters open={filtersOpen}>
          <div className="filters-section">
            <SearchFilter
              filterKey="search"
              label="Search"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="Number, name, phone, details..."
            />
            <DropdownFilter
              filterKey="organization"
              label="Organization"
              data={ORGANIZATION_OPTIONS}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All orgs"
            />
            <DropdownFilter
              filterKey="branch"
              label="Branch"
              data={ASLAB_BRANCH_OPTIONS}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All branches"
            />
            <DropdownFilter
              filterKey="complainant_type"
              label="Complainant type"
              data={COMPLAINANT_TYPE_OPTIONS}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All types"
            />
            <DropdownFilter
              filterKey="department"
              label="Department"
              data={DEPARTMENT_OPTIONS}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All departments"
            />
            <DropdownFilter
              filterKey="category"
              label="Complaint type"
              data={CATEGORY_OPTIONS}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All types"
            />
            <DropdownFilter
              filterKey="priority"
              label="Priority / ترجیح"
              data={PRIORITY_OPTIONS}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All priorities"
            />
            <DropdownFilter
              filterKey="status"
              label="Status"
              data={STATUS_OPTIONS}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All statuses"
            />
            <DateRangeFilter
              startKey="start_date"
              endKey="end_date"
              label="Date Range"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
            />
            <SearchButton onClick={handleApplyFilters} />
            <ClearButton onClick={handleClearFilters} />
          </div>
        </CollapsibleFilters>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Number</th>
                <th>Organization</th>
                <th>Department</th>
                <th>Complaint type</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: 24 }}>
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center' }}>
                    No complaints found
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.complaint_number}</td>
                    <td>
                      {labelFor(ORGANIZATION_OPTIONS, row.organization)}
                      {row.branch ? (
                        <div style={{ fontSize: 12, color: '#6b7280' }}>
                          {labelFor(ASLAB_BRANCH_OPTIONS, row.branch)}
                        </div>
                      ) : null}
                    </td>
                    <td>{labelFor(DEPARTMENT_OPTIONS, row.department)}</td>
                    <td>{labelFor(CATEGORY_OPTIONS, row.category)}</td>
                    <td>{labelFor(PRIORITY_OPTIONS, row.priority)}</td>
                    <td>
                      {canUpdate ? (
                        <select
                          className="form-select"
                          value={row.status || 'submitted'}
                          disabled={updatingStatusId === row.id}
                          onChange={(e) =>
                            handleStatusChange(row, e.target.value)
                          }
                          style={{ minWidth: 140 }}
                          aria-label={`Status for ${row.complaint_number}`}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        labelFor(STATUS_OPTIONS, row.status)
                      )}
                    </td>
                    <td>
                      {row.created_at
                        ? new Date(row.created_at).toLocaleDateString()
                        : '-'}
                    </td>
                    <td>
                      <ActionMenu
                        actions={[
                          {
                            icon: <FiEye />,
                            label: 'View',
                            color: '#2196f3',
                            onClick: () =>
                              navigate(
                                `/ceo-office/ceo-complaints/view/${row.id}`,
                              ),
                            visible: true,
                          },
                        ]}
                      />
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
          onSortChange={(field, order) => {
            setSortField(field);
            setSortOrder(order);
            setCurrentPage(1);
          }}
          sortField={sortField}
          sortOrder={sortOrder}
          sortOptions={[
            { value: 'created_at', label: 'Created Date' },
            { value: 'complaint_number', label: 'Number' },
            { value: 'status', label: 'Status' },
            { value: 'organization', label: 'Organization' },
          ]}
        />
      </div>
    </>
  );
};

export default CeoComplaintsList;
