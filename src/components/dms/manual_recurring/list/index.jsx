import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import { SearchFilter, DropdownFilter, CollapsibleFilters } from '../../../common/filters';
import { SearchButton, ClearButton } from '../../../common/filters';
import useFiltersPanel from '../../../../hooks/useFiltersPanel';
import { FiRepeat, FiEye, FiPlay } from 'react-icons/fi';
import { PLEDGE_STATUS_OPTIONS, formatAmount, formatPledgeStatus, formatPledgeMode, formatPledgeItems } from '../manualRecurringConstants';

const ManualRecurringList = () => {
  const navigate = useNavigate();
  const [pledges, setPledges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [runningJob, setRunningJob] = useState(false);
  const [jobResult, setJobResult] = useState(null);
  const { filtersOpen, toggleFilters } = useFiltersPanel();

  const [tempFilters, setTempFilters] = useState({ search: '', status: '', installment_status: '' });
  const [appliedFilters, setAppliedFilters] = useState({ search: '', status: '', installment_status: '' });

  useEffect(() => {
    fetchPledges();
  }, [appliedFilters]);

  const fetchPledges = async () => {
    try {
      setLoading(true);
      const params = { ...appliedFilters };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const response = await axiosInstance.get('/manual-recurring-pledges', { params });
      if (response.data.success) {
        setPledges(response.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch pledges');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...tempFilters });
  };

  const handleClearFilters = () => {
    const empty = { search: '', status: '', installment_status: '' };
    setTempFilters(empty);
    setAppliedFilters(empty);
  };

  const handleRunReminders = async (dryRun = true) => {
    if (!dryRun && !window.confirm('Send due recurring-campaign reminders/thanks now (daily / weekly weekend / monthly as applicable)?')) {
      return;
    }
    setRunningJob(true);
    setJobResult(null);
    setError('');
    try {
      const response = await axiosInstance.post('/dms-crons/manual-recurring-reminders', null, {
        params: {
          run_due: 'true',
          dry_run: dryRun ? 'true' : 'false',
          include_details: dryRun ? 'true' : 'false'
        }
      });
      if (response.data.success) {
        setJobResult(response.data.data);
        if (!dryRun) fetchPledges();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to run reminder job');
    } finally {
      setRunningJob(false);
    }
  };

  if (loading && pledges.length === 0) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Loading campaign pledges...</p>
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
          onRefresh={fetchPledges}
          refreshing={loading}
          title="Campaign Pledges"
          subtitle="Recurring campaign enrollments (manual pledges)"
          showBackButton={false}
          showFilterToggle
          filtersOpen={filtersOpen}
          onFilterToggle={toggleFilters}
        />

        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}

          <div style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '16px',
            alignItems: 'center'
          }}>
            <button
              type="button"
              className="secondary_btn"
              onClick={() => navigate('/dms/recurring-donors/list')}
            >
              <FiRepeat style={{ marginRight: '6px' }} />
              Recurring Donors
            </button>
            <button
              type="button"
              className="secondary_btn"
              disabled={runningJob}
              onClick={() => handleRunReminders(true)}
            >
              <FiPlay style={{ marginRight: '6px' }} />
              {runningJob ? 'Running...' : 'Preview reminders (dry run)'}
            </button>
            <button
              type="button"
              className="primary_btn"
              disabled={runningJob}
              onClick={() => handleRunReminders(false)}
            >
              <FiRepeat style={{ marginRight: '6px' }} />
              Run reminders now
            </button>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>
              2nd of month (PKT): thanks if donated to campaign/project; reminder if not
            </span>
          </div>

          {jobResult && (
            <div style={{
              padding: '14px',
              background: '#f9fafb',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              <strong>{jobResult.dry_run ? 'Dry run' : 'Run'} — {jobResult.period_label}</strong>
              <div style={{ marginTop: '8px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span>Scanned: {jobResult.scanned}</span>
                <span>Chunks: {jobResult.chunks_processed} × {jobResult.chunk_size}</span>
                <span>Would send / sent reminders: {jobResult.dry_run
                  ? jobResult.would_send_count
                  : jobResult.reminders_sent}</span>
                <span>Would send / sent thanks: {jobResult.dry_run
                  ? jobResult.would_thank_count
                  : jobResult.thanks_sent}</span>
                <span>Skipped (donated): {jobResult.skipped_donated}</span>
                <span>Skipped (Stripe auto): {jobResult.skipped_stripe_auto}</span>
                <span>Skipped (prepaid covered): {jobResult.skipped_prepaid_covered ?? 0}</span>
                <span>Failed: {jobResult.reminders_failed}</span>
              </div>
              {jobResult.details_truncated && (
                <div style={{ marginTop: '8px', fontSize: '13px', color: '#b45309' }}>
                  Detail list truncated for response size — see server logs for full counts.
                </div>
              )}
            </div>
          )}

          <CollapsibleFilters open={filtersOpen}>
            <div className="filters-section">
              <SearchFilter
                filterKey="search"
                label="Search donor"
                filters={tempFilters}
                onFilterChange={(key, value) => setTempFilters((p) => ({ ...p, [key]: value }))}
                placeholder="Name, email, phone..."
              />
              <DropdownFilter
                filterKey="status"
                label="Status"
                data={PLEDGE_STATUS_OPTIONS}
                filters={tempFilters}
                onFilterChange={(key, value) => setTempFilters((p) => ({ ...p, [key]: value }))}
                placeholder="All statuses"
              />
              <DropdownFilter
                filterKey="installment_status"
                label="Installments"
                data={[
                  { value: 'pending', label: 'Pending installments' },
                  { value: 'completed', label: 'Completed installments' },
                ]}
                filters={tempFilters}
                onFilterChange={(key, value) => setTempFilters((p) => ({ ...p, [key]: value }))}
                placeholder="All installments"
              />
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <SearchButton onClick={handleApplyFilters} text="Search" loading={loading} />
                <ClearButton onClick={handleClearFilters} text="Clear" />
              </div>
            </div>
          </CollapsibleFilters>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Donor</th>
                  <th>Status</th>
                  <th>Mode</th>
                  <th>Items</th>
                  <th>Total pledge</th>
                  <th>Reminders</th>
                  <th>Last reminder / thanks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pledges.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="no-data">No recurring campaign enrollments found</td>
                  </tr>
                ) : (
                  pledges.map((pledge) => (
                    <tr key={pledge.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{pledge.campaign?.title || '—'}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{pledge.donor?.name || '—'}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{pledge.donor?.email}</div>
                      </td>
                      <td>{formatPledgeStatus(pledge.status)}</td>
                      <td>{formatPledgeMode(pledge.pledge_mode)}</td>
                      <td style={{ fontSize: '13px' }}>{formatPledgeItems(pledge.lines)}</td>
                      <td>{formatAmount(pledge.pledged_amount, pledge.currency)}</td>
                      <td>
                        {[pledge.remind_via_email && 'Email', pledge.remind_via_whatsapp && 'WhatsApp']
                          .filter(Boolean)
                          .join(', ') || '—'}
                      </td>
                      <td>
                        {pledge.last_reminder_period_key || '—'} / {pledge.last_thanks_period_key || '—'}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="secondary_btn"
                          onClick={() => navigate(`/dms/donors/view/${pledge.donor_id}`)}
                        >
                          <FiEye style={{ marginRight: '4px' }} />
                          View donor
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManualRecurringList;
