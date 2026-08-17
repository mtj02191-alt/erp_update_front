import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  FiEdit,
  FiPlus,
  FiTrash2,
  FiMail,
  FiPhone,
  FiMapPin,
  FiUser,
  FiMaximize2,
  FiMinimize2,
  FiMinus,
  FiSidebar,
  FiList,
  FiLayers,
  FiCalendar,
  FiRefreshCw,
  FiClock,
  FiFileText,
  FiGitBranch,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { BsFillBuildingsFill } from 'react-icons/bs';
import { GiPayMoney } from 'react-icons/gi';
import axiosInstance from '../../../../utils/axios';
import { useAuth } from '../../../../context/AuthContext';
import {
  canViewModule,
  fundRaisingDonorsHas,
  hasModuleAccess,
  hasPermissionByPath,
} from '../../../../utils/permissions';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import ConfirmationModal from '../../../common/ConfirmationModal';
import DonorAuditHistory from '../../donors/shared/DonorAuditHistory';
import DonorPipelinePanel from '../../donors/shared/DonorPipelinePanel';
import DonorCommunication from '../../donor_relationship/shared/DonorCommunication';
import ManualRecurringDonorPanel from '../../manual_recurring/ManualRecurringDonorPanel';
import { formatAuditActor } from '../../../common/audit/auditHistoryLabels';
import {
  formatPipelineStage,
  resolveDonorPipelineStage,
} from '../../donors/shared/donorPipelineConstants';
import '../../donor_relationship/donor-relationship.css';
import '../../donors/view/index.css';
import './index.css';

const emptyBranchForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  country: '',
  parent_branch_id: '',
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

const formatMoney = (amount, currency) => {
  const code = (currency || 'PKR').toUpperCase();
  const n = Number(amount || 0);
  return `${code} ${n.toLocaleString('en-US')}`;
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
};

const ViewOrganization = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { permissions, user } = useAuth();

  const canUpdate =
    hasPermissionByPath(permissions, 'fund_raising.organizations.update') ||
    permissions?.super_admin ||
    permissions?.fund_raising_manager;
  const canCreate =
    hasPermissionByPath(permissions, 'fund_raising.organizations.create') ||
    canUpdate;
  const canDelete =
    hasPermissionByPath(permissions, 'fund_raising.organizations.delete') ||
    canUpdate;
  const canUpdatePipeline =
    permissions?.super_admin === true ||
    permissions?.fund_raising_manager === true ||
    fundRaisingDonorsHas(permissions, 'update');

  const [org, setOrg] = useState(null);
  const [people, setPeople] = useState([]);
  const [peopleSearch, setPeopleSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [asideHidden, setAsideHidden] = useState(false);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [branchForm, setBranchForm] = useState(emptyBranchForm);
  const [savingBranch, setSavingBranch] = useState(false);
  const [branchError, setBranchError] = useState('');
  const [deleteBranch, setDeleteBranch] = useState(null);

  const selectedDonorId = searchParams.get('person') || '';
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [donorLoading, setDonorLoading] = useState(false);
  const [donorError, setDonorError] = useState('');

  const showDonorJourney = useMemo(() => {
    if (!selectedDonor || !permissions) return false;
    if (permissions.super_admin || permissions.fund_raising_manager) return true;
    if (hasModuleAccess(permissions, 'fund_raising', 'donor_relationship')) return true;
    if (canViewModule(permissions, 'fund_raising', 'donor_relationship')) return true;
    const assigned = selectedDonor.assigned_to;
    const assignedId = typeof assigned === 'object' ? assigned?.id : assigned;
    return !!(user?.id && assignedId && Number(assignedId) === Number(user.id));
  }, [selectedDonor, permissions, user]);

  const loadOrg = async () => {
    try {
      setLoading(true);
      setError('');
      const [orgRes, peopleRes] = await Promise.all([
        axiosInstance.get(`/organizations/${id}`),
        axiosInstance.get(`/organizations/${id}/people`),
      ]);
      setOrg(orgRes.data?.data || null);
      const list = peopleRes.data?.data || [];
      setPeople(list);

      const currentPerson = searchParams.get('person');
      if (!currentPerson && list.length > 0 && list[0]?.donor?.id) {
        setSearchParams({ person: String(list[0].donor.id) }, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load organization');
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedDonor = async (donorId) => {
    if (!donorId) {
      setSelectedDonor(null);
      return;
    }
    try {
      setDonorLoading(true);
      setDonorError('');
      const res = await axiosInstance.get(`/donors/${donorId}`);
      if (res.data?.success) {
        setSelectedDonor(res.data.data);
      } else {
        setDonorError('Failed to load person details');
        setSelectedDonor(null);
      }
    } catch (err) {
      setDonorError(err.response?.data?.message || 'Failed to load person details');
      setSelectedDonor(null);
    } finally {
      setDonorLoading(false);
    }
  };

  useEffect(() => {
    loadOrg();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    loadSelectedDonor(selectedDonorId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDonorId]);

  const filteredPeople = useMemo(() => {
    const q = peopleSearch.trim().toLowerCase();
    if (!q) return people;
    return people.filter((p) => {
      const d = p.donor || {};
      const hay = [d.name, d.email, d.phone, p.role, p.branch?.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [people, peopleSearch]);

  const selectPerson = (donorId) => {
    setSearchParams({ person: String(donorId) });
  };

  const handleBranchChange = (e) => {
    setBranchForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (branchError) setBranchError('');
  };

  const handleAddBranch = async (e) => {
    e.preventDefault();
    if (!branchForm.name.trim()) {
      setBranchError('Branch name is required');
      return;
    }
    setSavingBranch(true);
    setBranchError('');
    try {
      await axiosInstance.post(`/organizations/${id}/branches`, {
        name: branchForm.name.trim(),
        phone: branchForm.phone || undefined,
        email: branchForm.email || undefined,
        address: branchForm.address || undefined,
        city: branchForm.city || undefined,
        country: branchForm.country || undefined,
        parent_branch_id: branchForm.parent_branch_id
          ? Number(branchForm.parent_branch_id)
          : undefined,
      });
      setBranchForm(emptyBranchForm);
      setShowBranchForm(false);
      await loadOrg();
    } catch (err) {
      setBranchError(err.response?.data?.message || 'Failed to add branch');
    } finally {
      setSavingBranch(false);
    }
  };

  const handleConfirmDeleteBranch = async () => {
    if (!deleteBranch) return;
    try {
      await axiosInstance.delete(`/organizations/${id}/branches/${deleteBranch.id}`);
      setDeleteBranch(null);
      await loadOrg();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to archive branch');
      setDeleteBranch(null);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading organization...</p>
          </div>
        </div>
      </>
    );
  }

  if (error && !org) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="error-container">
            <div className="status-message status-message--error">{error}</div>
            <button className="primary_btn" onClick={() => navigate('/dms/organizations/list')}>
              Back to Organizations
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!org) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="error-container">
            <div className="status-message status-message--error">Organization not found</div>
            <button className="primary_btn" onClick={() => navigate('/dms/organizations/list')}>
              Back to Organizations
            </button>
          </div>
        </div>
      </>
    );
  }

  const tree = org.branch_tree || [];
  const addressText = [org.address, org.city, org.country].filter(Boolean).join(', ');
  const donor = selectedDonor;
  const stats = donor
    ? {
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
      }
    : null;
  const currency = stats?.currency || 'PKR';
  const recurringActive = !!donor?.recurring;
  const selectedAffiliation = people.find(
    (p) => String(p.donor?.id) === String(selectedDonorId),
  );

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          title="Organization Details"
          onBack={() => navigate('/dms/organizations/list')}
          showAdd={false}
        />

        <div className="list-content donor-profile-page org-crm-page">
          {error && (
            <div className="status-message status-message--error" style={{ marginBottom: 12 }}>
              {error}
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
                title="Show organization profile"
                aria-label="Show organization profile"
              >
                <FiSidebar />
                {/* <span>Show profile</span> */}
              </button>
            ) : null}

            {!asideHidden ? (
            <aside className="donor-crm-aside">
              <section className="donor-crm-card donor-crm-identity">
                <div className="donor-crm-identity__top">
                  <span className="donor-crm-identity__eyebrow">Organization Profile</span>
                  <div className="donor-crm-identity__top-actions">
                    <button
                      type="button"
                      className="donor-crm-expand-btn"
                      onClick={() => setInfoExpanded((v) => !v)}
                      title={infoExpanded ? 'Collapse' : 'Expand'}
                      aria-label={infoExpanded ? 'Collapse organization info' : 'Expand organization info'}
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
                      title="Hide organization profile"
                      aria-label="Hide organization profile"
                    >
                      <FiMinus />
                      <span>Hide</span>
                    </button>
                  </div>
                </div>

                <div className="donor-crm-identity__hero">
                  <div className="donor-crm-identity__avatar" aria-hidden="true">
                    {getInitials(org.name)}
                    <span className="donor-crm-identity__heart">
                      <BsFillBuildingsFill />
                    </span>
                  </div>
                  <div className="donor-crm-identity__intro">
                    <h2 className="donor-crm-identity__name">{org.name}</h2>
                    <span className="donor-profile-type-badge donor-profile-type-badge--csr">
                      <BsFillBuildingsFill />
                      Organization
                    </span>
                  </div>
                </div>

                <ul className="donor-crm-contact-list">
                  <li>
                    <FiMail />
                    <span className="donor-crm-contact-list__value">{org.email || 'Not provided'}</span>
                  </li>
                  <li>
                    <FiPhone />
                    <span className="donor-crm-contact-list__value">{org.phone || 'Not provided'}</span>
                  </li>
                  <li>
                    <FiMapPin />
                    <span className="donor-crm-contact-list__value">{addressText || 'Not provided'}</span>
                  </li>
                </ul>

                <div className="donor-crm-profile-actions">
                  {canUpdate && (
                    <button
                      type="button"
                      className="donor-profile-btn donor-profile-btn--edit"
                      onClick={() => navigate(`/dms/organizations/edit/${id}`)}
                    >
                      <FiEdit />
                      Edit Org
                    </button>
                  )}
                  <button
                    type="button"
                    className="donor-profile-btn donor-profile-btn--add-donation"
                    onClick={() =>
                      navigate(`/dms/donors/add?organization_id=${id}&donor_type=csr`)
                    }
                  >
                    <FiPlus />
                    Add Person
                  </button>
                </div>
              </section>

              <section className="donor-crm-card">
                <h3 className="donor-crm-card__title">Organization Summary</h3>
                <div className="donor-crm-summary-list">
                  <div className="donor-crm-summary-row">
                    <span>Registration</span>
                    <strong>{org.registration_number || '—'}</strong>
                  </div>
                  <div className="donor-crm-summary-row">
                    <span>City</span>
                    <strong>{org.city || '—'}</strong>
                  </div>
                  <div className="donor-crm-summary-row">
                    <span>Country</span>
                    <strong>{org.country || '—'}</strong>
                  </div>
                  <div className="donor-crm-summary-row">
                    <span>Status</span>
                    <strong>
                      <span
                        className={`donor-crm-pill ${
                          org.is_active === false
                            ? 'donor-crm-pill--muted'
                            : 'donor-crm-pill--success'
                        }`}
                      >
                        {org.is_active === false ? 'Inactive' : 'Active'}
                      </span>
                    </strong>
                  </div>
                  <div className="donor-crm-summary-row">
                    <span>People</span>
                    <strong>{people.length}</strong>
                  </div>
                  <div className="donor-crm-summary-row">
                    <span>Branches</span>
                    <strong>{tree.length}</strong>
                  </div>
                  {org.notes && (
                    <div className="donor-crm-summary-row donor-crm-summary-row--block">
                      <span>Notes</span>
                      <strong>{org.notes}</strong>
                    </div>
                  )}
                </div>
              </section>

              <section className="donor-crm-card org-people-card">
                <h3 className="donor-crm-card__title">People / Leads</h3>
                <input
                  type="search"
                  className="form-control org-people-search"
                  placeholder="Search people..."
                  value={peopleSearch}
                  onChange={(e) => setPeopleSearch(e.target.value)}
                />
                {filteredPeople.length === 0 ? (
                  <p className="org-people-empty">No people linked to this organization yet.</p>
                ) : (
                  <ul className="org-people-list">
                    {filteredPeople.map((row) => {
                      const d = row.donor || {};
                      const active = String(d.id) === String(selectedDonorId);
                      const stage = formatPipelineStage(
                        d.effective_pipeline_stage || d.pipeline_stage,
                      );
                      return (
                        <li key={row.affiliation_id}>
                          <button
                            type="button"
                            className={`org-people-item${active ? ' org-people-item--active' : ''}`}
                            onClick={() => selectPerson(d.id)}
                          >
                            <span className="org-people-item__avatar" aria-hidden="true">
                              {getInitials(d.name)}
                            </span>
                            <span className="org-people-item__body">
                              <strong>{d.name || d.email || `Donor #${d.id}`}</strong>
                              <span>
                                {(row.role || 'contact').replace(/_/g, ' ')}
                                {row.branch?.name ? ` · ${row.branch.name}` : ''}
                              </span>
                              <span className="org-people-item__stage">{stage}</span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section className="donor-crm-card">
                <div className="org-branch-header">
                  <h3 className="donor-crm-card__title" style={{ margin: 0 }}>
                    Branches
                  </h3>
                  {canCreate && (
                    <button
                      type="button"
                      className="donor-profile-btn donor-profile-btn--edit"
                      onClick={() => setShowBranchForm((v) => !v)}
                    >
                      <FiPlus />
                      {showBranchForm ? 'Close' : 'Add'}
                    </button>
                  )}
                </div>
                <p className="org-view-hint">Organization → Branch → Sub-branch</p>

                {tree.length === 0 ? (
                  <p className="org-people-empty">No branches yet.</p>
                ) : (
                  <ul className="org-branch-tree">
                    {tree.map((branch) => (
                      <li key={branch.id} className="org-branch-tree__branch">
                        <div className="org-branch-tree__row">
                          <div>
                            <strong>{branch.name}</strong>
                            <span className="org-branch-tree__meta">
                              {[branch.city, branch.phone].filter(Boolean).join(' · ') || 'Branch'}
                            </span>
                          </div>
                          {canDelete && (
                            <button
                              type="button"
                              className="icon-btn danger"
                              title="Archive branch"
                              onClick={() => setDeleteBranch(branch)}
                            >
                              <FiTrash2 />
                            </button>
                          )}
                        </div>
                        {(branch.sub_branches || []).length > 0 && (
                          <ul className="org-branch-tree__subs">
                            {branch.sub_branches.map((sub) => (
                              <li key={sub.id}>
                                <div className="org-branch-tree__row">
                                  <div>
                                    <strong>{sub.name}</strong>
                                    <span className="org-branch-tree__meta">
                                      {[sub.city, sub.phone].filter(Boolean).join(' · ') ||
                                        'Sub-branch'}
                                    </span>
                                  </div>
                                  {canDelete && (
                                    <button
                                      type="button"
                                      className="icon-btn danger"
                                      title="Archive sub-branch"
                                      onClick={() => setDeleteBranch(sub)}
                                    >
                                      <FiTrash2 />
                                    </button>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {showBranchForm && canCreate && (
                  <form onSubmit={handleAddBranch} className="form org-branch-form">
                    {branchError && (
                      <div className="status-message status-message--error">{branchError}</div>
                    )}
                    <FormInput
                      label="Name"
                      name="name"
                      value={branchForm.name}
                      onChange={handleBranchChange}
                      required
                    />
                    <div className="form-group">
                      <label htmlFor="parent_branch_id">Parent branch</label>
                      <select
                        id="parent_branch_id"
                        name="parent_branch_id"
                        className="form-control"
                        value={branchForm.parent_branch_id}
                        onChange={handleBranchChange}
                      >
                        <option value="">— Top-level branch —</option>
                        {tree.map((b) => (
                          <option key={b.id} value={b.id}>
                            Sub-branch under: {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <FormInput
                      label="Phone"
                      name="phone"
                      value={branchForm.phone}
                      onChange={handleBranchChange}
                    />
                    <FormInput
                      label="City"
                      name="city"
                      value={branchForm.city}
                      onChange={handleBranchChange}
                    />
                    <button type="submit" className="primary_btn" disabled={savingBranch}>
                      {savingBranch ? 'Saving...' : 'Save Branch'}
                    </button>
                  </form>
                )}
              </section>
            </aside>
            ) : null}

            <div className="donor-crm-main" aria-hidden={infoExpanded}>
              {!selectedDonorId ? (
                <section className="donor-crm-card">
                  <h3 className="donor-crm-card__title">Select a person</h3>
                  <p className="org-people-empty">
                    Choose someone from the People / Leads list to view interactions, pipeline,
                    donations history, and full donor details.
                  </p>
                </section>
              ) : donorLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading person details...</p>
                </div>
              ) : donorError || !donor ? (
                <section className="donor-crm-card">
                  <div className="status-message status-message--error">
                    {donorError || 'Person not found'}
                  </div>
                </section>
              ) : (
                <>
                  <section className="donor-crm-card org-selected-person-banner">
                    <div className="org-selected-person-banner__left">
                      <span className="org-people-item__avatar" aria-hidden="true">
                        {getInitials(donor.name)}
                      </span>
                      <div>
                        <h2>{donor.name || donor.email}</h2>
                        <p>
                          {(selectedAffiliation?.role || 'contact').replace(/_/g, ' ')}
                          {selectedAffiliation?.branch?.name
                            ? ` · ${selectedAffiliation.branch.name}`
                            : ''}
                          {' · '}
                          {donor.donor_type === 'csr' ? 'CSR' : 'Individual'}
                          {' · '}
                          <FiGitBranch style={{ verticalAlign: 'middle' }} />{' '}
                          {formatPipelineStage(
                            donor.effective_pipeline_stage || donor.pipeline_stage,
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="org-selected-person-banner__actions">
                      <button
                        type="button"
                        className="donor-profile-btn donor-profile-btn--edit"
                        onClick={() => navigate(`/dms/donors/edit/${donor.id}`)}
                      >
                        <FiEdit />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="donor-profile-btn donor-profile-btn--donations"
                        onClick={() => navigate(`/dms/donors/${donor.id}/donations`)}
                      >
                        <FiList />
                        Donations
                      </button>
                      <button
                        type="button"
                        className="donor-profile-btn donor-profile-btn--add-donation"
                        onClick={() =>
                          navigate(`/donations/online_donations/add?donor_id=${donor.id}`)
                        }
                      >
                        <FiPlus />
                        Add Donation
                      </button>
                      <button
                        type="button"
                        className="donor-profile-btn donor-profile-btn--email"
                        onClick={() =>
                          navigate(`/dms/donor-relationship/add?donor_id=${donor.id}`)
                        }
                        disabled={!showDonorJourney}
                      >
                        <FiFileText />
                        Log Interaction
                      </button>
                      <button
                        type="button"
                        className="donor-profile-btn"
                        onClick={() => navigate(`/dms/donors/view/${donor.id}`)}
                      >
                        <FiUser />
                        Full Donor View
                      </button>
                    </div>
                  </section>

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

                  <section className="donor-crm-card org-person-summary">
                    <div className="org-person-summary__header">
                      <span className="org-person-summary__header-icon" aria-hidden="true">
                        <FiUser />
                      </span>
                      <h3 className="org-person-summary__title">Person Summary</h3>
                      <div className="org-person-summary__header-actions">
                        <button
                          type="button"
                          className="org-person-summary__icon-btn"
                          title="Call"
                          aria-label="Call"
                          onClick={() => {
                            if (donor.phone) {
                              window.location.href = `tel:${String(donor.phone).replace(/\s+/g, '')}`;
                            }
                          }}
                          disabled={!donor.phone}
                        >
                          <FiPhone />
                        </button>
                        <button
                          type="button"
                          className="org-person-summary__icon-btn"
                          title="Email"
                          aria-label="Email"
                          onClick={() => {
                            if (donor.email) window.location.href = `mailto:${donor.email}`;
                          }}
                          disabled={!donor.email}
                        >
                          <FiMail />
                        </button>
                        <button
                          type="button"
                          className="org-person-summary__icon-btn org-person-summary__icon-btn--whatsapp"
                          title="WhatsApp"
                          aria-label="WhatsApp"
                          onClick={() => {
                            const digits = String(donor.phone || '').replace(/\D/g, '');
                            if (digits) {
                              window.open(`https://wa.me/${digits}`, '_blank', 'noopener,noreferrer');
                            }
                          }}
                          disabled={!donor.phone}
                        >
                          <FaWhatsapp />
                        </button>
                      </div>
                    </div>

                    <div className="org-person-summary__grid">
                      <div className="org-person-summary__tile">
                        <span className="org-person-summary__tile-label">Email</span>
                        <strong className="org-person-summary__tile-value" title={donor.email || ''}>
                          {donor.email || '—'}
                        </strong>
                      </div>
                      <div className="org-person-summary__tile">
                        <span className="org-person-summary__tile-label">Phone</span>
                        <strong className="org-person-summary__tile-value">
                          {donor.phone || '—'}
                        </strong>
                      </div>
                      <div className="org-person-summary__tile">
                        <span className="org-person-summary__tile-label">Assigned To</span>
                        <strong className="org-person-summary__tile-value">
                          {donor.assigned_to ? formatAuditActor(donor.assigned_to) : 'Unassigned'}
                        </strong>
                      </div>
                      <div className="org-person-summary__tile">
                        <span className="org-person-summary__tile-label">Status</span>
                        <strong className="org-person-summary__tile-value">
                          <span
                            className={`org-person-summary__status-pill ${
                              donor.is_active === false
                                ? 'org-person-summary__status-pill--inactive'
                                : 'org-person-summary__status-pill--active'
                            }`}
                          >
                            <span className="org-person-summary__status-pill-dot" />
                            {donor.is_active === false ? 'Inactive' : 'Active'}
                          </span>
                        </strong>
                      </div>
                      <div className="org-person-summary__tile org-person-summary__tile--notes">
                        <span className="org-person-summary__tile-label">Notes</span>
                        <strong
                          className="org-person-summary__tile-value"
                          title={donor.notes || ''}
                        >
                          {donor.notes || '—'}
                        </strong>
                      </div>
                    </div>
                  </section>

                  {/* <ManualRecurringDonorPanel
                    donorId={donor.id}
                    onUpdated={() => loadSelectedDonor(donor.id)}
                  /> */}

                  <DonorPipelinePanel
                    donorId={donor.id}
                    currentStage={
                      donor.effective_pipeline_stage ||
                      resolveDonorPipelineStage(donor.pipeline_stage)
                    }
                    askAmount={donor.pipeline_ask_amount}
                    pledgeAmount={donor.pipeline_pledge_amount}
                    amountCurrency={donor.pipeline_amount_currency || 'PKR'}
                    canUpdate={canUpdatePipeline}
                    onStageChanged={(updated) => {
                      if (updated) setSelectedDonor(updated);
                      else loadSelectedDonor(donor.id);
                    }}
                  />

                  {showDonorJourney ? (
                    <DonorCommunication donorId={donor.id} donor={donor} />
                  ) : (
                    <div className="donor-journey-panel">
                      <h3 className="donor-journey-panel__title">Donor Relationship Journey</h3>
                      <p className="donor-journey-empty">
                        You do not have access to view relationship interactions for this person.
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
                    <DonorAuditHistory donorId={donor.id} />
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!deleteBranch}
        text={`Archive "${deleteBranch?.name || ''}"${
          deleteBranch?.parent_branch_id ? '' : ' and its sub-branches'
        }?`}
        onConfirm={handleConfirmDeleteBranch}
        onCancel={() => setDeleteBranch(null)}
      />
    </>
  );
};

export default ViewOrganization;
