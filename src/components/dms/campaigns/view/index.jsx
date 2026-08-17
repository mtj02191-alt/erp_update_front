import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import Card from '../../../common/Card';
import { FiEdit, FiBarChart2, FiRepeat } from 'react-icons/fi';
import { formatTargetFrequency, CAMPAIGN_TEMPLATE_SLOTS, formatCommunicationSlot } from '../campaignConstants';

const ViewCampaign = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [donationItems, setDonationItems] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportFrom, setReportFrom] = useState('');
  const [reportTo, setReportTo] = useState('');
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  useEffect(() => {
    if (campaign) {
      fetchReport();
    }
  }, [id, campaign, reportFrom, reportTo]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/campaigns/${id}`);
      if (response.data.success) {
        setCampaign(response.data.data);
        try {
          const itemsRes = await axiosInstance.get(`/campaigns/${id}/donation-items`);
          if (itemsRes.data.success) {
            setDonationItems(itemsRes.data.data || []);
          }
        } catch {
          setDonationItems([]);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch campaign');
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    try {
      const params = {};
      if (reportFrom) params.from = reportFrom;
      if (reportTo) params.to = reportTo;
      const response = await axiosInstance.get(`/campaigns/${id}/report`, { params });
      if (response.data.success) {
        setReport(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
    }
  };

  const handleSetStatus = async () => {
    if (!newStatus) return;
    setUpdatingStatus(true);
    try {
      await axiosInstance.patch(`/campaigns/${id}/status`, { status: newStatus });
      setShowStatusForm(false);
      setNewStatus('');
      fetchCampaign();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: '#6b7280',
      active: '#10b981',
      paused: '#f59e0b',
      ended: '#8b5cf6',
      archived: '#9ca3af'
    };
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '4px',
        backgroundColor: colors[status] || '#6b7280',
        color: 'white',
        fontSize: '14px',
        textTransform: 'capitalize'
      }}>
        {status}
      </span>
    );
  };

  const formatAmount = (amount, currency = 'PKR') => {
    if (amount == null) return '-';
    const n = Number(amount);
    return `${currency} ${n.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;
  };

  const formatPercent = (pct) => {
    if (pct == null) return '-';
    return `${Number(pct).toFixed(1)}%`;
  };

  const handleBack = () => navigate('/dms/campaigns/list');
  const handleEdit = () => navigate(`/dms/campaigns/edit/${id}`);

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'ended', label: 'Ended' },
    { value: 'archived', label: 'Archived' }
  ];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading campaign...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !campaign) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="error-container">
            <div className="status-message status-message--error">{error || 'Campaign not found'}</div>
            <button className="primary_btn" onClick={handleBack}>Back to Campaigns</button>
          </div>
        </div>
      </>
    );
  }

  const goalLabel = campaign.is_recurring ? 'Target per period' : 'Goal Amount';
  const campaignInfo = {
    Status: getStatusBadge(campaign.status),
    Type: campaign.is_recurring ? 'Recurring' : 'One-time',
    Slug: campaign.slug || '-',
    Currency: campaign.currency || 'PKR',
    [goalLabel]: formatAmount(campaign.goal_amount, campaign.currency),
    'Start Date': campaign.start_at ? new Date(campaign.start_at).toLocaleString() : '-',
    'End Date': campaign.end_at ? new Date(campaign.end_at).toLocaleString() : '-',
    Featured: campaign.is_featured ? 'Yes' : 'No'
  };

  if (campaign.is_recurring) {
    campaignInfo.Frequency = formatTargetFrequency(campaign.target_frequency);
    const freq = campaign.target_frequency;
    const automationLabel =
      freq === 'daily'
        ? 'Enabled (daily)'
        : freq === 'weekly'
          ? 'Enabled (Sat & Sun)'
          : 'Enabled (2nd of month)';
    campaignInfo['Donor automation'] = campaign.monthly_donor_automation_enabled
      ? campaign.use_default_thanks_and_reminders
        ? `${automationLabel} · default thanks & payment links`
        : automationLabel
      : 'Off';
  }

  campaignInfo.Program = campaign.program?.label || '—';
  campaignInfo.Subprogram = campaign.sub_program?.label || '—';

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          title={campaign.title}
          onBack={handleBack}
          showEdit={true}
          editPath={`/dms/campaigns/edit/${id}`}
        />

        <div className="list-content">
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '300px' }}>
              <Card
                title="Campaign Information"
                data={campaignInfo}
              />
            </div>

            {report && (
              <div style={{ flex: '1', minWidth: '300px' }}>
                <Card
                  title={campaign.is_recurring ? 'Overall Donations (filtered range)' : 'Donations Report'}
                  data={{
                    'Total Amount': formatAmount(report.total_amount, campaign.currency),
                    'Total Donations': report.total_donations,
                    'Unique Donors': report.unique_donors,
                    'Avg Donation': formatAmount(report.avg_donation, campaign.currency)
                  }}
                />
              </div>
            )}

            {report?.current_period && (
              <div style={{ flex: '1', minWidth: '300px' }}>
                <Card
                  title="Current period"
                  data={{
                    Period: report.current_period.label,
                    Raised: formatAmount(report.current_period.raised, campaign.currency),
                    Target: formatAmount(report.period_goal, campaign.currency),
                    Progress: formatPercent(report.current_period.progress_pct),
                    Donations: report.current_period.count
                  }}
                />
              </div>
            )}
          </div>

          {campaign.is_recurring && (
            campaign.communication_templates ||
            campaign.use_default_thanks_and_reminders
          ) && (
            <div style={{
              padding: '20px',
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h3 style={{ marginBottom: '12px' }}>Communication</h3>
              {campaign.use_default_thanks_and_reminders && (
                <p style={{ fontSize: '13px', color: '#0369a1', marginBottom: '12px', lineHeight: 1.5 }}>
                  Using system defaults: thank-you email/WhatsApp when donated; payment-link email/WhatsApp as reminder when not.
                </p>
              )}
              {campaign.communication_templates && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Configuration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CAMPAIGN_TEMPLATE_SLOTS.map((slot) => {
                      const defaultsCover =
                        campaign.use_default_thanks_and_reminders &&
                        (slot.key === 'thanks' || slot.key === 'reminder');
                      return (
                        <tr key={slot.key}>
                          <td>{slot.label}</td>
                          <td>
                            {defaultsCover
                              ? slot.key === 'thanks'
                                ? 'System default (thanks email + WhatsApp)'
                                : 'System default (payment-link email + WhatsApp)'
                              : formatCommunicationSlot(campaign.communication_templates, slot.key)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {donationItems.length > 0 && (
            <div style={{
              padding: '20px',
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h3 style={{ marginBottom: '12px' }}>Donation items (per-unit pricing)</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Unit price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {donationItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{item.name}</div>
                        {item.description && (
                          <div style={{ fontSize: '12px', color: '#666' }}>{item.description}</div>
                        )}
                      </td>
                      <td>{formatAmount(item.unit_price, item.currency || campaign.currency)}</td>
                      <td>{item.is_active ? 'Active' : 'Inactive'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#6b7280' }}>
                {campaign.is_recurring
                  ? 'Used on website checkout and recurring donor pledges.'
                  : 'Used on website checkout for one-time donations.'}
              </p>
            </div>
          )}

          {campaign.description && (
            <div style={{
              padding: '20px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h3 style={{ marginBottom: '10px' }}>Description</h3>
              <p style={{ color: '#4b5563', lineHeight: '1.6' }}>{campaign.description}</p>
            </div>
          )}

          {/* Report Date Filter */}
          <div style={{
            display: 'flex',
            gap: '15px',
            alignItems: 'flex-end',
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Report From</label>
              <input
                type="date"
                value={reportFrom}
                onChange={(e) => setReportFrom(e.target.value)}
                style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Report To</label>
              <input
                type="date"
                value={reportTo}
                onChange={(e) => setReportTo(e.target.value)}
                style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
              />
            </div>
          </div>

          {/* Period Totals (recurring) */}
          {report?.period_totals && report.period_totals.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiRepeat /> Period breakdown
              </h3>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Raised ({campaign.currency})</th>
                      <th>Target</th>
                      <th>Progress</th>
                      <th>Donations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.period_totals.map((row) => (
                      <tr key={row.period_key}>
                        <td>{row.label}</td>
                        <td>{formatAmount(row.amount, campaign.currency)}</td>
                        <td>{formatAmount(row.goal, campaign.currency)}</td>
                        <td>{formatPercent(row.progress_pct)}</td>
                        <td>{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Daily Totals Table */}
          {report && report.daily_totals && report.daily_totals.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiBarChart2 /> Daily Donations
              </h3>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount ({campaign.currency})</th>
                      <th>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.daily_totals.map((row) => (
                      <tr key={row.date}>
                        <td>{row.date}</td>
                        <td>{formatAmount(row.amount, campaign.currency)}</td>
                        <td>{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="form-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="primary_btn" onClick={handleEdit}>
              <FiEdit style={{ marginRight: '8px' }} />
              Edit Campaign
            </button>
            <button
              className="secondary_btn"
              onClick={() => { setShowStatusForm(!showStatusForm); setNewStatus(campaign.status); }}
            >
              Change Status
            </button>
            {showStatusForm && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px'
                  }}
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button
                  className="primary_btn"
                  onClick={handleSetStatus}
                  disabled={updatingStatus || newStatus === campaign.status}
                >
                  {updatingStatus ? 'Updating...' : 'Update'}
                </button>
                <button
                  className="secondary_btn"
                  onClick={() => { setShowStatusForm(false); setNewStatus(''); }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewCampaign;
