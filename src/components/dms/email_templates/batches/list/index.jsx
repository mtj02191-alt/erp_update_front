import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import Pagination from '../../../../common/Pagination';
import MultiSelect from '../../../../common/MultiSelect';
import { SearchButton, ClearButton, RefreshButton } from '../../../../common/filters';
import { TEMPLATE_CHANNELS } from '../../templateConstants';
import { formatFiltersSummary } from '../../communicationAudience';

const BATCH_STATUSES = [
  { value: 'completed', label: 'Completed' },
  { value: 'partial', label: 'Partial' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'failed', label: 'Failed' },
];

const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
};

const CommunicationBatchList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sendSource =
    searchParams.get('source') === 'communication'
      ? 'communication'
      : 'donor_bulk';
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [tempFilters, setTempFilters] = useState({
    channels: [],
    batch_statuses: [],
  });
  const [appliedFilters, setAppliedFilters] = useState({
    channels: [],
    batch_statuses: [],
  });

  useEffect(() => {
    fetchBatches();
  }, [currentPage, pageSize, appliedFilters, sendSource]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axiosInstance.get('/email-templates/communication-batches', {
        params: {
          page: currentPage,
          pageSize,
          channel: appliedFilters.channels[0] || undefined,
          batch_status: appliedFilters.batch_statuses[0] || undefined,
          send_source: sendSource,
        },
      });
      if (res.data.success) {
        setBatches(res.data.data || []);
        setTotalItems(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load send history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          title={
            sendSource === 'donor_bulk'
              ? 'Donor Bulk Send History'
              : 'Communication Send History'
          }
          onBackClick={() =>
            navigate(
              sendSource === 'donor_bulk'
                ? '/dms/donors/list'
                : '/dms/email_templates/list',
            )
          }
        />

        {sendSource === 'donor_bulk' && (
          <p style={{ margin: '0 0 12px', color: '#6b7280', fontSize: 13 }}>
            Opens, clicks, and spam stats apply only to emails sent from the donors
            list bulk action — not other system emails.
          </p>
        )}

        <div className="list-content">
        <div className="filters-container card" style={{ marginBottom: 16 }}>
          <div className="filters-grid">
            <MultiSelect
              label="Channel"
              options={TEMPLATE_CHANNELS}
              value={tempFilters.channels}
              onChange={(value) =>
                setTempFilters((prev) => ({ ...prev, channels: value }))
              }
              placeholder="All channels"
            />
            <MultiSelect
              label="Status"
              options={BATCH_STATUSES}
              value={tempFilters.batch_statuses}
              onChange={(value) =>
                setTempFilters((prev) => ({ ...prev, batch_statuses: value }))
              }
              placeholder="All statuses"
            />
          </div>
          <div className="filters-actions">
            <RefreshButton onClick={fetchBatches} loading={loading} />
            <SearchButton
              onClick={() => {
                setAppliedFilters(tempFilters);
                setCurrentPage(1);
              }}
              loading={loading}
            />
            <ClearButton
              onClick={() => {
                const empty = { channels: [], batch_statuses: [] };
                setTempFilters(empty);
                setAppliedFilters(empty);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="table-container card">
          {loading && batches.length === 0 ? (
            <div className="loading">Loading...</div>
          ) : (
            <>
              {loading && <div className="loading">Loading...</div>}
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Template</th>
                    <th>Channel</th>
                    <th>Criteria</th>
                    <th>Matched</th>
                    <th>Sent</th>
                    {sendSource === 'donor_bulk' && (
                      <>
                        <th>Opened</th>
                        <th>Not opened</th>
                        <th>Clicked</th>
                        <th>Spam</th>
                      </>
                    )}
                    <th>Failed</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.length ? (
                    batches.map((batch) => {
                      const a = batch.analytics || {};
                      return (
                      <tr key={batch.id}>
                        <td>{formatDateTime(batch.sent_at || batch.created_at)}</td>
                        <td>{batch.template_name || batch.template?.name || '—'}</td>
                        <td>{batch.channel?.toUpperCase() || '—'}</td>
                        <td style={{ maxWidth: 280 }}>
                          {batch.selection_mode === 'filters'
                            ? formatFiltersSummary(batch.filters)
                            : `Manual (${batch.donor_ids?.length || batch.matched_count || 0} donors)`}
                        </td>
                        <td>{batch.matched_count ?? 0}</td>
                        <td>{a.sent ?? batch.sent_count ?? 0}</td>
                        {sendSource === 'donor_bulk' && (
                          <>
                            <td>{a.opened ?? 0}</td>
                            <td>{a.not_opened ?? 0}</td>
                            <td>{a.clicked ?? 0}</td>
                            <td>{a.spam ?? 0}</td>
                          </>
                        )}
                        <td>{a.failed ?? batch.failed_count ?? 0}</td>
                        <td>
                          <span className={`status-badge status-${batch.batch_status}`}>
                            {batch.batch_status}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="secondary-btn"
                            onClick={() =>
                              navigate(
                                `/dms/email_templates/batches/${batch.id}?source=${sendSource}`,
                              )
                            }
                          >
                            View
                          </button>
                        </td>
                      </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={sendSource === 'donor_bulk' ? 13 : 9} className="text-center">
                        No send history found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
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
      </div>
    </>
  );
};

export default CommunicationBatchList;
