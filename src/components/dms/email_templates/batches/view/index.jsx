import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import { formatFiltersSummary } from '../../communicationAudience';

const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
};

const statusLabel = (status) => {
  const s = String(status || '').toLowerCase();
  if (!s) return '—';
  return s.replace(/_/g, ' ');
};

const CommunicationBatchView = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sendSource =
    searchParams.get('source') === 'communication'
      ? 'communication'
      : 'donor_bulk';
  const listPath = `/dms/email_templates/batches?source=${sendSource}`;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [batch, setBatch] = useState(null);
  const [logs, setLogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchBatch();
  }, [batchId]);

  const fetchBatch = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(
        `/email-templates/communication-batches/${batchId}`,
      );
      if (res.data.success) {
        setBatch(res.data.data.batch);
        setLogs(res.data.data.logs || []);
        setAnalytics(res.data.data.analytics || null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load batch details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="form-content"><div className="loading">Loading...</div></div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader
          title={
            sendSource === 'donor_bulk'
              ? 'Donor Bulk Send Details'
              : 'Send Batch Details'
          }
          onBack={() => navigate(listPath)}
        />

        {error && <div className="error-message">{error}</div>}

        {batch && (
          <div className="form-card card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>Summary</h3>
            <p><strong>Template:</strong> {batch.template_name || batch.template?.name}</p>
            <p><strong>Channel:</strong> {batch.channel?.toUpperCase()}</p>
            <p><strong>Selection mode:</strong> {batch.selection_mode}</p>
            <p><strong>Criteria:</strong>{' '}
              {batch.selection_mode === 'filters'
                ? formatFiltersSummary(batch.filters)
                : `Manual selection (${batch.donor_ids?.length || 0} donor IDs saved)`}
            </p>
            {batch.selection_mode === 'filters' && batch.filters && (
              <pre
                style={{
                  background: '#f8f9fa',
                  padding: 12,
                  borderRadius: 8,
                  overflow: 'auto',
                  fontSize: 12,
                }}
              >
                {JSON.stringify(batch.filters, null, 2)}
              </pre>
            )}
            <p><strong>Matched:</strong> {batch.matched_count}</p>
            <p><strong>Sent:</strong> {batch.sent_count}</p>
            <p><strong>Scheduled:</strong> {batch.scheduled_count}</p>
            <p><strong>Failed:</strong> {batch.failed_count}</p>
            <p><strong>Status:</strong> {batch.batch_status}</p>
            <p><strong>Sent at:</strong> {formatDateTime(batch.sent_at || batch.created_at)}</p>
            <p><strong>Sent by:</strong> {batch.sent_by?.email || batch.sent_by?.name || '—'}</p>
          </div>
        )}

        {analytics && batch?.channel === 'email' && sendSource === 'donor_bulk' && (
          <div className="form-card card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>Email analytics</h3>
            <p style={{ color: '#6b7280', fontSize: 13, marginTop: 0 }}>
              Opens/clicks come from Resend webhooks. Open rates are approximate
              (some email clients block tracking).
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: 12,
              }}
            >
              {[
                { label: 'Sent', value: analytics.sent },
                { label: 'Delivered', value: analytics.delivered },
                { label: 'Opened', value: analytics.opened },
                { label: 'Not opened', value: analytics.not_opened },
                { label: 'Clicked', value: analytics.clicked },
                { label: 'Spam', value: analytics.spam },
                { label: 'Failed', value: analytics.failed },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{item.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{item.value ?? 0}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="table-container card">
          <h3>Donor delivery log</h3>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Donor</th>
                <th>Recipient</th>
                <th>Status</th>
                <th>Sent at</th>
                {sendSource === 'donor_bulk' && (
                  <>
                    <th>Opened at</th>
                    <th>Clicked at</th>
                  </>
                )}
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {logs.length ? (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.donor?.name || log.donor_id || '—'}</td>
                    <td>{log.recipient || '—'}</td>
                    <td>{statusLabel(log.delivery_status)}</td>
                    <td>{formatDateTime(log.sent_at || log.scheduled_at)}</td>
                    {sendSource === 'donor_bulk' && (
                      <>
                        <td>{formatDateTime(log.opened_at)}</td>
                        <td>{formatDateTime(log.clicked_at)}</td>
                      </>
                    )}
                    <td>{log.error_message || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={sendSource === 'donor_bulk' ? 7 : 5} className="text-center">No delivery logs</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default CommunicationBatchView;
