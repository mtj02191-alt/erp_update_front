import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import Pagination from '../../../common/Pagination';
import { DropdownFilter, DateRangeFilter, CollapsibleFilters } from '../../../common/filters';
import { SearchButton, ClearButton } from '../../../common/filters';
import useFiltersPanel from '../../../../hooks/useFiltersPanel';
import { useAuth } from '../../../../context/AuthContext';
import { hasPermission } from '../../../../utils/permissions';
import { FiEye } from 'react-icons/fi';
import '../reconciliation.css';

const BANK_OPTIONS = [
  { value: '', label: 'All banks' },
  { value: 'faysal', label: 'Faysal Bank' },
  { value: 'meezan', label: 'Meezan Bank' },
];

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
};

const ReconciliationList = () => {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const canUpload = useMemo(
    () =>
      permissions?.super_admin === true ||
      permissions?.fund_raising_manager === true ||
      hasPermission(permissions, 'fund_raising', 'reconciliation', 'create'),
    [permissions],
  );

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { filtersOpen, toggleFilters } = useFiltersPanel();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [tempFilters, setTempFilters] = useState({
    bank: '',
    fromDate: '',
    toDate: '',
  });
  const [appliedFilters, setAppliedFilters] = useState({
    bank: '',
    fromDate: '',
    toDate: '',
  });

  useEffect(() => {
    fetchRecords();
  }, [currentPage, pageSize, appliedFilters]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page: currentPage,
        pageSize,
        bank: appliedFilters.bank || undefined,
        fromDate: appliedFilters.fromDate || undefined,
        toDate: appliedFilters.toDate || undefined,
      };
      Object.keys(params).forEach((k) => {
        if (params[k] === '' || params[k] == null) delete params[k];
      });

      const response = await axiosInstance.get('/reconciliation', { params });
      if (response.data.success) {
        setRecords(response.data.data || []);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        setError(response.data.message || 'Failed to load reconciliation records');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reconciliation records');
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
    const empty = { bank: '', fromDate: '', toDate: '' };
    setTempFilters(empty);
    setAppliedFilters(empty);
    setCurrentPage(1);
  };

  const getActionMenuItems = (record) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#4CAF50',
      onClick: () => navigate(`/dms/reconciliation/view/${record.id}`),
      visible: true,
    },
  ];

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          onRefresh={fetchRecords}
          refreshing={loading}
          title="Bank Reconciliation"
          showBackButton={false}
          showFilterToggle
          filtersOpen={filtersOpen}
          onFilterToggle={toggleFilters}
          showAdd={canUpload}
          addPath="/dms/reconciliation/add"
          addTitle="Upload bank statement"
        />

        <CollapsibleFilters open={filtersOpen}>
        <div className="filters-section reconciliation-filters">
          <div className="filters-row">
            <DropdownFilter
              filterKey="bank"
              label="Bank"
              data={BANK_OPTIONS.filter((o) => o.value !== '')}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All banks"
            />
            <DateRangeFilter
              label="Run date"
              startKey="fromDate"
              endKey="toDate"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
            />
            <SearchButton onClick={handleApplyFilters} />
            <ClearButton onClick={handleClearFilters} />
          </div>
        </div>
        </CollapsibleFilters>

        {error && <div className="error-message">{error}</div>}

        <div className="table-container reconciliation-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Bank</th>
                <th>File</th>
                <th>Statement period</th>
                <th>Run date</th>
                <th>By</th>
                <th>Donations created</th>
                <th>Skipped</th>
                <th>Failed</th>
                <th className="table-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center' }}>
                    Loading…
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center' }}>
                    No reconciliation runs yet
                  </td>
                </tr>
              ) : (
                records.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td style={{ textTransform: 'capitalize' }}>{row.bank_name}</td>
                    <td>
                      {row.file_url ? (
                        <a
                          href={row.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="reconciliation-file-link"
                        >
                          {row.original_filename || 'View file'}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {formatDate(row.statement_from)} — {formatDate(row.statement_to)}
                    </td>
                    <td>{formatDate(row.created_at)}</td>
                    <td>
                      {row.created_by?.name ||
                        row.created_by?.email ||
                        row.created_by?.id ||
                        '—'}
                    </td>
                    <td>{row.created_count ?? 0}</td>
                    <td>{row.skipped_count ?? 0}</td>
                    <td>{row.failed_count ?? 0}</td>
                    <td className="table-actions">
                      <ActionMenu actions={getActionMenuItems(row)} />
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
    </>
  );
};

export default ReconciliationList;
