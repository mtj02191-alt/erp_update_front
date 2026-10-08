import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import axiosInstance from '../../../../utils/axios';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import {
  DONOR_PIPELINE_STAGES,
  DONOR_PIPELINE_STAGE_LABELS,
  DONOR_PIPELINE_STAGE_HINTS,
} from '../shared/donorPipelineConstants';
import FormSelect from '../../../common/FormSelect';
import SearchableDropdown from '../../../common/SearchableDropdown';
import Navbar from '../../../Navbar';
import { useAuth } from '../../../../context/AuthContext';
import './index.css';

const AFFILIATION_ROLE_OPTIONS = [
  { value: 'contact', label: 'Contact' },
  { value: 'ceo', label: 'CEO' },
  { value: 'cfo', label: 'CFO' },
  { value: 'csr_head', label: 'CSR Head' },
  { value: 'branch_manager', label: 'Branch Manager' },
  { value: 'other', label: 'Other' },
];

const BUSINESS_TYPE_OPTIONS = [
  { value: "Banking & Financial Services", label: "Banking & Financial Services" },
  { value: "Islamic Banking", label: "Islamic Banking" },
  { value: "Insurance & Takaful", label: "Insurance & Takaful" },
  { value: "Investment & Asset Management", label: "Investment & Asset Management" },
  { value: "Oil & Gas", label: "Oil & Gas" },
  { value: "Energy & Power", label: "Energy & Power" },
  { value: "Petroleum & Fuel", label: "Petroleum & Fuel" },
  { value: "FMCG", label: "FMCG" },
  { value: "Food & Beverage", label: "Food & Beverage" },
  { value: "Pharmaceuticals", label: "Pharmaceuticals" },
  { value: "Healthcare & Medical", label: "Healthcare & Medical" },
  { value: "Telecommunications", label: "Telecommunications" },
  { value: "Technology & IT", label: "Technology & IT" },
  { value: "E-Commerce & Digital Services", label: "E-Commerce & Digital Services" },
  { value: "Manufacturing", label: "Manufacturing" },
  { value: "Automotive", label: "Automotive" },
  { value: "Cement & Construction Materials", label: "Cement & Construction Materials" },
  { value: "Construction & Real Estate", label: "Construction & Real Estate" },
  { value: "Engineering", label: "Engineering" },
  { value: "Chemicals & Petrochemicals", label: "Chemicals & Petrochemicals" },
  { value: "Textile & Apparel", label: "Textile & Apparel" },
  { value: "Retail & Wholesale", label: "Retail & Wholesale" },
  { value: "Logistics & Transportation", label: "Logistics & Transportation" },
  { value: "Aviation", label: "Aviation" },
  { value: "Shipping & Ports", label: "Shipping & Ports" },
  { value: "Agriculture & Agribusiness", label: "Agriculture & Agribusiness" },
  { value: "Education", label: "Education" },
  { value: "Media & Entertainment", label: "Media & Entertainment" },
  { value: "Advertising & Marketing", label: "Advertising & Marketing" },
  { value: "Hospitality & Tourism", label: "Hospitality & Tourism" },
  { value: "Philanthropy / Foundations", label: "Philanthropy / Foundations" },
  { value: "NGOs / Non-Profit Organizations", label: "NGOs / Non-Profit Organizations" },
  { value: "Government / Public Sector", label: "Government / Public Sector" },
  { value: "Development Sector", label: "Development Sector" },
  { value: "Professional Services", label: "Professional Services" },
  { value: "Legal Services", label: "Legal Services" },
  { value: "Consulting", label: "Consulting" },
  { value: "Security Services", label: "Security Services" },
  { value: "Conglomerates / Business Groups", label: "Conglomerates / Business Groups" },
  { value: "Other", label: "Other" },
];

const RegisterDonor = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isOfflineRoute = location.pathname.includes('/dms/offline_donors');
  const isOnlineRoute = location.pathname.includes('/dms/online_donors');
  const isRecurringRoute =
    location.pathname.includes('/dms/recurring-donors') ||
    searchParams.get('recurring') === '1' ||
    searchParams.get('recurring') === 'true';
  const donorsBasePath = isRecurringRoute
    ? '/dms/recurring-donors'
    : isOfflineRoute
      ? '/dms/offline_donors'
      : isOnlineRoute
        ? '/dms/online_donors'
        : '/dms/donors';
  const presetOrgId = searchParams.get('organization_id');
  const presetDonorType = searchParams.get('donor_type');
  const [form, setForm] = useState({
    donor_type: 'individual',
    name: '',
    email: '',
    password: '',
    phone: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    address: '',
    city: '',
    country: 'Pakistan',
    source: isOnlineRoute ? 'website' : 'fund_raising',
    postal_code: '',
    cnic: '',
    notes: '',
    pipeline_stage: 'lead',
    affiliation_role: 'contact',
    org_name: '',
    org_registration: '',
    org_email: '',
    org_phone: '',
    org_address: '',
    business_type: '',
    business_type_other: '',
    area_of_interest: '',
  });
  const [assignedUser, setAssignedUser] = useState(null);
  const [referrerUser, setReferrerUser] = useState(null);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [checkingDonor, setCheckingDonor] = useState(false);
  const [donorSearchMessage, setDonorSearchMessage] = useState('');

  useEffect(() => {
    if (presetDonorType === 'csr' && presetOrgId) {
      navigate(`/dms/csr-donors/view/${presetOrgId}?addPoc=1`, { replace: true });
    }
  }, [presetDonorType, presetOrgId, navigate]);

  useEffect(() => {
    if (!presetOrgId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get(`/csr-donors/${presetOrgId}`);
        if (!cancelled && res.data?.data) {
          setSelectedOrganization(res.data.data);
        }
      } catch {
        // ignore — user can still pick org manually
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [presetOrgId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
    if (donorSearchMessage && (e.target.name === 'email' || e.target.name === 'phone')) {
      setDonorSearchMessage('');
    }
  };

  const handleUserSelect = (user) => setAssignedUser(user);
  const handleUserClear = () => setAssignedUser(null);
  const handleReferrerSelect = (user) => setReferrerUser(user);
  const handleReferrerClear = () => setReferrerUser(null);
  const handleOrganizationSelect = (org) => setSelectedOrganization(org);
  const handleOrganizationClear = () => setSelectedOrganization(null);

  const handleCreateOrganization = async () => {
    const name = form.org_name?.trim();
    if (!name) {
      setError('Enter an organization name first.');
      return;
    }
    try {
      const res = await axiosInstance.post('/csr-donors', {
        name,
        registration_number: form.org_registration || undefined,
        email: form.org_email || undefined,
        phone: form.org_phone || undefined,
        address: form.org_address || undefined,
        city: form.city || undefined,
        country: form.country || undefined,
      });
      if (res.data?.success && res.data?.data) {
        setSelectedOrganization(res.data.data);
        setError('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create organization');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const email = form.email?.trim() || '';
      const phone = form.phone?.trim() || '';
      if (!email && !phone) {
        setError('Please provide either an email or a phone number.');
        setIsSubmitting(false);
        return;
      }

      const fullName = `${form.first_name} ${form.last_name}`.trim() || form.name.trim();

      const donorData = {
        donor_type: 'individual',
        email: email || undefined,
        password: form.password,
        phone: phone || undefined,
        name: fullName,
        first_name: form.first_name || undefined,
        last_name: form.last_name || undefined,
        address: form.address,
        city: form.city,
        country: form.country,
        postal_code: form.postal_code,
        cnic: form.cnic,
        notes: form.notes,
        assigned_to_user_id: assignedUser?.id || currentUser?.id || null,
        referrer_user_id: referrerUser?.id || null,
        source: form.source,
        pipeline_stage: form.pipeline_stage || 'lead',
        ...(isRecurringRoute ? { recurring: true } : {}),
      };

      donorData.area_of_interest = form.area_of_interest || null;

      if (form.date_of_birth) {
        donorData.date_of_birth = form.date_of_birth;
      }

      if (selectedOrganization?.id) {
        donorData.organization_id = selectedOrganization.id;
        donorData.affiliation_role = form.affiliation_role || 'contact';
        donorData.affiliation_is_primary = true;
      }

      await axiosInstance.post('/donors/register', donorData);
      // After registering a recurring donor, go add their subscription
      navigate(
        isRecurringRoute
          ? '/dms/recurring-donations/add'
          : `${donorsBasePath}/list`,
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register donor. Please try again.');
      console.error('Error registering donor:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(isRecurringRoute ? '/dms/recurring-donors/list' : '/dms');
  };

  const handleCheckDonorExists = async () => {
    const email = form.email?.trim();
    const phone = form.phone?.trim();
    if (!email && !phone) {
      setDonorSearchMessage('Enter email or phone to search for an existing donor.');
      return;
    }
    setDonorSearchMessage('');
    setCheckingDonor(true);
    try {
      const params = {};
      if (email) params.email = email;
      if (phone) params.phone = phone;
      const res = await axiosInstance.get('/donors/lookup', { params });
      if (res.data.success && res.data.data) {
        // Always open main donor profile — not scoped to online/offline/recurring add route
        navigate(`/dms/donors/view/${res.data.data.id}`);
      } else {
        setDonorSearchMessage('No existing donor found for this email/phone.');
      }
    } catch (err) {
      setDonorSearchMessage(err.response?.data?.message || 'Could not check for existing donor.');
    } finally {
      setCheckingDonor(false);
    }
  };

  const donorTypeOptions = [{ value: 'individual', label: 'Individual Donor' }];

  const renderUserOption = (user, index, onSelect) => (
    <div
      key={user.id}
      className="searchable-dropdown__option"
      onClick={() => onSelect(user)}
      style={{
        padding: '12px',
        borderBottom: '1px solid #eee',
        cursor: 'pointer',
      }}
    >
      <div style={{ fontWeight: '500', marginBottom: '4px' }}>
        {user.first_name} {user.last_name}
      </div>
      <div style={{ fontSize: '12px', color: '#666' }}>{user.email}</div>
      {user.department && (
        <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
          {user.department} • {user.role || 'User'}
        </div>
      )}
    </div>
  );

  const renderOrgOption = (org, index, onSelect) => (
    <div
      key={org.id}
      className="searchable-dropdown__option"
      onClick={() => onSelect(org)}
      style={{
        padding: '12px',
        borderBottom: '1px solid #eee',
        cursor: 'pointer',
      }}
    >
      <div style={{ fontWeight: '500', marginBottom: '4px' }}>{org.name}</div>
      <div style={{ fontSize: '12px', color: '#666' }}>
        {[org.city, org.registration_number].filter(Boolean).join(' · ') || 'CSR Donor'}
      </div>
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <div className="list-content donor-register-page">
          <PageHeader
            title={isRecurringRoute ? 'Register Recurring Donor' : 'Register Donor'}
            onBack={handleBack}
          />

          {error && (
            <div className="status-message status-message--error">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="form donor-register-form">
            <section className="donor-register-card">
              <h3 className="donor-register-card__title">1. Contact & Type</h3>
              <div className="form-grid-3">
                <FormSelect
                  label="Donor Type"
                  name="donor_type"
                  value={form.donor_type}
                  onChange={handleChange}
                  options={donorTypeOptions}
                  required
                />
                <FormInput
                  label="Email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                />
                <FormInput
                  label="Phone"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>
              <p className="donor-register-contact-hint">
                At least one of email or phone is required.
              </p>
              <div className="donor-register-lookup">
                <button
                  type="button"
                  className="primary_btn"
                  onClick={handleCheckDonorExists}
                  disabled={checkingDonor}
                  title="Check if a donor with this email or phone already exists"
                >
                  <FiSearch size={16} />
                  {checkingDonor ? 'Checking...' : 'Check existing donor'}
                </button>
                {donorSearchMessage && (
                  <span className="donor-register-lookup__msg">{donorSearchMessage}</span>
                )}
              </div>
            </section>

            <section className="donor-register-card">
              <h3 className="donor-register-card__title">2. Personal Details</h3>
              <div className="form-grid-3">
                <FormInput
                  label="First Name"
                  type="text"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  required
                />
                <FormInput
                  label="Last Name"
                  type="text"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  required
                />
                <FormInput
                  label="CNIC"
                  type="text"
                  name="cnic"
                  value={form.cnic}
                  onChange={handleChange}
                />
                <FormInput
                  label="Date of Birth (optional)"
                  type="date"
                  name="date_of_birth"
                  value={form.date_of_birth}
                  onChange={handleChange}
                />
                <FormInput
                  label="Area of Interest (optional)"
                  type="text"
                  name="area_of_interest"
                  value={form.area_of_interest}
                  onChange={handleChange}
                  placeholder="e.g. Education, Healthcare, Environment..."
                />
              </div>
            </section>

            <section className="donor-register-card">
              <h3 className="donor-register-card__title">2b. CSR Donor (optional)</h3>
              <div className="form-grid-2">
                <SearchableDropdown
                  label="Search organization"
                  placeholder="Search by company name..."
                  apiEndpoint="/csr-donors"
                  apiParams={{ pageSize: 20 }}
                  onSelect={handleOrganizationSelect}
                  onClear={handleOrganizationClear}
                  value={selectedOrganization}
                  displayKey="name"
                  debounceDelay={400}
                  minSearchLength={2}
                  allowResearch={true}
                  renderOption={(org, index) =>
                    renderOrgOption(org, index, handleOrganizationSelect)
                  }
                />
                <FormSelect
                  label="Role at organization"
                  name="affiliation_role"
                  value={form.affiliation_role}
                  onChange={handleChange}
                  options={AFFILIATION_ROLE_OPTIONS}
                />
              </div>
              {!selectedOrganization && (
                <>
                  <div className="form-grid-3 donor-register-card__row">
                    <FormInput
                      label="New organization name"
                      type="text"
                      name="org_name"
                      value={form.org_name}
                      onChange={handleChange}
                      required={false}
                    />
                    <FormInput
                      label="Registration number"
                      type="text"
                      name="org_registration"
                      value={form.org_registration}
                      onChange={handleChange}
                    />
                    <FormInput
                      label="Org phone"
                      type="tel"
                      name="org_phone"
                      value={form.org_phone}
                      onChange={handleChange}
                    />
                    <FormInput
                      label="Org email"
                      type="email"
                      name="org_email"
                      value={form.org_email}
                      onChange={handleChange}
                    />
                    <FormInput
                      label="Org address"
                      type="text"
                      name="org_address"
                      value={form.org_address}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="donor-register-lookup" style={{ marginTop: 12 }}>
                    <button
                      type="button"
                      className="primary_btn"
                      onClick={handleCreateOrganization}
                    >
                      Create & select organization
                    </button>
                  </div>
                </>
              )}
            </section>

            <section className="donor-register-card">
              <h3 className="donor-register-card__title">3. Address</h3>
              <div className="form-grid-2">
                <FormInput
                  label="Address"
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  required
                />
                <FormInput
                  label="City"
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                />
                <FormInput
                  label="Country"
                  type="text"
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  required
                />
                <FormInput
                  label="Postal Code"
                  type="text"
                  name="postal_code"
                  value={form.postal_code}
                  onChange={handleChange}
                />
              </div>
            </section>

            <section className="donor-register-card">
              <h3 className="donor-register-card__title">4. Access & Assignment</h3>
              <div className="form-grid-2">
                <FormInput
                  label="Password"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  minLength="6"
                />
                <FormInput
                  label="Source"
                  type="text"
                  name="source"
                  value={form.source}
                  onChange={handleChange}
                />
                <div className="form-group">
                  <label htmlFor="pipeline_stage">Pipeline Stage</label>
                  <select
                    id="pipeline_stage"
                    name="pipeline_stage"
                    value={form.pipeline_stage}
                    onChange={handleChange}
                    className="form-control"
                  >
                    {DONOR_PIPELINE_STAGES.map((value) => (
                      <option key={value} value={value}>
                        {DONOR_PIPELINE_STAGE_LABELS[value]} —{' '}
                        {DONOR_PIPELINE_STAGE_HINTS[value]}
                      </option>
                    ))}
                  </select>
                </div>
                <SearchableDropdown
                  label="Assign to User (Optional)"
                  placeholder="Search users by name or email..."
                  apiEndpoint="/users"
                  onSelect={handleUserSelect}
                  onClear={handleUserClear}
                  value={assignedUser}
                  displayKey="first_name"
                  debounceDelay={500}
                  minSearchLength={2}
                  allowResearch={true}
                  renderOption={(user, index) =>
                    renderUserOption(user, index, handleUserSelect)
                  }
                />
                <SearchableDropdown
                  label="Referrer (Optional)"
                  placeholder="Search users by name or email..."
                  apiEndpoint="/users"
                  onSelect={handleReferrerSelect}
                  onClear={handleReferrerClear}
                  value={referrerUser}
                  displayKey="first_name"
                  debounceDelay={500}
                  minSearchLength={2}
                  allowResearch={true}
                  renderOption={(user, index) =>
                    renderUserOption(user, index, handleReferrerSelect)
                  }
                />
              </div>
            </section>

            <section className="donor-register-card">
              <h3 className="donor-register-card__title">5. Notes</h3>
              <FormInput
                label="Notes"
                type="textarea"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Any additional information about the donor..."
                rows="3"
              />
            </section>

            <div className="form-actions donor-register-actions">
              <button type="button" className="donor-register-cancel" onClick={handleBack}>
                Cancel
              </button>
              <button type="submit" className="primary_btn" disabled={isSubmitting}>
                {isSubmitting ? 'Registering...' : 'Register Donor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default RegisterDonor;
