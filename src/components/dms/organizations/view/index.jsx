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
  FiClock,
} from 'react-icons/fi';
import { BsFillBuildingsFill } from 'react-icons/bs';
import { FaWhatsapp } from 'react-icons/fa';
import axiosInstance from '../../../../utils/axios';
import { useAuth } from '../../../../context/AuthContext';
import {
  canViewModule,
  fundRaisingOrganizationsOrPocsHas,
  hasModuleAccess,
} from '../../../../utils/permissions';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import ConfirmationModal from '../../../common/ConfirmationModal';
import DonorAuditHistory from '../../donors/shared/DonorAuditHistory';
import DonorPipelinePanel from '../../donors/shared/DonorPipelinePanel';
import DonorCommunication from '../../donor_relationship/shared/DonorCommunication';
import { OnlineDonationsList } from '../../donations/online_donations';
import AddDonation from '../../../donations/online_donations/add';
import EditOrganization from '../edit';
import ViewDonor from '../../donors/view';
import AddDonorInteraction from '../../donor_relationship/add';
import {
  resolveDonorPipelineStage,
} from '../../donors/shared/donorPipelineConstants';
import { formatAuditActor } from '../../../common/audit/auditHistoryLabels';
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

const emptyPocForm = {
  name: '',
  email: '',
  phone: '',
  cnic: '',
  role: 'contact',
  branch_id: '',
  is_primary: false,
  notes: '',
};

const POC_ROLE_OPTIONS = [
  { value: 'contact', label: 'Contact' },
  { value: 'ceo', label: 'CEO' },
  { value: 'cfo', label: 'CFO' },
  { value: 'csr_head', label: 'CSR Head' },
  { value: 'branch_manager', label: 'Branch Manager' },
  { value: 'other', label: 'Other' },
];

const getInitials = (name) => {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
};

const formatPocRole = (role) =>
  POC_ROLE_OPTIONS.find((o) => o.value === role)?.label ||
  String(role || 'contact').replace(/_/g, ' ');

const normalizeWhatsAppPhone = (phone) =>
  String(phone || '').replace(/[^\d]/g, '');

const ViewOrganization = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { permissions } = useAuth();

  const canUpdate =
    fundRaisingOrganizationsOrPocsHas(permissions, 'update') ||
    permissions?.super_admin ||
    permissions?.fund_raising_manager;
  const canCreate =
    fundRaisingOrganizationsOrPocsHas(permissions, 'create') ||
    fundRaisingOrganizationsOrPocsHas(permissions, 'update') ||
    canUpdate;
  const canDelete =
    fundRaisingOrganizationsOrPocsHas(permissions, 'delete') ||
    fundRaisingOrganizationsOrPocsHas(permissions, 'update') ||
    canUpdate;
  const [org, setOrg] = useState(null);
  const [people, setPeople] = useState([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [asideHidden, setAsideHidden] = useState(false);
  const [mainTab, setMainTab] = useState('overview'); // overview | poc | donations | edit-org | add-donation | add-poc | edit-poc | legacy | add-note
  const [legacyTabDonorId, setLegacyTabDonorId] = useState(null);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [branchForm, setBranchForm] = useState(emptyBranchForm);
  const [savingBranch, setSavingBranch] = useState(false);
  const [branchError, setBranchError] = useState('');
  const [deleteBranch, setDeleteBranch] = useState(null);
  const [editingPoc, setEditingPoc] = useState(null);
  const [pocForm, setPocForm] = useState(emptyPocForm);
  const [savingPoc, setSavingPoc] = useState(false);
  const [pocError, setPocError] = useState('');

  const selectedPocId = searchParams.get('person') || '';

  const getPocRow = (row) => row?.poc || row;

  const selectedPocEntry = useMemo(() => {
    if (!selectedPocId) return null;
    return (
      people.find((row) => String(getPocRow(row).id) === String(selectedPocId)) ||
      null
    );
  }, [people, selectedPocId]);

  const selectedPoc = selectedPocEntry ? getPocRow(selectedPocEntry) : null;
  const legacyDonorId = selectedPoc?.legacy_donor_id ?? null;
  const selectedPocBranch =
    selectedPocEntry?.branch || selectedPoc?.branch || null;
  const selectedPocRole = selectedPocEntry?.role || selectedPoc?.role || 'contact';
  const selectedPocIsPrimary =
    selectedPocEntry?.is_primary ?? selectedPoc?.is_primary ?? false;

  const showOrgJourney = useMemo(() => {
    if (!org || !permissions) return false;
    if (permissions.super_admin || permissions.fund_raising_manager) return true;
    if (hasModuleAccess(permissions, 'fund_raising', 'donor_relationship')) return true;
    if (canViewModule(permissions, 'fund_raising', 'donor_relationship')) return true;
    return fundRaisingOrganizationsOrPocsHas(permissions, 'view');
  }, [org, permissions]);

  const canUpdatePipeline =
    permissions?.super_admin === true ||
    permissions?.fund_raising_manager === true ||
    fundRaisingOrganizationsOrPocsHas(permissions, 'update');

  const [loading, setLoading] = useState(true);

  const loadPeople = async () => {
    try {
      setPeopleLoading(true);
      const res = await axiosInstance.get(`/csr-donors/${id}/pocs`, {
        params: { page: 1, pageSize: 200 },
      });
      const list = res.data?.data || [];
      setPeople(list);
      return list;
    } finally {
      setPeopleLoading(false);
    }
  };

  const loadOrg = async () => {
    try {
      setLoading(true);
      setError('');
      const orgRes = await axiosInstance.get(`/csr-donors/${id}`);
      setOrg(orgRes.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load CSR donor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    loadOrg();
    loadPeople();
    setMainTab(searchParams.get('person') ? 'poc' : 'overview');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (searchParams.get('addPoc') === '1' && canCreate) {
      openAddPocForm();
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('addPoc');
        return next;
      }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const selectPerson = (pocId) => {
    if (String(pocId) === String(selectedPocId)) {
      setSearchParams({});
      return;
    }
    setSearchParams({ person: String(pocId) });
    setMainTab('poc');
  };

  const clearPersonSelection = () => {
    setSearchParams({});
    setMainTab('poc');
  };

  const openAddPocForm = () => {
    setEditingPoc(null);
    setPocForm(emptyPocForm);
    setPocError('');
    setMainTab('add-poc');
  };

  const openEditPocForm = () => {
    if (!selectedPoc) return;
    setEditingPoc(selectedPoc);
    setPocForm({
      name: selectedPoc.name || '',
      email: selectedPoc.email || '',
      phone: selectedPoc.phone || '',
      cnic: selectedPoc.cnic || '',
      role: selectedPoc.role || 'contact',
      branch_id: selectedPoc.branch_id ? String(selectedPoc.branch_id) : '',
      is_primary: !!selectedPoc.is_primary,
      notes: selectedPoc.notes || '',
    });
    setPocError('');
    setMainTab('edit-poc');
  };

  const openAddDonationTab = () => {
    setMainTab('add-donation');
  };

  const openLegacyTab = (donorId) => {
    if (!donorId) return;
    setLegacyTabDonorId(String(donorId));
    setMainTab('legacy');
  };

  const handlePocChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPocForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (pocError) setPocError('');
  };

  const handleSavePoc = async (e) => {
    e.preventDefault();
    if (!pocForm.name.trim()) {
      setPocError('Name is required');
      return;
    }
    if (!pocForm.email.trim() && !pocForm.phone.trim()) {
      setPocError('Either email or phone is required');
      return;
    }
    setSavingPoc(true);
    setPocError('');
    try {
      const payload = {
        name: pocForm.name.trim(),
        email: pocForm.email.trim() || undefined,
        phone: pocForm.phone.trim() || undefined,
        cnic: pocForm.cnic.trim() || undefined,
        role: pocForm.role,
        branch_id: pocForm.branch_id ? Number(pocForm.branch_id) : undefined,
        is_primary: pocForm.is_primary,
        notes: pocForm.notes.trim() || undefined,
      };
      if (editingPoc?.id) {
        await axiosInstance.patch(`/csr-donors/${id}/pocs/${editingPoc.id}`, payload);
      } else {
        const res = await axiosInstance.post(`/csr-donors/${id}/pocs`, payload);
        const newId = res.data?.data?.id;
        if (newId) {
          setSearchParams({ person: String(newId) });
        }
      }
      setEditingPoc(null);
      setPocForm(emptyPocForm);
      await loadPeople();
      setMainTab('poc');
    } catch (err) {
      setPocError(err.response?.data?.message || 'Failed to save POC');
    } finally {
      setSavingPoc(false);
    }
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
      await axiosInstance.post(`/csr-donors/${id}/branches`, {
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
      await axiosInstance.delete(`/csr-donors/${id}/branches/${deleteBranch.id}`);
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
            <p>Loading CSR donor...</p>
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
            <button className="primary_btn" onClick={() => navigate('/dms/csr-donors/list')}>
              Back to CSR Donors
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
            <div className="status-message status-message--error">CSR donor not found</div>
            <button className="primary_btn" onClick={() => navigate('/dms/csr-donors/list')}>
              Back to CSR Donors
            </button>
          </div>
        </div>
      </>
    );
  }

  const tree = org.branch_tree || [];
  const addressText = [org.address, org.city, org.country].filter(Boolean).join(', ');

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          title="CSR Donor Details"
          backPath="/dms/csr-donors/list"
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
                  <span className="donor-crm-identity__eyebrow">CSR Donor Profile</span>
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
                      CSR Donor
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
                      onClick={() => setMainTab('edit-org')}
                    >
                      <FiEdit />
                      Edit Org
                    </button>
                  )}
                  <button
                    type="button"
                    className="donor-profile-btn donor-profile-btn--donations"
                    onClick={() => setMainTab('donations')}
                  >
                    <FiList />
                    Donations
                  </button>
                  <button
                    type="button"
                    className="donor-profile-btn donor-profile-btn--add-donation"
                    onClick={openAddDonationTab}
                  >
                    <FiPlus />
                    Add Donation
                  </button>
                  <button
                    type="button"
                    className="donor-profile-btn"
                    onClick={openAddPocForm}
                  >
                    <FiPlus />
                    Add POC
                  </button>
                </div>
              </section>

              <section className="donor-crm-card">
                <h3 className="donor-crm-card__title">CSR Donor Summary</h3>
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
                  <div className="donor-crm-summary-row">
                    <span>Created by</span>
                    <strong>
                      {org.created_by ? formatAuditActor(org.created_by) : '—'}
                    </strong>
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
                <h3 className="donor-crm-card__title">POCs / Contacts</h3>
                {peopleLoading ? (
                  <p className="org-people-empty">Loading POCs...</p>
                ) : people.length === 0 ? (
                  <p className="org-people-empty">No POCs linked yet.</p>
                ) : (
                  <ul className="org-people-list">
                    {people.map((row) => {
                      const pocRow = getPocRow(row);
                      const active = String(pocRow.id) === String(selectedPocId);
                      return (
                        <li key={row.affiliation_id || pocRow.id}>
                          <button
                            type="button"
                            className={`org-people-item${active ? ' org-people-item--active' : ''}`}
                            onClick={() => selectPerson(pocRow.id)}
                          >
                            <span className="org-people-item__avatar" aria-hidden="true">
                              {getInitials(pocRow.name)}
                            </span>
                            <span className="org-people-item__body">
                              <strong>{pocRow.name || pocRow.email || `POC #${pocRow.id}`}</strong>
                              <span>
                                {(row.role || pocRow.role || 'contact').replace(/_/g, ' ')}
                                {(row.branch || pocRow.branch)?.name
                                  ? ` · ${(row.branch || pocRow.branch).name}`
                                  : ''}
                                {(row.is_primary || pocRow.is_primary) ? ' · Primary' : ''}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {selectedPoc ? (
                  <div className="org-poc-sidebar-actions">
                    <p className="org-poc-sidebar-actions__label">
                      {selectedPoc.name || selectedPoc.email}
                    </p>
                    <div className="org-poc-sidebar-actions__buttons">
                      {canUpdate && (
                        <button
                          type="button"
                          className="donor-profile-btn donor-profile-btn--edit"
                          onClick={openEditPocForm}
                        >
                          <FiEdit />
                          Edit
                        </button>
                      )}
                      <button
                        type="button"
                        className="donor-profile-btn donor-profile-btn--add-donation"
                        onClick={openAddDonationTab}
                      >
                        <FiPlus />
                        Donation
                      </button>
                      <button
                        type="button"
                        className="donor-profile-btn donor-profile-btn--donations"
                        onClick={() => setMainTab('donations')}
                      >
                        <FiList />
                        Donations
                      </button>
                      {legacyDonorId ? (
                        <button
                          type="button"
                          className="donor-profile-btn"
                          onClick={() => openLegacyTab(legacyDonorId)}
                        >
                          <FiUser />
                          Legacy
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="donor-profile-btn"
                        onClick={clearPersonSelection}
                      >
                        View all POCs
                      </button>
                    </div>
                  </div>
                ) : null}
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
                <p className="org-view-hint">CSR Donor → Branch → Sub-branch</p>

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
              <div className="donor-profile-tabs" role="tablist" aria-label="CSR donor profile sections">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mainTab === 'overview'}
                  className={`donor-profile-tabs__btn${mainTab === 'overview' ? ' is-active' : ''}`}
                  onClick={() => setMainTab('overview')}
                >
                  Overview
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mainTab === 'poc'}
                  className={`donor-profile-tabs__btn${mainTab === 'poc' ? ' is-active' : ''}`}
                  onClick={() => setMainTab('poc')}
                >
                  {selectedPoc ? 'POC' : 'POCs'}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mainTab === 'donations'}
                  className={`donor-profile-tabs__btn${mainTab === 'donations' ? ' is-active' : ''}`}
                  onClick={() => setMainTab('donations')}
                >
                  Donations
                </button>
                {mainTab === 'edit-org' && (
                  <button
                    type="button"
                    role="tab"
                    aria-selected
                    className="donor-profile-tabs__btn is-active"
                  >
                    Edit Org
                  </button>
                )}
                {mainTab === 'add-donation' && (
                  <button
                    type="button"
                    role="tab"
                    aria-selected
                    className="donor-profile-tabs__btn is-active"
                  >
                    Add Donation
                  </button>
                )}
                {(mainTab === 'add-poc' || mainTab === 'edit-poc') && (
                  <button
                    type="button"
                    role="tab"
                    aria-selected
                    className="donor-profile-tabs__btn is-active"
                  >
                    {mainTab === 'edit-poc' ? 'Edit POC' : 'Add POC'}
                  </button>
                )}
                {mainTab === 'legacy' && (
                  <button
                    type="button"
                    role="tab"
                    aria-selected
                    className="donor-profile-tabs__btn is-active"
                  >
                    Legacy
                  </button>
                )}
                {mainTab === 'add-note' && (
                  <button
                    type="button"
                    role="tab"
                    aria-selected
                    className="donor-profile-tabs__btn is-active"
                  >
                    Add Interaction
                  </button>
                )}
              </div>

              {mainTab === 'donations' ? (
                <OnlineDonationsList
                  key={`csr-donations-embed-${id}-${selectedPocId || 'all'}`}
                  embedded
                  embeddedCsrDonorId={id}
                  embeddedCsrPocId={selectedPocId || null}
                />
              ) : mainTab === 'edit-org' ? (
                <EditOrganization
                  key={`edit-org-${id}`}
                  embedded
                  organizationId={id}
                  onCancel={() => setMainTab('overview')}
                  onSaved={(updated) => {
                    if (updated) {
                      setOrg((prev) => ({ ...prev, ...updated, branch_tree: prev?.branch_tree }));
                    } else {
                      loadOrg();
                    }
                    setMainTab('overview');
                  }}
                />
              ) : mainTab === 'add-donation' ? (
                <AddDonation
                  key={`add-donation-${id}-${selectedPocId || 'none'}`}
                  embedded
                  embeddedCsrDonorId={id}
                  embeddedCsrPocId={selectedPocId || null}
                  onCancel={() => setMainTab(selectedPocId ? 'poc' : 'donations')}
                  onSaved={() => setMainTab('donations')}
                />
              ) : mainTab === 'add-poc' || mainTab === 'edit-poc' ? (
                <div className="donor-profile-donations-embed">
                  <PageHeader
                    title={mainTab === 'edit-poc' ? 'Edit POC' : 'Add POC'}
                    showBackButton
                    onBackClick={() => {
                      setEditingPoc(null);
                      setPocForm(emptyPocForm);
                      setPocError('');
                      setMainTab('poc');
                    }}
                  />
                  {pocError && (
                    <div className="status-message status-message--error">{pocError}</div>
                  )}
                  <form onSubmit={handleSavePoc} className="form">
                    <FormInput
                      label="Name"
                      name="name"
                      value={pocForm.name}
                      onChange={handlePocChange}
                      required
                    />
                    <FormInput
                      label="Email"
                      name="email"
                      type="email"
                      value={pocForm.email}
                      onChange={handlePocChange}
                    />
                    <FormInput
                      label="Phone"
                      name="phone"
                      value={pocForm.phone}
                      onChange={handlePocChange}
                    />
                    <FormInput
                      label="CNIC"
                      name="cnic"
                      value={pocForm.cnic}
                      onChange={handlePocChange}
                    />
                    <div className="form-group">
                      <label htmlFor="poc_role">Role</label>
                      <select
                        id="poc_role"
                        name="role"
                        className="form-control"
                        value={pocForm.role}
                        onChange={handlePocChange}
                      >
                        {POC_ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="poc_branch_id">Branch</label>
                      <select
                        id="poc_branch_id"
                        name="branch_id"
                        className="form-control"
                        value={pocForm.branch_id}
                        onChange={handlePocChange}
                      >
                        <option value="">— No branch —</option>
                        {tree.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="is_primary"
                          checked={pocForm.is_primary}
                          onChange={handlePocChange}
                        />
                        Primary contact
                      </label>
                    </div>
                    <FormInput
                      label="Notes"
                      name="notes"
                      value={pocForm.notes}
                      onChange={handlePocChange}
                    />
                    <div className="form-actions">
                      <button
                        type="button"
                        className="secondary_btn"
                        onClick={() => {
                          setEditingPoc(null);
                          setPocForm(emptyPocForm);
                          setPocError('');
                          setMainTab('poc');
                        }}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="primary_btn" disabled={savingPoc}>
                        {savingPoc ? 'Saving...' : mainTab === 'edit-poc' ? 'Update POC' : 'Add POC'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : mainTab === 'legacy' && legacyTabDonorId ? (
                <ViewDonor
                  key={`legacy-donor-${legacyTabDonorId}`}
                  embedded
                  embeddedDonorId={legacyTabDonorId}
                  onBack={() => {
                    setLegacyTabDonorId(null);
                    setMainTab('poc');
                  }}
                />
              ) : mainTab === 'add-note' ? (
                <AddDonorInteraction
                  key={`add-note-${id}-${selectedPocId || 'all'}`}
                  embedded
                  embeddedCsrDonorId={id}
                  embeddedCsrPocId={selectedPocId || null}
                  onCancel={() => setMainTab('poc')}
                  onSaved={() => setMainTab('poc')}
                />
              ) : mainTab === 'poc' ? (
                <>
                  {selectedPoc ? (
                    <section className="donor-crm-card org-person-summary-card">
                      <div className="org-person-summary__header">
                        <span className="org-person-summary__header-icon">
                          <FiUser />
                        </span>
                        <div>
                          <h3 className="org-person-summary__title">POC Information</h3>
                          <p className="org-person-summary__subtitle">
                            {selectedPoc.name || selectedPoc.email || `POC #${selectedPoc.id}`}
                            {' · '}
                            {formatPocRole(selectedPocRole)}
                            {selectedPocIsPrimary ? ' · Primary' : ''}
                          </p>
                        </div>
                        <div className="org-person-summary__header-actions">
                          {selectedPoc.email ? (
                            <a
                              href={`mailto:${selectedPoc.email}`}
                              className="org-person-summary__icon-btn"
                              title={`Email ${selectedPoc.email}`}
                              aria-label={`Email ${selectedPoc.email}`}
                            >
                              <FiMail />
                            </a>
                          ) : (
                            <button
                              type="button"
                              className="org-person-summary__icon-btn"
                              disabled
                              title="No email"
                              aria-label="No email"
                            >
                              <FiMail />
                            </button>
                          )}
                          {selectedPoc.phone ? (
                            <a
                              href={`https://wa.me/${normalizeWhatsAppPhone(selectedPoc.phone)}`}
                              className="org-person-summary__icon-btn org-person-summary__icon-btn--whatsapp"
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`WhatsApp ${selectedPoc.phone}`}
                              aria-label={`WhatsApp ${selectedPoc.phone}`}
                            >
                              <FaWhatsapp />
                            </a>
                          ) : (
                            <button
                              type="button"
                              className="org-person-summary__icon-btn org-person-summary__icon-btn--whatsapp"
                              disabled
                              title="No phone"
                              aria-label="No phone"
                            >
                              <FaWhatsapp />
                            </button>
                          )}
                          {canUpdate ? (
                            <button
                              type="button"
                              className="org-person-summary__icon-btn"
                              onClick={openEditPocForm}
                              title="Edit POC"
                              aria-label="Edit POC"
                            >
                              <FiEdit />
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div className="org-person-summary__grid">
                        <div className="org-person-summary__tile">
                          <span className="org-person-summary__tile-label">Email</span>
                          <span className="org-person-summary__tile-value">
                            {selectedPoc.email || '—'}
                          </span>
                        </div>
                        <div className="org-person-summary__tile">
                          <span className="org-person-summary__tile-label">Phone</span>
                          <span className="org-person-summary__tile-value">
                            {selectedPoc.phone || '—'}
                          </span>
                        </div>
                        <div className="org-person-summary__tile">
                          <span className="org-person-summary__tile-label">Role</span>
                          <span className="org-person-summary__tile-value">
                            {formatPocRole(selectedPocRole)}
                          </span>
                        </div>
                        <div className="org-person-summary__tile">
                          <span className="org-person-summary__tile-label">Branch</span>
                          <span className="org-person-summary__tile-value">
                            {selectedPocBranch?.name || '—'}
                          </span>
                        </div>
                        <div className="org-person-summary__tile">
                          <span className="org-person-summary__tile-label">CNIC</span>
                          <span className="org-person-summary__tile-value">
                            {selectedPoc.cnic || '—'}
                          </span>
                        </div>
                        <div className="org-person-summary__tile">
                          <span className="org-person-summary__tile-label">Status</span>
                          <span
                            className={`org-person-summary__status-pill ${
                              selectedPoc.is_active === false
                                ? 'org-person-summary__status-pill--inactive'
                                : 'org-person-summary__status-pill--active'
                            }`}
                          >
                            <span className="org-person-summary__status-pill-dot" aria-hidden="true" />
                            {selectedPoc.is_active === false ? 'Inactive' : 'Active'}
                          </span>
                        </div>
                        <div className="org-person-summary__tile">
                          <span className="org-person-summary__tile-label">Primary contact</span>
                          <span className="org-person-summary__tile-value">
                            {selectedPocIsPrimary ? 'Yes' : 'No'}
                          </span>
                        </div>
                        {selectedPoc.notes ? (
                          <div className="org-person-summary__tile org-person-summary__tile--notes">
                            <span className="org-person-summary__tile-label">Notes</span>
                            <span className="org-person-summary__tile-value">{selectedPoc.notes}</span>
                          </div>
                        ) : null}
                      </div>
                    </section>
                  ) : (
                    <section className="donor-crm-card org-person-summary-card">
                      <div className="org-person-summary__header">
                        <span className="org-person-summary__header-icon">
                          <FiUser />
                        </span>
                        <div>
                          <h3 className="org-person-summary__title">All POCs</h3>
                          <p className="org-person-summary__subtitle">
                            Showing interactions across every contact for {org.name}. Select a POC
                            in the sidebar to focus on one person.
                          </p>
                        </div>
                      </div>
                      <div className="org-person-summary__grid">
                        <div className="org-person-summary__tile">
                          <span className="org-person-summary__tile-label">Total POCs</span>
                          <span className="org-person-summary__tile-value">{people.length}</span>
                        </div>
                        <div className="org-person-summary__tile">
                          <span className="org-person-summary__tile-label">Primary contacts</span>
                          <span className="org-person-summary__tile-value">
                            {people.filter((row) => {
                              const poc = getPocRow(row);
                              return row.is_primary || poc.is_primary;
                            }).length}
                          </span>
                        </div>
                      </div>
                    </section>
                  )}

                  {showOrgJourney ? (
                    <DonorCommunication
                      key={`csr-journey-${id}-${selectedPocId || 'all'}`}
                      csrDonorId={Number(id)}
                      csrPocId={selectedPocId ? Number(selectedPocId) : undefined}
                      donor={org}
                      showPocBadges={!selectedPocId}
                      onAddInteraction={() => setMainTab('add-note')}
                      journeyTitle={
                        selectedPoc
                          ? `${selectedPoc.name || 'POC'} — Activities`
                          : 'All CSR Donor Activities'
                      }
                      journeySubtitle={
                        selectedPoc
                          ? `Interactions and follow-ups for ${selectedPoc.name || 'this contact'}. Click View all POCs to show everyone again.`
                          : `Every interaction and follow-up across all POCs for ${org.name}. Select a POC in the sidebar to filter.`
                      }
                    />
                  ) : (
                    <div className="donor-journey-panel">
                      <h3 className="donor-journey-panel__title">Donor Relationship Journey</h3>
                      <p className="donor-journey-empty">
                        You do not have access to view relationship interactions for this CSR donor.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <DonorPipelinePanel
                    csrDonorId={Number(id)}
                    currentStage={
                      org.effective_pipeline_stage ||
                      resolveDonorPipelineStage(org.pipeline_stage)
                    }
                    askAmount={org.pipeline_ask_amount}
                    pledgeAmount={org.pipeline_pledge_amount}
                    amountCurrency={org.pipeline_amount_currency || 'PKR'}
                    canUpdate={canUpdatePipeline}
                    onStageChanged={(updated) => {
                      if (updated) setOrg((prev) => ({ ...prev, ...updated, branch_tree: prev?.branch_tree }));
                      else loadOrg();
                    }}
                  />

                  <section className="donor-crm-card donor-crm-history donor-profile-history">
                    <div className="donor-crm-history__header">
                      <span className="donor-profile-section__icon">
                        <FiClock />
                      </span>
                      <h3 className="donor-crm-card__title" style={{ margin: 0 }}>
                        Change History
                      </h3>
                    </div>
                    <DonorAuditHistory csrDonorId={Number(id)} />
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
