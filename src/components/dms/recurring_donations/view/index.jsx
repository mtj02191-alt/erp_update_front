import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ConfirmationModal from '../../../common/ConfirmationModal';
import {
  FiRepeat,
  FiUser,
  FiDollarSign,
  FiSend,
  FiCheck,
  FiEdit2,
  FiX,
  FiTrash2,
  FiPaperclip,
} from 'react-icons/fi';
import { useAuth } from '../../../../context/AuthContext';
import { hasPermission, isSuperAdmin, canReconcileRecurring } from '../../../../utils/permissions';
import { formatAuditActor } from '../../../common/audit/auditHistoryLabels';
import RecurringAttachmentPanel from '../shared/RecurringAttachmentPanel';

const INSTALLMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

const RecurringDonationView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { permissions, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendingLink, setSendingLink] = useState(false);
  const [linkMessage, setLinkMessage] = useState('');
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [markingPaid, setMarkingPaid] = useState(false);
  const [markMessage, setMarkMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    status: 'pending',
    amount: '',
    period_key: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editMessage, setEditMessage] = useState('');
  const [deleteInstallmentTarget, setDeleteInstallmentTarget] = useState(null);
  const [deletingInstallment, setDeletingInstallment] = useState(false);
  const [deleteSubTarget, setDeleteSubTarget] = useState(false);
  const [deletingSub, setDeletingSub] = useState(false);
  const [installmentAttachmentTarget, setInstallmentAttachmentTarget] = useState(null);

  const isFrAdmin = useMemo(() => {
    const role = String(user?.role || '').toLowerCase();
    return (
      isSuperAdmin(permissions) ||
      role === 'super_admin' ||
      permissions?.fund_raising_manager === true ||
      role === 'fund_raising_manager'
    );
  }, [permissions, user]);

  const canUpdate = useMemo(
    () =>
      isFrAdmin ||
      hasPermission(permissions, 'fund_raising', 'recurring_donations', 'update'),
    [permissions, isFrAdmin],
  );

  const canDelete = useMemo(
    () =>
      isFrAdmin ||
      hasPermission(permissions, 'fund_raising', 'recurring_donations', 'delete'),
    [permissions, isFrAdmin],
  );

  const canReconcile = useMemo(
    () => canReconcileRecurring(permissions),
    [permissions],
  );

  const installmentStatusOptions = useMemo(() => {
    if (canReconcile) return INSTALLMENT_STATUS_OPTIONS;
    return [{ value: 'pending', label: 'Pending' }];
  }, [canReconcile]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/recurring-donations/${id}`);
      if (response.data.success) {
        setData(response.data.data);
        setError('');
        setSelectedIds(new Set());
        setEditingId(null);
      } else {
        setError(response.data.message || 'Failed to load recurring donation');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load recurring donation',
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const formatAmount = (amount, currency) => {
    if (amount == null) return '-';
    return `${currency || 'PKR'} ${Number(amount).toLocaleString('en-PK', {
      minimumFractionDigits: 0,
    })}`;
  };

  const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleString();
  };

  const donorLabel = (donor) => {
    if (!donor) return '-';
    return (
      donor.name ||
      [donor.first_name, donor.last_name].filter(Boolean).join(' ') ||
      donor.email
    );
  };

  const pendingInstallments = useMemo(() => {
    const list = data?.installments || [];
    return list.filter(
      (inst) => String(inst.status || '').toLowerCase() === 'pending',
    );
  }, [data]);

  const allPendingSelected =
    pendingInstallments.length > 0 &&
    pendingInstallments.every((inst) => selectedIds.has(inst.id));

  const selectedPendingAmount = useMemo(() => {
    return pendingInstallments
      .filter((inst) => selectedIds.has(inst.id))
      .reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0);
  }, [pendingInstallments, selectedIds]);

  const toggleOne = (installmentId, isPending) => {
    if (!isPending) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(installmentId)) next.delete(installmentId);
      else next.add(installmentId);
      return next;
    });
  };

  const toggleAllPending = () => {
    if (allPendingSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(pendingInstallments.map((inst) => inst.id)));
  };

  const sendInstallmentLink = async () => {
    setSendingLink(true);
    setLinkMessage('');
    try {
      const response = await axiosInstance.post(
        `/recurring-donations/${id}/send-installment-link`,
      );
      if (response.data.success) {
        const d = response.data.data || {};
        const parts = [];
        if (d.email_sent) parts.push('email');
        if (d.whatsapp_sent) parts.push('WhatsApp');
        setLinkMessage(
          `Installment link sent via ${parts.join(' + ') || 'channel'}.`,
        );
      } else {
        setLinkMessage(
          response.data.message || 'Failed to send installment link',
        );
      }
    } catch (err) {
      setLinkMessage(
        err.response?.data?.message || 'Failed to send installment link',
      );
    } finally {
      setSendingLink(false);
    }
  };

  const markSelectedPaid = async () => {
    const ids = [...selectedIds];
    if (!ids.length) {
      setMarkMessage('Select at least one pending installment');
      return;
    }
    if (
      !window.confirm(
        `Mark ${ids.length} installment(s) as paid (${formatAmount(
          selectedPendingAmount,
          data?.subscription?.currency,
        )})?`,
      )
    ) {
      return;
    }

    setMarkingPaid(true);
    setMarkMessage('');
    try {
      const response = await axiosInstance.post(
        `/recurring-donations/${id}/mark-installments-paid`,
        { installment_ids: ids },
      );
      if (response.data.success) {
        setMarkMessage(response.data.message || 'Marked as paid');
        await load();
      } else {
        setMarkMessage(response.data.message || 'Failed to mark as paid');
      }
    } catch (err) {
      setMarkMessage(err.response?.data?.message || 'Failed to mark as paid');
    } finally {
      setMarkingPaid(false);
    }
  };

  const startEdit = (inst) => {
    setEditMessage('');
    setEditingId(inst.id);
    setEditForm({
      status: String(inst.status || 'pending').toLowerCase(),
      amount: inst.amount != null ? String(inst.amount) : '',
      period_key: inst.period_key || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditMessage('');
  };

  const saveInstallmentEdit = async (installmentId) => {
    const amountNum = Number(editForm.amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setEditMessage('Amount must be greater than 0');
      return;
    }
    setSavingEdit(true);
    setEditMessage('');
    try {
      const response = await axiosInstance.patch(
        `/recurring-donations/${id}/installments/${installmentId}`,
        {
          status: editForm.status,
          amount: amountNum,
          period_key: editForm.period_key || null,
        },
      );
      if (response.data.success) {
        setEditMessage('Installment saved');
        await load();
      } else {
        setEditMessage(response.data.message || 'Failed to save installment');
      }
    } catch (err) {
      setEditMessage(
        err.response?.data?.message || 'Failed to save installment',
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDeleteInstallment = async () => {
    if (!deleteInstallmentTarget) return;
    setDeletingInstallment(true);
    setEditMessage('');
    try {
      const response = await axiosInstance.delete(
        `/recurring-donations/${id}/installments/${deleteInstallmentTarget.id}`,
      );
      if (response.data.success) {
        setDeleteInstallmentTarget(null);
        setEditMessage('Installment deleted');
        await load();
      } else {
        setEditMessage(response.data.message || 'Failed to delete installment');
      }
    } catch (err) {
      setEditMessage(
        err.response?.data?.message || 'Failed to delete installment',
      );
    } finally {
      setDeletingInstallment(false);
    }
  };

  const confirmDeleteSubscription = async () => {
    setDeletingSub(true);
    setError('');
    try {
      const response = await axiosInstance.delete(`/recurring-donations/${id}`);
      if (response.data.success) {
        navigate('/dms/recurring-donations/list');
      } else {
        setError(response.data.message || 'Failed to delete recurring donation');
        setDeleteSubTarget(false);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to delete recurring donation',
      );
      setDeleteSubTarget(false);
    } finally {
      setDeletingSub(false);
    }
  };

  if (loading && !data) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader
            title="Recurring Donation"
            showBackButton
            backPath="/dms/recurring-donations/list"
          />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  if (error || !data?.subscription) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader
            title="Recurring Donation"
            showBackButton
            backPath="/dms/recurring-donations/list"
          />
          <div className="error-message">{error || 'Not found'}</div>
        </div>
      </>
    );
  }

  const {
    subscription,
    installments,
    initial_donation,
    donor,
    summary,
    referred_by: referrer,
  } = data;
  const referrerName = referrer
    ? [referrer.first_name, referrer.last_name].filter(Boolean).join(' ').trim() ||
      referrer.email ||
      `User #${referrer.id}`
    : null;
  const canSendInstallmentLink = !subscription.stripe_subscription_id;
  const canMarkPaid =
    canReconcile &&
    !subscription.stripe_subscription_id &&
    pendingInstallments.length > 0;
  // Edit installments for non-Stripe; delete allowed for all when permitted
  const canEditInstallments =
    canUpdate && !subscription.stripe_subscription_id;
  const canDeleteInstallments = canDelete;
  const showInstallmentActions = canEditInstallments || canDeleteInstallments;

  return (
    <>
      <Navbar />
      <div className="view-wrapper">
        <PageHeader
          title={`Recurring Donation #${subscription.id}`}
          showBackButton
          backPath="/dms/recurring-donations/list"
          icon={<FiRepeat />}
          showEdit={canUpdate}
          editPath={`/dms/recurring-donations/update/${id}`}
          rightElement={
            canDelete ? (
              <button
                type="button"
                className="back-button"
                title="Delete"
                onClick={() => setDeleteSubTarget(true)}
                style={{ color: '#ef4444' }}
              >
                <FiTrash2 />
              </button>
            ) : null
          }
        />

        <div className="view-content">
          {canSendInstallmentLink && (
            <section className="view-section">
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  className="primary_btn"
                  disabled={sendingLink}
                  onClick={sendInstallmentLink}
                >
                  <FiSend style={{ marginRight: 6 }} />
                  {sendingLink ? 'Sending...' : 'Send installment link'}
                </button>
                {linkMessage && (
                  <span style={{ fontSize: 13, color: '#4b5563' }}>
                    {linkMessage}
                  </span>
                )}
              </div>
            </section>
          )}

          <section className="view-section">
            <h3>
              <FiRepeat style={{ marginRight: 8 }} />
              Subscription
            </h3>
            <div className="view-grid">
              <div>
                <strong>Status</strong>
                <p>{subscription.status}</p>
              </div>
              <div>
                <strong>Amount</strong>
                <p>
                  {formatAmount(subscription.amount, subscription.currency)}
                </p>
              </div>
              <div>
                <strong>Billing</strong>
                <p>
                  {subscription.billing_interval} (every{' '}
                  {subscription.billing_interval_count || 1})
                </p>
              </div>
              {(subscription.prepaid_periods > 0 ||
                subscription.prepaid_months > 0) && (
                <>
                  <div>
                    <strong>Prepaid periods</strong>
                    <p>
                      {subscription.prepaid_periods ||
                        subscription.prepaid_months}{' '}
                      {subscription.billing_interval === 'day'
                        ? 'day(s)'
                        : subscription.billing_interval === 'week'
                          ? 'week(s)'
                          : 'month(s)'}
                    </p>
                  </div>
                  <div>
                    <strong>Prepaid coverage</strong>
                    <p>
                      {subscription.prepaid_start_period_key &&
                      subscription.prepaid_end_period_key
                        ? `${subscription.prepaid_start_period_key} → ${subscription.prepaid_end_period_key}`
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <strong>Next recurring after prepaid</strong>
                    <p>{subscription.start_date || '-'}</p>
                  </div>
                </>
              )}
              <div>
                <strong>Stripe subscription</strong>
                <p>{subscription.stripe_subscription_id || '-'}</p>
              </div>
              <div>
                <strong>Stripe customer</strong>
                <p>{subscription.stripe_customer_id || '-'}</p>
              </div>
              <div>
                <strong>Method</strong>
                <p>{subscription.donation_method || '-'}</p>
              </div>
              <div>
                <strong>On behalf name(s)</strong>
                <p>{subscription.on_behalf_names || '-'}</p>
              </div>
              <div>
                <strong>Project</strong>
                <p>{subscription.project_id || '-'}</p>
              </div>
              <div>
                <strong>Campaign</strong>
                <p>{subscription.campaign_id || '-'}</p>
              </div>
              <div>
                <strong>Started</strong>
                <p>{formatDate(subscription.created_at)}</p>
              </div>
              <div>
                <strong>Created by</strong>
                <p>
                  {subscription.created_by
                    ? formatAuditActor(subscription.created_by)
                    : '—'}
                </p>
              </div>
              <div>
                <strong>Installments paid</strong>
                <p>{summary?.completed_installment_count ?? 0}</p>
              </div>
              <div>
                <strong>Missing installments</strong>
                <p>{summary?.pending_installment_count ?? 0}</p>
              </div>
              <div>
                <strong>Arrears amount</strong>
                <p>
                  {formatAmount(
                    summary?.arrears_amount,
                    subscription.currency,
                  )}
                </p>
              </div>
              <div>
                <strong>Total paid amount</strong>
                <p>
                  {formatAmount(
                    summary?.total_paid_amount,
                    subscription.currency,
                  )}
                </p>
              </div>
            </div>
          </section>

          <section className="view-section">
            <RecurringAttachmentPanel
              entityId={subscription.id}
              attachments={subscription.attachments || []}
              canUpdate={canUpdate}
              onChanged={load}
            />
          </section>

          <section className="view-section">
            <h3>
              <FiUser style={{ marginRight: 8 }} />
              Donor
            </h3>
            <div className="view-grid">
              <div>
                <strong>Name</strong>
                <p>
                  {donor?.id ? (
                    <Link to={`/dms/donors/view/${donor.id}`}>
                      {donorLabel(donor)}
                    </Link>
                  ) : (
                    donorLabel(donor)
                  )}
                </p>
              </div>
              <div>
                <strong>Email</strong>
                <p>{donor?.email || '-'}</p>
              </div>
              <div>
                <strong>Phone</strong>
                <p>{donor?.phone || '-'}</p>
              </div>
              <div>
                <strong>Referred By</strong>
                <p>
                  {referrerName || '-'}
                  {referrer?.referral_code && (
                    <small style={{ color: '#6b7280', marginLeft: 6 }}>
                      ({referrer.referral_code})
                    </small>
                  )}
                </p>
              </div>
              {donor?.id && (
                <div>
                  <Link
                    to={`/dms/donors/view/${donor.id}`}
                    className="btn-secondary"
                    style={{
                      display: 'inline-block',
                      textDecoration: 'none',
                    }}
                  >
                    Open donor profile
                  </Link>
                </div>
              )}
            </div>
          </section>

          <section className="view-section">
            <h3>
              <FiDollarSign style={{ marginRight: 8 }} />
              Initial donation
            </h3>
            <div className="view-grid">
              <div>
                <strong>Donation ID</strong>
                <p>
                  {initial_donation?.id ||
                  subscription.initial_donation_id ? (
                    <Link
                      to={`/donations/online_donations/view/${
                        initial_donation?.id ||
                        subscription.initial_donation_id
                      }`}
                    >
                      {initial_donation?.id ||
                        subscription.initial_donation_id}
                    </Link>
                  ) : (
                    '-'
                  )}
                </p>
              </div>
              <div>
                <strong>Order</strong>
                <p>{initial_donation?.orderId || '-'}</p>
              </div>
              <div>
                <strong>Status</strong>
                <p>{initial_donation?.status || '-'}</p>
              </div>
              {initial_donation?.id && (
                <div>
                  <Link
                    to={`/donations/online_donations/view/${initial_donation.id}`}
                    className="btn-secondary"
                    style={{
                      display: 'inline-block',
                      textDecoration: 'none',
                    }}
                  >
                    View initial donation
                  </Link>
                </div>
              )}
            </div>
          </section>

          <section className="view-section">
            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                flexWrap: 'wrap',
                marginBottom: 12,
              }}
            >
              <h3 style={{ margin: 0 }}>Installments</h3>
              {canMarkPaid && (
                <>
                  <button
                    type="button"
                    className="primary_btn"
                    disabled={markingPaid || selectedIds.size === 0}
                    onClick={markSelectedPaid}
                  >
                    <FiCheck style={{ marginRight: 6 }} />
                    {markingPaid
                      ? 'Saving...'
                      : `Mark selected paid (${selectedIds.size})`}
                  </button>
                  {selectedIds.size > 0 && (
                    <span style={{ fontSize: 13, color: '#4b5563' }}>
                      Total:{' '}
                      {formatAmount(
                        selectedPendingAmount,
                        subscription.currency,
                      )}
                    </span>
                  )}
                </>
              )}
              {markMessage && (
                <span style={{ fontSize: 13, color: '#4b5563' }}>
                  {markMessage}
                </span>
              )}
              {editMessage && (
                <span style={{ fontSize: 13, color: '#4b5563' }}>
                  {editMessage}
                </span>
              )}
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    {canMarkPaid && (
                      <th style={{ width: 40 }}>
                        <input
                          type="checkbox"
                          checked={allPendingSelected}
                          onChange={toggleAllPending}
                          title="Select all pending"
                          aria-label="Select all pending installments"
                        />
                      </th>
                    )}
                    <th>ID</th>
                    <th>Period</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Created by</th>
                    <th>Donation / invoice</th>
                    <th>Paid at</th>
                    <th>Reason</th>
                    <th style={{ width: 120 }}>Attachments</th>
                    {showInstallmentActions && (
                      <th style={{ width: 140 }}>Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {installments?.length ? (
                    installments.map((inst) => {
                      const isPending =
                        String(inst.status || '').toLowerCase() ===
                        'pending';
                      const isEditing = editingId === inst.id;
                      return (
                        <tr key={inst.id}>
                          {canMarkPaid && (
                            <td>
                              <input
                                type="checkbox"
                                disabled={!isPending || isEditing}
                                checked={selectedIds.has(inst.id)}
                                onChange={() => toggleOne(inst.id, isPending)}
                                aria-label={`Select installment ${inst.id}`}
                              />
                            </td>
                          )}
                          <td>{inst.id}</td>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editForm.period_key}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    period_key: e.target.value,
                                  }))
                                }
                                placeholder="e.g. 2026-09"
                                style={{ width: 110 }}
                              />
                            ) : (
                              inst.period_key || '-'
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type="number"
                                min="1"
                                value={editForm.amount}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    amount: e.target.value,
                                  }))
                                }
                                style={{ width: 100 }}
                              />
                            ) : (
                              formatAmount(
                                inst.amount,
                                inst.currency || subscription.currency,
                              )
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <select
                                value={editForm.status}
                                disabled={!canReconcile}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    status: e.target.value,
                                  }))
                                }
                              >
                                {installmentStatusOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              inst.status
                            )}
                          </td>
                          <td>
                            {inst.created_by
                              ? formatAuditActor(inst.created_by)
                              : '—'}
                          </td>
                          <td
                            style={{
                              maxWidth: 160,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {inst.stripe_payment_intent_id ? (
                              <Link
                                to={`/donations/online_donations/view/${inst.stripe_payment_intent_id}`}
                              >
                                {inst.stripe_invoice_id ||
                                  inst.stripe_payment_intent_id}
                              </Link>
                            ) : (
                              inst.stripe_invoice_id || '-'
                            )}
                          </td>
                          <td>{formatDate(inst.paid_at)}</td>
                          <td>{inst.stripe_billing_reason || '-'}</td>
                          <td>
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => setInstallmentAttachmentTarget(inst)}
                              title="Manage installment attachments"
                            >
                              <FiPaperclip style={{ marginRight: 4, verticalAlign: -2 }} />
                              {(inst.attachments || []).length}
                            </button>
                          </td>
                          {showInstallmentActions && (
                            <td>
                              {isEditing ? (
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button
                                    type="button"
                                    className="primary_btn"
                                    disabled={savingEdit}
                                    onClick={() =>
                                      saveInstallmentEdit(inst.id)
                                    }
                                    title="Save"
                                  >
                                    <FiCheck />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-secondary"
                                    disabled={savingEdit}
                                    onClick={cancelEdit}
                                    title="Cancel"
                                  >
                                    <FiX />
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', gap: 6 }}>
                                  {canEditInstallments && (
                                    <button
                                      type="button"
                                      className="btn-secondary"
                                      onClick={() => startEdit(inst)}
                                      title="Edit installment"
                                    >
                                      <FiEdit2 />
                                    </button>
                                  )}
                                  {canDeleteInstallments && (
                                    <button
                                      type="button"
                                      className="btn-secondary"
                                      onClick={() =>
                                        setDeleteInstallmentTarget(inst)
                                      }
                                      title="Delete installment"
                                      style={{ color: '#ef4444' }}
                                    >
                                      <FiTrash2 />
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={
                          (canMarkPaid ? 1 : 0) +
                          9 +
                          (showInstallmentActions ? 1 : 0)
                        }
                        style={{ textAlign: 'center' }}
                      >
                        No installments recorded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {installmentAttachmentTarget && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: 16,
          }}
          onMouseDown={() => setInstallmentAttachmentTarget(null)}
        >
          <div
            style={{
              width: 'min(640px, 100%)',
              maxHeight: '85vh',
              overflow: 'auto',
              background: '#fff',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 20px 40px rgba(15, 23, 42, 0.18)',
            }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <RecurringAttachmentPanel
              entityId={installmentAttachmentTarget.id}
              attachments={installmentAttachmentTarget.attachments || []}
              canUpdate={canUpdate}
              title={`Installment #${installmentAttachmentTarget.id} attachments`}
              compact
              onChanged={async () => {
                await load();
                setInstallmentAttachmentTarget(null);
              }}
            />
            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setInstallmentAttachmentTarget(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!deleteInstallmentTarget}
        text={
          deleteInstallmentTarget
            ? `Delete installment #${deleteInstallmentTarget.id} (${
                deleteInstallmentTarget.period_key || 'no period'
              })? This archives the row only.`
            : ''
        }
        delete
        onConfirm={confirmDeleteInstallment}
        onCancel={() =>
          !deletingInstallment && setDeleteInstallmentTarget(null)
        }
      />

      <ConfirmationModal
        isOpen={deleteSubTarget}
        text={`Delete subscription #${subscription.id}? All installments will be archived. Donors and donations are not deleted.`}
        delete
        onConfirm={confirmDeleteSubscription}
        onCancel={() => !deletingSub && setDeleteSubTarget(false)}
      />
    </>
  );
};

export default RecurringDonationView;
