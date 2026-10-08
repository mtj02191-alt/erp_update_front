import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiMail } from 'react-icons/fi';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import Pagination from '../../../common/Pagination';
import {
  SearchFilter,
  DropdownFilter,
  DateFilter,
  DateRangeFilter,
  CollapsibleFilters,
  SearchButton,
  ClearButton,
} from '../../../common/filters';
import useFiltersPanel from '../../../../hooks/useFiltersPanel';
import { useAuth } from '../../../../context/AuthContext';
import { hasPermission, isSuperAdmin } from '../../../../utils/permissions';

const MAIL_OPTIONS = [
  { value: 'sent', label: 'Mail Sent' },
  { value: 'not_sent', label: 'Mail Not Sent' },
  { value: 'n_a', label: 'Mail N/A' },
];

const WA_OPTIONS = [
  { value: 'sent', label: 'WA Sent' },
  { value: 'not_sent', label: 'WA Not Sent' },
  { value: 'n_a', label: 'WA N/A' },
];

const SOURCE_OPTIONS = [
  { value: 'campaign_pledge', label: 'Campaign pledge' },
  { value: 'ledger_subscription', label: 'Recurring donation' },
];

const ACTION_OPTIONS = [
  { value: 'reminder', label: 'Reminder' },
  { value: 'thanks', label: 'Thanks' },
];

const EMPTY_FILTERS = {
  search: '',
  mail_status: '',
  wa_status: '',
  source: '',
  action_type: '',
  date: '',
  start_date: '',
  end_date: '',
};

const statusLabel = (value) => {
  if (value === 'sent') return 'Sent';
  if (value === 'not_sent') return 'Not Sent';
  if (value === 'n_a') return 'N/A';
  return value || '—';
};

const statusClass = (value) => {
  if (value === 'sent') return 'sent';
  if (value === 'not_sent') return 'not-sent';
  return 'na';
};

const RecurringReminderLogsList = () => {
  const navigate = useNavigate();
  const { permissions, user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { filtersOpen, toggleFilters } = useFiltersPanel();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [tempFilters, setTempFilters] = useState({ ...EMPTY_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState({ ...EMPTY_FILTERS });

  const isFrAdmin = useMemo(() => {
    const role = String(user?.role || '').toLowerCase();
    return (
      isSuperAdmin(permissions) ||
      role === 'super_admin' ||
      permissions?.fund_raising_manager === true ||
      role === 'fund_raising_manager'
    );
  }, [permissions, user]);

  const canList = useMemo(() => {
    if (!permissions && !user) return null;
    return (
      isFrAdmin ||
      hasPermission(permissions, 'fund_raising', 'recurring_reminder_logs', 'list_view') ||
      hasPermission(permissions, 'fund_raising', 'recurring_reminder_logs', 'view') ||
      hasPermission(permissions, 'fund_raising', 'recurring_donations', 'list_view') ||
      hasPermission(permissions, 'fund_raising', 'recurring_donations', 'view')
    );
  }, [permissions, user, isFrAdmin]);

  const fetchRows = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.post('/recurring-reminder-logs/search', {
        pagination: {
          page: currentPage,
          pageSize,
          sortField: 'created_at',
          sortOrder: 'DESC',
        },
        filters: appliedFilters,
      });
      if (response.data?.success) {
        setRows(response.data.data || []);
        setTotalItems(response.data.pagination?.totalItems || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        setError(response.data?.message || 'Failed to load reminder logs');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reminder logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canList) fetchRows();
  }, [canList, currentPage, pageSize, appliedFilters]);

  const handleApplyFilters = () => {
    setCurrentPage(1);
    setAppliedFilters({ ...tempFilters });
  };

  const handleClearFilters = () => {
    const empty = { ...EMPTY_FILTERS };
    setTempFilters(empty);
    setAppliedFilters(empty);
    setCurrentPage(1);
  };

  const getActionMenuItems = (row) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#45cc49',
      onClick: () => navigate(`/dms/recurring-reminder-logs/view/${row.id}`),
      visible: true,
    },
  ];

  if (canList === null || (loading && rows.length === 0 && !error)) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Loading reminder logs...</p>
          </div>
        </div>
      </>
    );
  }

  if (canList === false) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader title="Reminder Logs" showBackButton={false} />
          <div className="error-message">You do not have permission to view reminder logs.</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          title="Reminder Logs"
          showBackButton={false}
          icon={<FiMail />}
          onFilterClick={toggleFilters}
          filterActive={filtersOpen}
        />

        <div className="list-content">
          {error && <div className="error-message">{error}</div>}

          <CollapsibleFilters open={filtersOpen}>
            <div className="filters-section">
              <SearchFilter
                filterKey="search"
                label="Search"
                filters={tempFilters}
                onFilterChange={(key, value) =>
                  setTempFilters((p) => ({ ...p, [key]: value }))
                }
                placeholder="Donor name, email, phone..."
              />
              <DropdownFilter
                filterKey="mail_status"
                label="Mail"
                data={MAIL_OPTIONS}
                filters={tempFilters}
                onFilterChange={(key, value) =>
                  setTempFilters((p) => ({ ...p, [key]: value }))
                }
                placeholder="All"
              />
              <DropdownFilter
                filterKey="wa_status"
                label="WhatsApp"
                data={WA_OPTIONS}
                filters={tempFilters}
                onFilterChange={(key, value) =>
                  setTempFilters((p) => ({ ...p, [key]: value }))
                }
                placeholder="All"
              />
              <DropdownFilter
                filterKey="source"
                label="Source"
                data={SOURCE_OPTIONS}
                filters={tempFilters}
                onFilterChange={(key, value) =>
                  setTempFilters((p) => ({ ...p, [key]: value }))
                }
                placeholder="All"
              />
              <DropdownFilter
                filterKey="action_type"
                label="Action"
                data={ACTION_OPTIONS}
                filters={tempFilters}
                onFilterChange={(key, value) =>
                  setTempFilters((p) => ({ ...p, [key]: value }))
                }
                placeholder="All"
              />
              <DateFilter
                filterKey="date"
                label="Date"
                filters={tempFilters}
                onFilterChange={(key, value) =>
                  setTempFilters((p) => ({ ...p, [key]: value }))
                }
              />
              <DateRangeFilter
                startKey="start_date"
                endKey="end_date"
                label="Date range"
                filters={tempFilters}
                onFilterChange={(key, value) =>
                  setTempFilters((p) => ({ ...p, [key]: value }))
                }
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <SearchButton onClick={handleApplyFilters} text="Search" loading={loading} />
                <ClearButton onClick={handleClearFilters} text="Clear" />
              </div>
            </div>
          </CollapsibleFilters>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Donor Name</th>
                  <th>Email</th>
                  <th>Mail</th>
                  <th>WA Msg</th>
                  <th>Action</th>
                  <th>Source</th>
                  <th>Period</th>
                  <th>Sent At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() =>
                        navigate(`/dms/recurring-reminder-logs/view/${row.id}`)
                      }
                    >
                      <td>{row.donor_name || '—'}</td>
                      <td>{row.donor_email || '—'}</td>
                      <td>
                        <span className={`rrl-status rrl-status--${statusClass(row.mail_status)}`}>
                          {statusLabel(row.mail_status)}
                        </span>
                      </td>
                      <td>
                        <span className={`rrl-status rrl-status--${statusClass(row.wa_status)}`}>
                          {statusLabel(row.wa_status)}
                        </span>
                      </td>
                      <td>{row.action_type || '—'}</td>
                      <td>
                        {row.source === 'ledger_subscription'
                          ? 'Recurring donation'
                          : 'Campaign pledge'}
                      </td>
                      <td>{row.period_key || '—'}</td>
                      <td>
                        {row.created_at
                          ? new Date(row.created_at).toLocaleString()
                          : '—'}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <ActionMenu items={getActionMenuItems(row)} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center' }}>
                      {loading ? 'Loading...' : 'No reminder logs found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            totalItems={totalItems}
          />
        </div>
      </div>

      <style>{`
        .rrl-status {
          display: inline-flex;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
        }
        .rrl-status--sent { background: #dcfce7; color: #166534; }
        .rrl-status--not-sent { background: #fee2e2; color: #991b1b; }
        .rrl-status--na { background: #e2e8f0; color: #475569; }
      `}</style>
    </>
  );
};

export default RecurringReminderLogsList;
