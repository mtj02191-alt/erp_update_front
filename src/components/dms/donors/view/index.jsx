import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../utils/axios';
import { useAuth } from '../../../../context/AuthContext';
import { fundRaisingDonorsHas, canViewModule, hasModuleAccess } from '../../../../utils/permissions';
import '../../donor_relationship/donor-relationship.css';
import './index.css';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import Modal from '../../../common/Modal';
import DonorAuditHistory from '../shared/DonorAuditHistory';
import DonorPipelinePanel from '../shared/DonorPipelinePanel';
import DonorCommunication from '../../donor_relationship/shared/DonorCommunication';
import ManualRecurringDonorPanel from '../../manual_recurring/ManualRecurringDonorPanel';
import { formatAuditActor } from '../../../common/audit/auditHistoryLabels';
import { formatPipelineStage, resolveDonorPipelineStage } from '../shared/donorPipelineConstants';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiEdit,
  FiKey,
  FiPlus,
  FiFileText,
  FiMessageSquare,
  FiSend,
  FiHeart,
  FiList,
  FiCalendar,
  FiRefreshCw,
  FiLayers,
  FiClock,
  FiCopy,
  FiCheck,
  FiMaximize2,
  FiMinimize2,
  FiMinus,
  FiSidebar,
  FiGitBranch,
} from 'react-icons/fi';
import { GiPayMoney } from 'react-icons/gi';
import { BsFillBuildingsFill } from 'react-icons/bs';

const ViewDonor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const flashMessage = location.state?.flashMessage || '';
  const { permissions, user } = useAuth();
  const [donor, setDonor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revealModalOpen, setRevealModalOpen] = useState(false);
  const [revealedPassword, setRevealedPassword] = useState('');
  const [revealError, setRevealError] = useState('');
  const [revealLoading, setRevealLoading] = useState(false);
  const [copiedField, setCopiedField] = useState('');
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [asideHidden, setAsideHidden] = useState(false);

  const showDonorJourney = useMemo(() => {
    if (!donor || !permissions) return false;
    if (permissions.super_admin || permissions.fund_raising_manager) return true;
    if (hasModuleAccess(permissions, 'fund_raising', 'donor_relationship')) return true;
    if (canViewModule(permissions, 'fund_raising', 'donor_relationship')) return true;
    const assigned = donor.assigned_to;
    const assignedId = typeof assigned === 'object' ? assigned?.id : assigned;
    return !!(user?.id && assignedId && Number(assignedId) === Number(user.id));
  }, [donor, permissions, user]);

  useEffect(() => {
    fetchDonor();
  }, [id]);

  const fetchDonor = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/donors/${id}`);
      if (response.data.success) {
        setDonor(response.data.data);
      } else {
        setError('Failed to fetch donor details');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch donor details');
      console.error('Error fetching donor:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/dms/donors/list');
  };

  const handleEdit = () => {
    navigate(`/dms/donors/edit/${id}`);
  };

  const handleViewDonations = () => {
    navigate(`/dms/donors/${id}/donations`);
  };

  const handleAddDonation = () => {
    navigate(`/donations/online_donations/add?donor_id=${id}`);
  };

  const handleLogInteraction = () => {
    navigate(`/dms/donor-relationship/add?donor_id=${id}`);
  };

  const handleSendEmail = () => {
    // UI only for now
  };

  const handleQuickCall = () => {
    if (!donor?.phone) return;
    window.location.href = `tel:${String(donor.phone).replace(/\s+/g, '')}`;
  };

  const handleQuickEmail = () => {
    if (donor?.email) {
      window.location.href = `mailto:${donor.email}`;
      return;
    }
    handleSendEmail();
  };

  const handleQuickWhatsApp = () => {
    if (!donor?.phone) return;
    const digits = String(donor.phone).replace(/\D/g, '');
    if (!digits) return;
    window.open(`https://wa.me/${digits}`, '_blank', 'noopener,noreferrer');
  };

  const copyToClipboard = async (value, fieldKey, label) => {
    const text = String(value || '').trim();
    if (!text) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedField(fieldKey);
      toast.success(`${label} copied`);
      window.setTimeout(() => {
        setCopiedField((current) => (current === fieldKey ? '' : current));
      }, 1500);
    } catch (err) {
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  const canRevealPassword = (() => {
    if (!permissions) return false;
    return permissions.super_admin === true || fundRaisingDonorsHas(permissions, 'update');
  })();

  const canUpdatePipeline = (() => {
    if (!permissions) return false;
    return (
      permissions.super_admin === true ||
      permissions.fund_raising_manager === true ||
      fundRaisingDonorsHas(permissions, 'update')
    );
  })();

  const closeRevealModal = () => {
    setRevealModalOpen(false);
    setRevealedPassword('');
    setRevealError('');
    setRevealLoading(false);
  };

  const handleRevealPassword = async () => {
    try {
      setRevealError('');
      setRevealLoading(true);
      setRevealModalOpen(true);
      const res = await axiosInstance.get(`/donors/${id}/reveal-password`);
      const password = res?.data?.data?.password || '';
      setRevealedPassword(password);
      if (!password) setRevealError('No password returned.');
    } catch (err) {
      setRevealError(err.response?.data?.message || 'Failed to reveal password');
    } finally {
      setRevealLoading(false);
    }
  };

  const getDonorTypeLabel = (type) =>
    type === 'csr' ? 'CSR Donor (Corporate)' : 'Individual Donor';

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
  };

  const formatMoney = (amount, currency) => {
    const code = (currency || 'PKR').toUpperCase();
    const n = Number(amount || 0);
    return `${code} ${n.toLocaleString('en-US')}`;
  };

  const formatShortDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading donor details...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="error-container">
            <div className="status-message status-message--error">{error}</div>
            <button className="primary_btn" onClick={handleBack}>
              Back to Donors List
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!donor) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="error-container">
            <div className="status-message status-message--error">Donor not found</div>
            <button className="primary_btn" onClick={handleBack}>
              Back to Donors List
            </button>
          </div>
        </div>
      </>
    );
  }

  const isCsr = donor.donor_type === 'csr';
  const typeLabel = getDonorTypeLabel(donor.donor_type);
  const typeBadgeClass = `donor-profile-type-badge${isCsr ? ' donor-profile-type-badge--csr' : ''}`;
  const stats = {
    total_donations:
      donor.donation_stats?.total_donations ?? donor.donation_count ?? 0,
    total_donated:
      donor.donation_stats?.total_donated ?? donor.total_donated ?? 0,
    currency:
      donor.donation_stats?.currency ||
      donor.donation_stats?.last_donation?.currency ||
      'PKR',
    first_donation: donor.donation_stats?.first_donation || null,
    last_donation: donor.donation_stats?.last_donation || null,
  };
  const currency = stats.currency || stats.last_donation?.currency || 'PKR';
  const recurringActive = !!donor.recurring;
  const addressText = [donor.address, donor.city, donor.country, donor.postal_code]
    .filter(Boolean)
    .join(', ');

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader title="Donor Details" onBack={handleBack} showAdd={false} />

        <div className="list-content donor-profile-page">
          {flashMessage && (
            <div className="reconciliation-summary" style={{ marginBottom: 16 }}>
              {flashMessage}
            </div>
          )}

          <div
            className={`donor-crm-layout${infoExpanded ? ' donor-crm-layout--info-expanded' : ''}${
              asideHidden ? ' donor-crm-layout--aside-hidden' : ''
            }`}
          >
            {asideHidden ? (
              <button
                type="button"
                className="donor-crm-aside-show-btn"
                onClick={() => setAsideHidden(false)}
                title="Show donor profile"
                aria-label="Show donor profile"
              >
                <FiSidebar />
              </button>
            ) : null}

            {!asideHidden ? (
            <aside className="donor-crm-aside">
              <section className="donor-crm-card donor-crm-identity">
                <div className="donor-crm-identity__top">
                  <span className="donor-crm-identity__eyebrow">Donor Profile</span>
                  <div className="donor-crm-identity__top-actions">
                    <button
                      type="button"
                      className="donor-crm-expand-btn"
                      onClick={() => setInfoExpanded((v) => !v)}
                      title={infoExpanded ? 'Collapse donor info' : 'Expand donor info'}
                      aria-label={infoExpanded ? 'Collapse donor info' : 'Expand donor info'}
                      aria-pressed={infoExpanded}
                    >
                      {infoExpanded ? <FiMinimize2 /> : <FiMaximize2 />}
                      <span>{infoExpanded ? 'Collapse' : 'Expand'}</span>
                    </button>
                    <button
                      type="button"
                      className="donor-crm-expand-btn donor-crm-expand-btn--hide"
                      onClick={() => {
                        setInfoExpanded(false);
                        setAsideHidden(true);
                      }}
                      title="Hide donor profile"
                      aria-label="Hide donor profile"
                    >
                      <FiMinus />
                      <span>Hide</span>
                    </button>
                  </div>
                </div>

                <div className="donor-crm-identity__hero">
                  <div className="donor-crm-identity__avatar" aria-hidden="true">
                    {getInitials(donor.name)}
                    <span className="donor-crm-identity__heart">
                      <FiHeart />
                    </span>
                  </div>
                  <div className="donor-crm-identity__intro">
                    <h2 className="donor-crm-identity__name">{donor.name || 'Unnamed donor'}</h2>
                    <span className={typeBadgeClass}>
                      {isCsr ? <BsFillBuildingsFill /> : <FiUser />}
                      {typeLabel}
                    </span>
                  </div>
                </div>
                <ul className="donor-crm-contact-list">
                  <li>
                    <FiMail />
                    <span className="donor-crm-contact-list__value">
                      {donor.email || 'Not provided'}
                    </span>
                    {donor.email ? (
                      <button
                        type="button"
                        className="donor-crm-copy-btn"
                        onClick={() => copyToClipboard(donor.email, 'email', 'Email')}
                        title="Copy email"
                        aria-label="Copy email"
                      >
                        {copiedField === 'email' ? <FiCheck /> : <FiCopy />}
                      </button>
                    ) : null}
                  </li>
                  <li>
                    <FiPhone />
                    <span className="donor-crm-contact-list__value">
                      {donor.phone || 'Not provided'}
                    </span>
                    {donor.phone ? (
                      <button
                        type="button"
                        className="donor-crm-copy-btn"
                        onClick={() => copyToClipboard(donor.phone, 'phone', 'Phone')}
                        title="Copy phone"
                        aria-label="Copy phone"
                      >
                        {copiedField === 'phone' ? <FiCheck /> : <FiCopy />}
                      </button>
                    ) : null}
                  </li>
                  <li>
                    <FiMapPin />
                    <span className="donor-crm-contact-list__value">
                      {addressText || 'Not provided'}
                    </span>
                    {addressText ? (
                      <button
                        type="button"
                        className="donor-crm-copy-btn"
                        onClick={() => copyToClipboard(addressText, 'address', 'Address')}
                        title="Copy address"
                        aria-label="Copy address"
                      >
                        {copiedField === 'address' ? <FiCheck /> : <FiCopy />}
                      </button>
                    ) : null}
                  </li>
                </ul>

                <div className="donor-crm-profile-actions">
                  <button type="button" className="donor-profile-btn donor-profile-btn--edit" onClick={handleEdit}>
                    <FiEdit />
                    Edit
                  </button>
                  {canRevealPassword && (
                    <button
                      type="button"
                      className="donor-profile-btn donor-profile-btn--password"
                      onClick={handleRevealPassword}
                      title="Reveal donor password (admin only)"
                    >
                      <FiKey />
                      Password
                    </button>
                  )}
                  <button
                    type="button"
                    className="donor-profile-btn donor-profile-btn--donations"
                    onClick={handleViewDonations}
                  >
                    <FiList />
                    Donations
                  </button>
                  <button
                    type="button"
                    className="donor-profile-btn donor-profile-btn--add-donation"
                    onClick={handleAddDonation}
                  >
                    <FiPlus />
                    Add Donation
                  </button>
                  <button
                    type="button"
                    className="donor-profile-btn donor-profile-btn--email"
                    onClick={handleSendEmail}
                  >
                    <FiSend />
                    Send Email
                  </button>
                </div>
              </section>

              <section className="donor-crm-card">
                <h3 className="donor-crm-card__title">Donor Summary</h3>
                <div className="donor-crm-summary-list">
                  <div className="donor-crm-summary-row">
                    <span>Type</span>
                    <strong>{typeLabel}</strong>
                  </div>
                  {!isCsr && donor.first_name && (
                    <div className="donor-crm-summary-row">
                      <span>First Name</span>
                      <strong>{donor.first_name}</strong>
                    </div>
                  )}
                  {!isCsr && donor.last_name && (
                    <div className="donor-crm-summary-row">
                      <span>Last Name</span>
                      <strong>{donor.last_name}</strong>
                    </div>
                  )}
                  {donor.date_of_birth && (
                    <div className="donor-crm-summary-row">
                      <span>Date of Birth</span>
                      <strong>{formatShortDate(donor.date_of_birth)}</strong>
                    </div>
                  )}
                  {donor.area_of_interest && (
                    <div className="donor-crm-summary-row">
                      <span>Area of Interest</span>
                      <strong>{donor.area_of_interest}</strong>
                    </div>
                  )}
                  {isCsr && donor.business_type && (
                    <div className="donor-crm-summary-row">
                      <span>Business Type</span>
                      <strong>
                        {donor.business_type === 'Other'
                          ? donor.business_type_other || 'Other'
                          : donor.business_type}
                      </strong>
                    </div>
                  )}
                  {(donor.organization_affiliations || []).length > 0 && (
                    <div className="donor-crm-summary-row donor-crm-summary-row--block">
                      <span>Organizations</span>
                      <strong>
                        {(donor.organization_affiliations || []).map((aff) => (
                          <div key={aff.id} style={{ marginBottom: 6 }}>
                            {aff.organization?.name || `Org #${aff.organization_id}`}
                            {aff.role ? ` · ${String(aff.role).replace(/_/g, ' ')}` : ''}
                            {aff.is_primary ? ' · primary' : ''}
                            {aff.branch?.name ? ` · ${aff.branch.name}` : ''}
                          </div>
                        ))}
                      </strong>
                    </div>
                  )}
                  <div className="donor-crm-summary-row">
                    <span>City</span>
                    <strong>{donor.city || '—'}</strong>
                  </div>
                  <div className="donor-crm-summary-row">
                    <span>Country</span>
                    <strong>{donor.country || '—'}</strong>
                  </div>
                  <div className="donor-crm-summary-row">
                    <span>Postal Code</span>
                    <strong>{donor.postal_code || '—'}</strong>
                  </div>
                  <div className="donor-crm-summary-row">
                    <span>Status</span>
                    <strong>
                      <span
                        className={`donor-crm-pill ${
                          donor.is_active === false
                            ? 'donor-crm-pill--muted'
                            : 'donor-crm-pill--success'
                        }`}
                      >
                        {donor.is_active === false ? 'Inactive' : 'Active'}
                      </span>
                    </strong>
                  </div>
                  <div className="donor-crm-summary-row">
                    <span>Pipeline Stage</span>
                    <strong>
                      <span className="donor-crm-pill donor-crm-pill--info">
                        <FiGitBranch style={{ marginRight: 4 }} />
                        {formatPipelineStage(
                          donor.effective_pipeline_stage || donor.pipeline_stage,
                        )}
                      </span>
                    </strong>
                  </div>
                  {(donor.pipeline_ask_amount != null ||
                    donor.pipeline_pledge_amount != null) && (
                    <>
                      {donor.pipeline_ask_amount != null && (
                        <div className="donor-crm-summary-row">
                          <span>Ask Amount</span>
                          <strong>
                            {formatMoney(
                              donor.pipeline_ask_amount,
                              donor.pipeline_amount_currency || 'PKR',
                            )}
                          </strong>
                        </div>
                      )}
                      {donor.pipeline_pledge_amount != null && (
                        <div className="donor-crm-summary-row">
                          <span>Pledge Amount</span>
                          <strong>
                            {formatMoney(
                              donor.pipeline_pledge_amount,
                              donor.pipeline_amount_currency || 'PKR',
                            )}
                          </strong>
                        </div>
                      )}
                    </>
                  )}
                  <div className="donor-crm-summary-row">
                    <span>Registered On</span>
                    <strong>{formatShortDate(donor.created_at)}</strong>
                  </div>
                  <div className="donor-crm-summary-row">
                    <span>Referred By</span>
                    <strong>
                      {donor.referred_by ? formatAuditActor(donor.referred_by) : '—'}
                    </strong>
                  </div>
                  <div className="donor-crm-summary-row">
                    <span>Assigned To (Fundraising)</span>
                    <strong>
                      <span
                        className={`donor-crm-pill ${
                          donor.assigned_to ? 'donor-crm-pill--info' : 'donor-crm-pill--muted'
                        }`}
                      >
                        {donor.assigned_to
                          ? formatAuditActor(donor.assigned_to)
                          : 'Unassigned'}
                      </span>
                    </strong>
                  </div>
                  <div className="donor-crm-summary-row">
                    <span>Created by</span>
                    <strong>
                      {donor.created_by ? formatAuditActor(donor.created_by) : '—'}
                    </strong>
                  </div>
                  <div className="donor-crm-summary-row">
                    <span>Last updated by</span>
                    <strong>
                      {donor.updated_by ? formatAuditActor(donor.updated_by) : '—'}
                    </strong>
                  </div>
                  <div className="donor-crm-summary-row donor-crm-summary-row--block">
                    <span>Notes</span>
                    <strong>{donor.notes || '—'}</strong>
                  </div>
                </div>
              </section>

              <section
                className="donor-crm-stats-bar donor-crm-stats-bar--in-info"
                aria-label="Donation summary"
                aria-hidden={!infoExpanded}
              >
                  <div className="donor-crm-stat">
                    <span className="donor-crm-stat__icon donor-crm-stat__icon--blue">
                      <FiLayers />
                    </span>
                    <div className="donor-crm-stat__body">
                      <span className="donor-crm-stat__label">Total Donations</span>
                      <span className="donor-crm-stat__value">
                        {Number(stats.total_donations || 0).toLocaleString('en-US')}
                      </span>
                    </div>
                  </div>
                  <div className="donor-crm-stat">
                    <span className="donor-crm-stat__icon donor-crm-stat__icon--green">
                      <GiPayMoney />
                    </span>
                    <div className="donor-crm-stat__body">
                      <span className="donor-crm-stat__label">Total Donated</span>
                      <span className="donor-crm-stat__value">
                        {formatMoney(stats.total_donated, currency)}
                      </span>
                    </div>
                  </div>
                  <div className="donor-crm-stat">
                    <span className="donor-crm-stat__icon donor-crm-stat__icon--mint">
                      <FiCalendar />
                    </span>
                    <div className="donor-crm-stat__body">
                      <span className="donor-crm-stat__label">Last Donation</span>
                      <span className="donor-crm-stat__value donor-crm-stat__value--sm">
                        {stats.last_donation
                          ? `${formatShortDate(stats.last_donation.date)}, ${formatMoney(
                              stats.last_donation.amount,
                              stats.last_donation.currency || currency,
                            )}`
                          : '—'}
                      </span>
                    </div>
                  </div>
                  <div className="donor-crm-stat">
                    <span className="donor-crm-stat__icon donor-crm-stat__icon--purple">
                      <FiCalendar />
                    </span>
                    <div className="donor-crm-stat__body">
                      <span className="donor-crm-stat__label">First Donation</span>
                      <span className="donor-crm-stat__value donor-crm-stat__value--sm">
                        {stats.first_donation?.date
                          ? formatShortDate(stats.first_donation.date)
                          : '—'}
                      </span>
                    </div>
                  </div>
                  <div className="donor-crm-stat">
                    <span
                      className={`donor-crm-stat__icon ${
                        recurringActive
                          ? 'donor-crm-stat__icon--green'
                          : 'donor-crm-stat__icon--muted'
                      }`}
                    >
                      <FiRefreshCw />
                    </span>
                    <div className="donor-crm-stat__body">
                      <span className="donor-crm-stat__label">Recurring Status</span>
                      <span
                        className={`donor-crm-stat__value ${
                          recurringActive
                            ? 'donor-profile-stat__value--active'
                            : 'donor-profile-stat__value--inactive'
                        }`}
                      >
                        {recurringActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </section>

              <section className="donor-crm-card">
                <h3 className="donor-crm-card__title">Quick Actions</h3>
                <div className="donor-crm-quick-actions">
                  <button type="button" onClick={handleQuickCall} disabled={!donor.phone}>
                    <span className="donor-crm-quick-actions__icon donor-crm-quick-actions__icon--call">
                      <FiPhone />
                    </span>
                    Call
                  </button>
                  <button type="button" onClick={handleQuickEmail} disabled={!donor.email}>
                    <span className="donor-crm-quick-actions__icon donor-crm-quick-actions__icon--email">
                      <FiMail />
                    </span>
                    Email
                  </button>
                  <button type="button" onClick={handleQuickWhatsApp} disabled={!donor.phone}>
                    <span className="donor-crm-quick-actions__icon donor-crm-quick-actions__icon--wa">
                      <FiMessageSquare />
                    </span>
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={handleLogInteraction}
                    disabled={!showDonorJourney}
                  >
                    <span className="donor-crm-quick-actions__icon donor-crm-quick-actions__icon--note">
                      <FiFileText />
                    </span>
                    Add Note
                  </button>
                </div>
              </section>
            </aside>
            ) : null}

            <div className="donor-crm-main" aria-hidden={infoExpanded}>
              <section className="donor-crm-stats-bar" aria-label="Donation summary">
                <div className="donor-crm-stat">
                  <span className="donor-crm-stat__icon donor-crm-stat__icon--blue">
                    <FiLayers />
                  </span>
                  <div className="donor-crm-stat__body">
                    <span className="donor-crm-stat__label">Total Donations</span>
                    <span className="donor-crm-stat__value">
                      {Number(stats.total_donations || 0).toLocaleString('en-US')}
                    </span>
                  </div>
                </div>
                <div className="donor-crm-stat">
                  <span className="donor-crm-stat__icon donor-crm-stat__icon--green">
                    <GiPayMoney />
                  </span>
                  <div className="donor-crm-stat__body">
                    <span className="donor-crm-stat__label">Total Donated</span>
                    <span className="donor-crm-stat__value">
                      {formatMoney(stats.total_donated, currency)}
                    </span>
                  </div>
                </div>
                <div className="donor-crm-stat">
                  <span className="donor-crm-stat__icon donor-crm-stat__icon--mint">
                    <FiCalendar />
                  </span>
                  <div className="donor-crm-stat__body">
                    <span className="donor-crm-stat__label">Last Donation</span>
                    <span className="donor-crm-stat__value donor-crm-stat__value--sm">
                      {stats.last_donation
                        ? `${formatShortDate(stats.last_donation.date)}, ${formatMoney(
                            stats.last_donation.amount,
                            stats.last_donation.currency || currency,
                          )}`
                        : '—'}
                    </span>
                  </div>
                </div>
                <div className="donor-crm-stat">
                  <span className="donor-crm-stat__icon donor-crm-stat__icon--purple">
                    <FiCalendar />
                  </span>
                  <div className="donor-crm-stat__body">
                    <span className="donor-crm-stat__label">First Donation</span>
                    <span className="donor-crm-stat__value donor-crm-stat__value--sm">
                      {stats.first_donation?.date
                        ? formatShortDate(stats.first_donation.date)
                        : '—'}
                    </span>
                  </div>
                </div>
                <div className="donor-crm-stat">
                  <span
                    className={`donor-crm-stat__icon ${
                      recurringActive
                        ? 'donor-crm-stat__icon--green'
                        : 'donor-crm-stat__icon--muted'
                    }`}
                  >
                    <FiRefreshCw />
                  </span>
                  <div className="donor-crm-stat__body">
                    <span className="donor-crm-stat__label">Recurring Status</span>
                    <span
                      className={`donor-crm-stat__value ${
                        recurringActive
                          ? 'donor-profile-stat__value--active'
                          : 'donor-profile-stat__value--inactive'
                      }`}
                    >
                      {recurringActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </section>

              {/* <ManualRecurringDonorPanel donorId={id} onUpdated={fetchDonor} /> */}

              <DonorPipelinePanel
                donorId={id}
                currentStage={
                  donor.effective_pipeline_stage ||
                  resolveDonorPipelineStage(donor.pipeline_stage)
                }
                askAmount={donor.pipeline_ask_amount}
                pledgeAmount={donor.pipeline_pledge_amount}
                amountCurrency={donor.pipeline_amount_currency || 'PKR'}
                canUpdate={canUpdatePipeline}
                onStageChanged={(updated) => {
                  if (updated) setDonor(updated);
                  else fetchDonor();
                }}
              />

              {showDonorJourney ? (
                <DonorCommunication donorId={id} donor={donor} />
              ) : (
                <div className="donor-journey-panel">
                  <h3 className="donor-journey-panel__title">Donor Relationship Journey</h3>
                  <p className="donor-journey-empty">
                    You do not have access to view relationship interactions for this donor.
                  </p>
                </div>
              )}

              <section className="donor-crm-card donor-crm-history donor-profile-history">
                <div className="donor-crm-history__header">
                  <span className="donor-profile-section__icon">
                    <FiClock />
                  </span>
                  <h3 className="donor-crm-card__title" style={{ margin: 0 }}>
                    Change History
                  </h3>
                </div>
                <DonorAuditHistory donorId={id} />
              </section>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={revealModalOpen}
        onClose={closeRevealModal}
        title={`Donor Password — ${donor?.name || donor?.email || 'Donor'}`}
        details={{
          Status: revealLoading ? 'Loading...' : revealError ? 'Error' : 'Success',
          ...(revealError ? { Message: revealError } : {}),
          ...(revealedPassword ? { Password: revealedPassword } : {}),
          Note: 'Password is shown for operational use only. Close this dialog when done.',
        }}
      />
    </>
  );
};

export default ViewDonor;
