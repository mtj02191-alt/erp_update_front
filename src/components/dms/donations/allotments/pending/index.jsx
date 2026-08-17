import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import './index.css';

const formatUser = (user) => {
  if (!user) return '—';
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  return name || user.email || `User #${user.id}`;
};

const formatAmount = (donation) => {
  if (!donation) return '—';
  const amount = donation.paid_amount ?? donation.amount;
  if (amount == null) return '—';
  return `${amount} ${donation.currency || 'PKR'}`;
};

const PendingAllotmentsList = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reviewingId, setReviewingId] = useState(null);
  const [decisionNotes, setDecisionNotes] = useState({});

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get('/donations/allotments/pending-approval');
      if (res.data?.success) {
        setRows(res.data.data || []);
      } else {
        setRows([]);
        setError(res.data?.message || 'Failed to load pending approvals');
      }
    } catch (e) {
      setRows([]);
      setError(e.response?.data?.message || 'Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const review = async (allotmentId, action) => {
    setReviewingId(allotmentId);
    setError('');
    setSuccess('');
    try {
      const res = await axiosInstance.patch(
        `/donations/allotments/${allotmentId}/${action}`,
        { decision_note: decisionNotes[allotmentId]?.trim() || undefined },
      );
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Action failed');
      }
      setSuccess(`Allotment ${action} successfully`);
      setDecisionNotes((prev) => {
        const next = { ...prev };
        delete next[allotmentId];
        return next;
      });
      await fetchRows();
    } catch (e) {
      setError(e.response?.data?.message || e.message || `Failed to ${action} allotment`);
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <PageHeader
          title="Allotment Approvals"
          subtitle="Review and approve performance credit requests from your team"
          backPath="/donations/online_donations/list"
        />

        {error && <div className="status-message status-message--error">{error}</div>}
        {success && <div className="status-message status-message--success">{success}</div>}

        {loading ? (
          <p>Loading pending requests…</p>
        ) : rows.length === 0 ? (
          <div className="allotment-inbox-empty">
            <p>No pending allotment requests right now.</p>
            <p className="allotment-inbox-empty__hint">
              You will receive a notification when a fundraiser requests credit on a completed donation.
            </p>
          </div>
        ) : (
          <div className="allotment-inbox-list">
            {rows.map((row) => (
              <div key={row.id} className="allotment-inbox-card">
                <div className="allotment-inbox-card__top">
                  <div>
                    <h4>Donation #{row.donation_id}</h4>
                    <p className="allotment-inbox-card__meta">
                      {formatAmount(row.donation)}
                      {row.donation?.donor_name ? ` · ${row.donation.donor_name}` : ''}
                    </p>
                  </div>
                  <span className="allotment-badge allotment-badge--pending">Pending</span>
                </div>

                <div className="view-grid" style={{ gap: '0.35rem 1rem' }}>
                  <div className="view-item">
                    <span className="view-item-label">Credit for</span>
                    <span className="view-item-value">{formatUser(row.credited_to)}</span>
                  </div>
                  <div className="view-item">
                    <span className="view-item-label">Requested by</span>
                    <span className="view-item-value">{formatUser(row.requested_by)}</span>
                  </div>
                  <div className="view-item">
                    <span className="view-item-label">Source</span>
                    <span className="view-item-value">
                      {row.source === 'auto_donor_assignment' ? 'Auto (donor assignee)' : 'Staff claim'}
                    </span>
                  </div>
                  {row.request_note && (
                    <div className="view-item view-item--full">
                      <span className="view-item-label">Request note</span>
                      <span className="view-item-value">{row.request_note}</span>
                    </div>
                  )}
                </div>

                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Optional decision note"
                  value={decisionNotes[row.id] || ''}
                  onChange={(e) =>
                    setDecisionNotes((prev) => ({ ...prev, [row.id]: e.target.value }))
                  }
                />

                <div className="allotment-inbox-card__actions">
                  <button
                    type="button"
                    className="secondary_btn"
                    onClick={() =>
                      navigate(`/donations/online_donations/view/${row.donation_id}`)
                    }
                  >
                    View donation
                  </button>
                  <button
                    type="button"
                    className="donation-action-btn donation-action-btn--green"
                    disabled={reviewingId === row.id}
                    onClick={() => review(row.id, 'approve')}
                  >
                    {reviewingId === row.id ? 'Saving…' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    className="donation-action-btn donation-action-btn--red"
                    disabled={reviewingId === row.id}
                    onClick={() => review(row.id, 'reject')}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default PendingAllotmentsList;
