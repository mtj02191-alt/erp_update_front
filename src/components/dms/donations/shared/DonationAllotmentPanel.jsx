import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiSend,
  FiInbox,
  FiUserCheck,
  FiUsers,
  FiTrendingUp,
} from 'react-icons/fi';
import axiosInstance from '../../../../utils/axios';
import SearchableDropdown from '../../../common/SearchableDropdown';
import { useAuth } from '../../../../context/AuthContext';
import './DonationAllotmentPanel.css';

const STATUS_LABELS = {
  pending: { label: 'Pending approval', className: 'allotment-badge allotment-badge--pending' },
  approved: { label: 'Approved', className: 'allotment-badge allotment-badge--approved' },
  rejected: { label: 'Rejected', className: 'allotment-badge allotment-badge--rejected' },
  cancelled: { label: 'Cancelled', className: 'allotment-badge allotment-badge--cancelled' },
};

const formatUser = (user) => {
  if (!user) return '—';
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  return name || user.email || `User #${user.id}`;
};

const DonationAllotmentPanel = ({ donationId, donation, onUpdated }) => {
  const { user, hasAnyPermission } = useAuth();
  const [allotments, setAllotments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [requestNote, setRequestNote] = useState('');
  const [decisionNote, setDecisionNote] = useState('');
  const [creditUser, setCreditUser] = useState(null);
  const [pendingInboxCount, setPendingInboxCount] = useState(0);

  const isCompleted = String(donation?.status || '').toLowerCase() === 'completed';
  const hasApproved = useMemo(
    () => allotments.some((a) => a.status === 'approved'),
    [allotments],
  );
  const pendingForMe = useMemo(
    () =>
      allotments.filter(
        (a) =>
          a.status === 'pending' &&
          a.approver?.id &&
          Number(a.approver.id) === Number(user?.id),
      ),
    [allotments, user?.id],
  );

  const isManager = hasAnyPermission(['fund_raising_manager', 'super_admin']);
  const canApproveAllotments = hasAnyPermission([
    'fund_raising.donation_allotments.approve',
    'fund_raising_manager',
    'super_admin',
  ]);
  const canViewAllotmentInbox = hasAnyPermission([
    'fund_raising.donation_allotments.list_view',
    'fund_raising_manager',
    'super_admin',
  ]);

  const fetchAllotments = useCallback(async () => {
    if (!donationId || !isCompleted) return;
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get(`/donations/${donationId}/allotments`);
      if (res.data?.success) {
        setAllotments(res.data.data || []);
      } else {
        setAllotments([]);
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load allotments');
      setAllotments([]);
    } finally {
      setLoading(false);
    }
  }, [donationId, isCompleted]);

  useEffect(() => {
    fetchAllotments();
  }, [fetchAllotments]);

  useEffect(() => {
    let cancelled = false;
    const loadInboxCount = async () => {
      try {
        const res = await axiosInstance.get('/donations/allotments/pending-approval/count');
        if (!cancelled && res.data?.success) {
          setPendingInboxCount(res.data.data?.count || 0);
        }
      } catch {
        if (!cancelled) setPendingInboxCount(0);
      }
    };
    loadInboxCount();
    return () => {
      cancelled = true;
    };
  }, [allotments]);

  const showApprovalInbox =
    canViewAllotmentInbox &&
    (isManager || pendingInboxCount > 0 || pendingForMe.length > 0);

  const renderUserOption = (u, index, list, onSelect) => (
    <div
      key={u.id}
      className="searchable-dropdown__option"
      onClick={() => onSelect(u)}
      style={{
        padding: '12px',
        borderBottom: index < list.length - 1 ? '1px solid #eee' : 'none',
        cursor: 'pointer',
      }}
    >
      <div style={{ fontWeight: 500 }}>{formatUser(u)}</div>
      <div style={{ fontSize: 12, color: '#666' }}>{u.email}</div>
    </div>
  );

  const submitRequest = async (creditedToUserId = null) => {
    if (!donationId) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const payload = { request_note: requestNote.trim() || undefined };
      if (creditedToUserId) payload.credited_to_user_id = creditedToUserId;
      const res = await axiosInstance.post(`/donations/${donationId}/allotments`, payload);
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Request failed');
      }
      setSuccess(res.data.message || 'Allotment request submitted');
      setRequestNote('');
      setCreditUser(null);
      await fetchAllotments();
      onUpdated?.();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const reviewAllotment = async (allotmentId, action) => {
    setReviewingId(allotmentId);
    setError('');
    setSuccess('');
    try {
      const res = await axiosInstance.patch(
        `/donations/allotments/${allotmentId}/${action}`,
        { decision_note: decisionNote.trim() || undefined },
      );
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Review failed');
      }
      setSuccess(res.data.message || `Allotment ${action}d`);
      setDecisionNote('');
      await fetchAllotments();
      onUpdated?.();
    } catch (e) {
      setError(e.response?.data?.message || e.message || `Failed to ${action} allotment`);
    } finally {
      setReviewingId(null);
    }
  };

  if (!isCompleted) {
    return null;
  }

  return (
    <div className="donation-allotment-panel">
      <div className="donation-allotment-panel__header">
        <div className="donation-allotment-panel__header-main">
          <div className="donation-allotment-panel__header-icon" aria-hidden>
            <FiTrendingUp />
          </div>
          <div>
            <h3 className="donation-allotment-panel__title">Performance Allotment</h3>
            <p className="donation-allotment-panel__subtitle">
              Credit for this donation requires reporting manager approval before it counts toward KPIs.
            </p>
          </div>
        </div>
        {showApprovalInbox && (
          <Link to="/donations/allotments/pending" className="donation-allotment-panel__inbox-btn">
            <FiInbox />
            Approval Inbox{pendingInboxCount > 0 ? ` (${pendingInboxCount})` : ''}
          </Link>
        )}
      </div>

      {donation?.credited_to && (
        <div className="view-item donation-allotment-panel__credited">
          <span className="view-item-label">Credited to (approved)</span>
          <span className="view-item-value">{formatUser(donation.credited_to)}</span>
        </div>
      )}

      {error && <div className="status-message status-message--error">{error}</div>}
      {success && <div className="status-message status-message--success">{success}</div>}

      {loading ? (
        <p className="donation-allotment-panel__hint">Loading allotments…</p>
      ) : (
        <>
          {allotments.length > 0 && (
            <div className="donation-allotment-list">
              {allotments.map((row) => {
                const badge = STATUS_LABELS[row.status] || STATUS_LABELS.pending;
                const canReview =
                  row.status === 'pending' &&
                  canApproveAllotments &&
                  (isManager ||
                    (row.approver?.id && Number(row.approver.id) === Number(user?.id)));
                return (
                  <div key={row.id} className="donation-allotment-card">
                    <div className="donation-allotment-card__header">
                      <span className={badge.className}>{badge.label}</span>
                      <span className="donation-allotment-card__meta">
                        {row.source === 'auto_donor_assignment' ? 'Auto (donor assignee)' : 'Staff claim'}
                      </span>
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
                        <span className="view-item-label">Approver</span>
                        <span className="view-item-value">
                          {row.approver ? formatUser(row.approver) : 'Fundraising manager'}
                        </span>
                      </div>
                      {row.request_note && (
                        <div className="view-item view-item--full">
                          <span className="view-item-label">Request note</span>
                          <span className="view-item-value">{row.request_note}</span>
                        </div>
                      )}
                      {row.decision_note && (
                        <div className="view-item view-item--full">
                          <span className="view-item-label">Decision note</span>
                          <span className="view-item-value">{row.decision_note}</span>
                        </div>
                      )}
                    </div>
                    {canReview && (
                      <div className="donation-allotment-review">
                        <textarea
                          className="donation-allotment-panel__textarea"
                          rows={2}
                          placeholder="Optional decision note"
                          value={decisionNote}
                          onChange={(e) => setDecisionNote(e.target.value)}
                        />
                        <div className="donation-allotment-review__actions">
                          <button
                            type="button"
                            className="donation-allotment-panel__btn donation-allotment-panel__btn--approve"
                            disabled={reviewingId === row.id}
                            onClick={() => reviewAllotment(row.id, 'approve')}
                          >
                            {reviewingId === row.id ? 'Saving…' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            className="donation-allotment-panel__btn donation-allotment-panel__btn--reject"
                            disabled={reviewingId === row.id}
                            onClick={() => reviewAllotment(row.id, 'reject')}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!hasApproved && (
            <>
              <div className="donation-allotment-panel__section">
                <h4 className="donation-allotment-panel__section-title">
                  <span className="donation-allotment-panel__section-icon donation-allotment-panel__section-icon--self" aria-hidden>
                    <FiUserCheck />
                  </span>
                  Request credit
                </h4>
                <div className="donation-allotment-panel__row">
                  <div className="donation-allotment-panel__row-field">
                    <textarea
                      className="donation-allotment-panel__textarea"
                      rows={2}
                      placeholder="Optional note for your manager"
                      value={requestNote}
                      onChange={(e) => setRequestNote(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="donation-allotment-panel__btn donation-allotment-panel__btn--primary"
                    disabled={submitting}
                    onClick={() => submitRequest(user?.id)}
                  >
                    <FiSend />
                    {submitting ? 'Submitting…' : 'Request credit for me'}
                  </button>
                </div>
              </div>

              {isManager && (
                <div className="donation-allotment-panel__section">
                  <h4 className="donation-allotment-panel__section-title">
                    <span className="donation-allotment-panel__section-icon donation-allotment-panel__section-icon--team" aria-hidden>
                      <FiUsers />
                    </span>
                    Or request for team member
                  </h4>
                  <div className="donation-allotment-panel__row">
                    <div className="donation-allotment-panel__row-field">
                      <SearchableDropdown
                        label="Or request for team member"
                        placeholder="Search fundraising users..."
                        apiEndpoint="/users/options"
                        apiParams={{
                          assignment_scope: 'donor_assigned_filter',
                          department: 'fund_raising',
                        }}
                        onSelect={(u) => setCreditUser(u)}
                        onClear={() => setCreditUser(null)}
                        value={creditUser}
                        displayKey="first_name"
                        debounceDelay={400}
                        minSearchLength={2}
                        allowResearch
                        renderOption={(u, index, list) =>
                          renderUserOption(u, index, list, setCreditUser)
                        }
                      />
                    </div>
                    <button
                      type="button"
                      className="donation-allotment-panel__btn donation-allotment-panel__btn--secondary"
                      disabled={submitting || !creditUser?.id}
                      onClick={() => submitRequest(creditUser.id)}
                    >
                      <FiUserCheck />
                      {submitting ? 'Submitting…' : 'Submit for selected user'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {pendingForMe.length > 0 && !hasApproved && (
            <p className="donation-allotment-panel__hint">
              You have {pendingForMe.length} pending allotment
              {pendingForMe.length > 1 ? 's' : ''} awaiting your approval on this donation.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default DonationAllotmentPanel;
