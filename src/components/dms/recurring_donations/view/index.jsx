import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import { FiRepeat, FiUser, FiDollarSign, FiSend, FiCheck } from 'react-icons/fi';

const RecurringDonationView = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendingLink, setSendingLink] = useState(false);
  const [linkMessage, setLinkMessage] = useState('');
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [markingPaid, setMarkingPaid] = useState(false);
  const [markMessage, setMarkMessage] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/recurring-donations/${id}`);
      if (response.data.success) {
        setData(response.data.data);
        setError('');
        setSelectedIds(new Set());
      } else {
        setError(response.data.message || 'Failed to load recurring donation');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load recurring donation');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const formatAmount = (amount, currency) => {
    if (amount == null) return '-';
    return `${currency || 'PKR'} ${Number(amount).toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;
  };

  const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleString();
  };

  const donorLabel = (donor) => {
    if (!donor) return '-';
    return donor.name || [donor.first_name, donor.last_name].filter(Boolean).join(' ') || donor.email;
  };

  const pendingInstallments = useMemo(() => {
    const list = data?.installments || [];
    return list.filter((inst) => String(inst.status || '').toLowerCase() === 'pending');
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
      const response = await axiosInstance.post(`/recurring-donations/${id}/send-installment-link`);
      if (response.data.success) {
        const d = response.data.data || {};
        const parts = [];
        if (d.email_sent) parts.push('email');
        if (d.whatsapp_sent) parts.push('WhatsApp');
        setLinkMessage(`Installment link sent via ${parts.join(' + ') || 'channel'}.`);
      } else {
        setLinkMessage(response.data.message || 'Failed to send installment link');
      }
    } catch (err) {
      setLinkMessage(err.response?.data?.message || 'Failed to send installment link');
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

  if (loading && !data) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader title="Recurring Donation" showBackButton backPath="/dms/recurring-donations/list" />
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
          <PageHeader title="Recurring Donation" showBackButton backPath="/dms/recurring-donations/list" />
          <div className="error-message">{error || 'Not found'}</div>
        </div>
      </>
    );
  }

  const { subscription, installments, initial_donation, donor, summary } = data;
  const canSendInstallmentLink = !subscription.stripe_subscription_id;
  const canMarkPaid = !subscription.stripe_subscription_id && pendingInstallments.length > 0;

  return (
    <>
      <Navbar />
      <div className="view-wrapper">
        <PageHeader
          title={`Recurring Donation #${subscription.id}`}
          showBackButton
          backPath="/dms/recurring-donations/list"
          icon={<FiRepeat />}
        />

        <div className="view-content">
          {canSendInstallmentLink && (
            <section className="view-section">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
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
                  <span style={{ fontSize: 13, color: '#4b5563' }}>{linkMessage}</span>
                )}
              </div>
            </section>
          )}

          <section className="view-section">
            <h3><FiRepeat style={{ marginRight: 8 }} />Subscription</h3>
            <div className="view-grid">
              <div><strong>Status</strong><p>{subscription.status}</p></div>
              <div><strong>Amount</strong><p>{formatAmount(subscription.amount, subscription.currency)}</p></div>
              <div><strong>Billing</strong><p>{subscription.billing_interval} (every {subscription.billing_interval_count || 1})</p></div>
              {(subscription.prepaid_periods > 0 || subscription.prepaid_months > 0) && (
                <>
                  <div>
                    <strong>Prepaid periods</strong>
                    <p>
                      {subscription.prepaid_periods || subscription.prepaid_months}{' '}
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
                      {subscription.prepaid_start_period_key && subscription.prepaid_end_period_key
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
              <div><strong>Stripe subscription</strong><p>{subscription.stripe_subscription_id || '-'}</p></div>
              <div><strong>Stripe customer</strong><p>{subscription.stripe_customer_id || '-'}</p></div>
              <div><strong>Method</strong><p>{subscription.donation_method || '-'}</p></div>
              <div><strong>Project</strong><p>{subscription.project_id || '-'}</p></div>
              <div><strong>Campaign</strong><p>{subscription.campaign_id || '-'}</p></div>
              <div><strong>Started</strong><p>{formatDate(subscription.created_at)}</p></div>
              <div><strong>Installments paid</strong><p>{summary?.completed_installment_count ?? 0}</p></div>
              <div><strong>Missing installments</strong><p>{summary?.pending_installment_count ?? 0}</p></div>
              <div><strong>Arrears amount</strong><p>{formatAmount(summary?.arrears_amount, subscription.currency)}</p></div>
              <div><strong>Total paid amount</strong><p>{formatAmount(summary?.total_paid_amount, subscription.currency)}</p></div>
            </div>
          </section>

          <section className="view-section">
            <h3><FiUser style={{ marginRight: 8 }} />Donor</h3>
            <div className="view-grid">
              <div>
                <strong>Name</strong>
                <p>
                  {donor?.id ? (
                    <Link to={`/dms/donors/view/${donor.id}`}>{donorLabel(donor)}</Link>
                  ) : (
                    donorLabel(donor)
                  )}
                </p>
              </div>
              <div><strong>Email</strong><p>{donor?.email || '-'}</p></div>
              <div><strong>Phone</strong><p>{donor?.phone || '-'}</p></div>
              {donor?.id && (
                <div>
                  <Link to={`/dms/donors/view/${donor.id}`} className="btn-secondary" style={{ display: 'inline-block', textDecoration: 'none' }}>
                    Open donor profile
                  </Link>
                </div>
              )}
            </div>
          </section>

          <section className="view-section">
            <h3><FiDollarSign style={{ marginRight: 8 }} />Initial donation</h3>
            <div className="view-grid">
              <div>
                <strong>Donation ID</strong>
                <p>
                  {(initial_donation?.id || subscription.initial_donation_id) ? (
                    <Link to={`/donations/online_donations/view/${initial_donation?.id || subscription.initial_donation_id}`}>
                      {initial_donation?.id || subscription.initial_donation_id}
                    </Link>
                  ) : (
                    '-'
                  )}
                </p>
              </div>
              <div><strong>Order</strong><p>{initial_donation?.orderId || '-'}</p></div>
              <div><strong>Status</strong><p>{initial_donation?.status || '-'}</p></div>
              {initial_donation?.id && (
                <div>
                  <Link
                    to={`/donations/online_donations/view/${initial_donation.id}`}
                    className="btn-secondary"
                    style={{ display: 'inline-block', textDecoration: 'none' }}
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
                      Total: {formatAmount(selectedPendingAmount, subscription.currency)}
                    </span>
                  )}
                </>
              )}
              {markMessage && (
                <span style={{ fontSize: 13, color: '#4b5563' }}>{markMessage}</span>
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
                    <th>Donation / invoice</th>
                    <th>Paid at</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {installments?.length ? (
                    installments.map((inst) => {
                      const isPending =
                        String(inst.status || '').toLowerCase() === 'pending';
                      return (
                        <tr key={inst.id}>
                          {canMarkPaid && (
                            <td>
                              <input
                                type="checkbox"
                                disabled={!isPending}
                                checked={selectedIds.has(inst.id)}
                                onChange={() => toggleOne(inst.id, isPending)}
                                aria-label={`Select installment ${inst.id}`}
                              />
                            </td>
                          )}
                          <td>{inst.id}</td>
                          <td>{inst.period_key || '-'}</td>
                          <td>{formatAmount(inst.amount, inst.currency || subscription.currency)}</td>
                          <td>{inst.status}</td>
                          <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {inst.stripe_payment_intent_id ? (
                              <Link to={`/donations/online_donations/view/${inst.stripe_payment_intent_id}`}>
                                {inst.stripe_invoice_id || inst.stripe_payment_intent_id}
                              </Link>
                            ) : (
                              inst.stripe_invoice_id || '-'
                            )}
                          </td>
                          <td>{formatDate(inst.paid_at)}</td>
                          <td>{inst.stripe_billing_reason || '-'}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={canMarkPaid ? 8 : 7} style={{ textAlign: 'center' }}>
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
    </>
  );
};

export default RecurringDonationView;
