import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiMoreHorizontal, FiCopy, FiLayout, FiList, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import Loader from '../../../common/loader/Loader';
import Pagination from '../../../common/Pagination';
import ActionMenu from '../../../common/ActionMenu';
import SearchFilter from '../../../common/filters/SearchFilter';
import DropdownFilter from '../../../common/filters/DropdownFilter';
import { SecondaryButton } from '../../../common/buttons';
import { useAuth } from '../../../../context/AuthContext';
import { getComplaintCasePermissions } from '../../../../utils/permissions';
import useComplaintCaseQuery from '../shared/useComplaintCaseQuery';
import {
  COMPLAINT_CATEGORIES,
  DEPARTMENT_OPTIONS,
  COMPLAINT_WORKFLOW_STATUSES,
  ACTIVE_WORKFLOW_STATUSES,
  getCategoryLabel,
  getStatusLabel,
  getDepartmentLabel,
} from '../shared/complaintCaseConfig';
import '../shared/complaintCase.css';
import './index.css';

export default function ComplaintsCaseList({ viewMode, onViewModeChange }) {
  const navigate = useNavigate();
  const { user, permissions } = useAuth();
  const casePerms = useMemo(
    () => getComplaintCasePermissions(permissions, user?.department, user?.role),
    [permissions, user?.department, user?.role],
  );

  const {
    data,
    loading,
    filters,
    setFilter,
    clearFilters,
    page,
    setPage,
    pagination,
    statusCounts,
    refresh,
  } = useComplaintCaseQuery();

  const totals = useMemo(() => {
    const active = ACTIVE_WORKFLOW_STATUSES.reduce(
      (sum, status) => sum + (statusCounts[status] || 0),
      0,
    );
    const legacyActive =
      (statusCounts.submitted || 0) + (statusCounts.under_investigation || 0);
    const resolved = statusCounts.resolved || 0;
    const closedRejected =
      (statusCounts.closed_rejected || 0) +
      (statusCounts.dismissed || 0) +
      (statusCounts.closed || 0);
    const total = active + legacyActive + resolved + closedRejected;
    return {
      active: active + legacyActive,
      resolved,
      closedRejected,
      total,
    };
  }, [statusCounts]);

  const getActionMenuItems = (row) => {
    const canView = casePerms.canView || casePerms.canList;
    return [
      {
        icon: <FiEye />,
        label: 'View',
        color: '#45cc49',
        onClick: canView ? () => navigate(`/complaints/view/${row.id}`) : undefined,
        visible: true,
        disabled: !canView,
        title: canView ? 'View complaint' : 'No permission to view',
      },
      {
        icon: <FiCopy />,
        label: 'Copy code',
        color: '#2563eb',
        onClick: row.complaint_code
          ? async () => {
              try {
                await navigator.clipboard.writeText(row.complaint_code);
                toast.success(`Copied ${row.complaint_code}`);
              } catch {
                toast.info(row.complaint_code);
              }
            }
          : undefined,
        visible: Boolean(row.complaint_code),
        disabled: !row.complaint_code,
        title: 'Copy reference code',
      },
    ];
  };

  return (
    <>
      <Navbar />
      <div className="list-wrapper cc-shell">
        <PageHeader
          title="Complaints"
          showBackButton={false}
          showAdd={casePerms.canCreate}
          addPath="/complaints/add"
          addLabel="Submit Complaint"
        />
        <div className="list-content">
          <div className="cc-stats">
            <div className="cc-stat cc-stat--total">
              <div className="cc-stat__label">Total</div>
              <div className="cc-stat__value">{totals.total}</div>
            </div>
            <div className="cc-stat cc-stat--active">
              <div className="cc-stat__label">Active</div>
              <div className="cc-stat__value">{totals.active}</div>
            </div>
            <div className="cc-stat cc-stat--resolved">
              <div className="cc-stat__label">Resolved</div>
              <div className="cc-stat__value">{totals.resolved}</div>
            </div>
            <div className="cc-stat cc-stat--closed">
              <div className="cc-stat__label">Closed / Rejected</div>
              <div className="cc-stat__value">{totals.closedRejected}</div>
            </div>
          </div>

          <div className="cc-toolbar">
            <div className="cc-toolbar__filters">
              <SearchFilter
                filterKey="search"
                filters={filters}
                onFilterChange={setFilter}
                placeholder="Search title or CMP code"
              />
              <DropdownFilter
                filterKey="complaint_workflow_status"
                label="Status"
                filters={filters}
                onFilterChange={setFilter}
                data={[{ value: '', label: 'All statuses' }, ...COMPLAINT_WORKFLOW_STATUSES.map((s) => ({ value: s.value, label: s.label }))]}
              />
              <DropdownFilter
                filterKey="complaint_category"
                label="Type"
                filters={filters}
                onFilterChange={setFilter}
                data={[{ value: '', label: 'All types' }, ...COMPLAINT_CATEGORIES]}
              />
              <DropdownFilter
                filterKey="department"
                label="Nominee Dept"
                filters={filters}
                onFilterChange={setFilter}
                data={[{ value: '', label: 'All departments' }, ...DEPARTMENT_OPTIONS]}
              />
              <SecondaryButton onClick={clearFilters}>Clear</SecondaryButton>
              <SecondaryButton onClick={refresh}>Refresh</SecondaryButton>
            </div>
            <div className="cc-toolbar__views">
              <div className="cc-view-toggle" role="tablist" aria-label="View mode">
                <button
                  type="button"
                  className={viewMode === 'board' ? 'is-active' : ''}
                  onClick={() => onViewModeChange('board')}
                >
                  <FiLayout style={{ marginRight: 4, verticalAlign: -2 }} />
                  Board
                </button>
                <button
                  type="button"
                  className={viewMode === 'list' ? 'is-active' : ''}
                  onClick={() => onViewModeChange('list')}
                >
                  <FiList style={{ marginRight: 4, verticalAlign: -2 }} />
                  List
                </button>
              </div>
              <SecondaryButton onClick={() => navigate('/complaints/track')}>
                <FiSearch style={{ marginRight: 4 }} />
                Track
              </SecondaryButton>
            </div>
          </div>

          {loading ? (
            <Loader />
          ) : (
            <div className="complaint-case-table-wrap cc-surface">
              <table className="complaint-case-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Subject</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Nominated Dept(s)</th>
                    <th>Created</th>
                    <th className="complaint-case-table__actions-col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="complaint-case-table__empty">
                        <div className="cc-empty">
                          <strong>No complaints found</strong>
                          <span>Try adjusting filters or submit a new complaint.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    data.map((row) => (
                      <tr
                        key={row.id}
                        className="complaint-case-table__row"
                        onClick={() => navigate(`/complaints/view/${row.id}`)}
                      >
                        <td>
                          <span className="cc-code">{row.complaint_code}</span>
                        </td>
                        <td>
                          <div className="cc-subject">{row.title}</div>
                        </td>
                        <td>
                          <span className="cc-category">
                            {getCategoryLabel(row.complaint_category, row.complaint_category_custom)}
                          </span>
                        </td>
                        <td>
                          <span className={`cc-status cc-status--${row.complaint_workflow_status}`}>
                            {getStatusLabel(row.complaint_workflow_status)}
                          </span>
                        </td>
                        <td>
                          {(row.nominated_departments || []).length
                            ? row.nominated_departments.map((dept) => (
                                <span key={dept} className="cc-pill">
                                  {getDepartmentLabel(dept)}
                                </span>
                              ))
                            : '—'}
                        </td>
                        <td className="cc-date">
                          {row.created_at
                            ? new Date(row.created_at).toLocaleDateString(undefined, {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td
                          className="complaint-case-table__actions-col"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ActionMenu
                            actions={getActionMenuItems(row)}
                            trigger={<FiMoreHorizontal className="cc-more-icon" />}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <Pagination
            currentPage={page}
            totalPages={pagination.totalPages || 1}
            onPageChange={setPage}
          />
        </div>
      </div>
    </>
  );
}
