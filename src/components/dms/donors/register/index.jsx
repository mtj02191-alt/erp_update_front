import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import './index.css';

const AFFILIATION_ROLE_OPTIONS = [
  { value: 'contact', label: 'Contact' },
  { value: 'ceo', label: 'CEO' },
  { value: 'cfo', label: 'CFO' },
  { value: 'csr_head', label: 'CSR Head' },
  { value: 'branch_manager', label: 'Branch Manager' },
  { value: 'other', label: 'Other' },
];

const RegisterDonor = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetOrgId = searchParams.get('organization_id');
  const presetDonorType = searchParams.get('donor_type');
  const [form, setForm] = useState({
    donor_type: presetDonorType === 'csr' ? 'csr' : 'individual',
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
    source: 'fund_raising',
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
  });
  const [assignedUser, setAssignedUser] = useState(null);
  const [referrerUser, setReferrerUser] = useState(null);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [checkingDonor, setCheckingDonor] = useState(false);
  const [donorSearchMessage, setDonorSearchMessage] = useState('');

  useEffect(() => {
    if (!presetOrgId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get(`/organizations/${presetOrgId}`);
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
      const res = await axiosInstance.post('/organizations', {
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
      if (form.donor_type === 'csr' && !selectedOrganization?.id) {
        setError('Please select or create an organization for CSR donors.');
        setIsSubmitting(false);
        return;
      }

      const fullName =
        form.donor_type === 'individual'
          ? `${form.first_name} ${form.last_name}`.trim()
          : form.name.trim() || `${form.first_name} ${form.last_name}`.trim();

      const donorData = {
        donor_type: form.donor_type,
        email: form.email,
        password: form.password,
        phone: form.phone,
        name: fullName,
        first_name: form.first_name || undefined,
        last_name: form.last_name || undefined,
        address: form.address,
        city: form.city,
        country: form.country,
        postal_code: form.postal_code,
        cnic: form.cnic,
        notes: form.notes,
        assigned_to_user_id: assignedUser?.id || null,
        referrer_user_id: referrerUser?.id || null,
        source: form.source,
        pipeline_stage: form.pipeline_stage || 'lead',
      };

      if (form.date_of_birth) {
        donorData.date_of_birth = form.date_of_birth;
      }

      if (selectedOrganization?.id) {
        donorData.organization_id = selectedOrganization.id;
        donorData.affiliation_role = form.affiliation_role || 'contact';
        donorData.affiliation_is_primary = true;
      }

      const res = await axiosInstance.post('/donors/register', donorData);
      const newId = res.data?.data?.id;
      if (presetOrgId && newId) {
        navigate(`/dms/organizations/view/${presetOrgId}?person=${newId}`);
      } else {
        navigate('/dms/donors/list');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register donor. Please try again.');
      console.error('Error registering donor:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/dms');
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

  const donorTypeOptions = [
    { value: 'individual', label: 'Individual Donor' },
    { value: 'csr', label: 'CSR Donor (Corporate)' },
  ];

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
        {[org.city, org.registration_number].filter(Boolean).join(' · ') || 'Organization'}
      </div>
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <div className="list-content donor-register-page">
          <PageHeader title="Register Donor" onBack={handleBack} />

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
                  required
                />
                <FormInput
                  label="Phone"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                />
              </div>
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
              <h3 className="donor-register-card__title">
                2. {form.donor_type === 'csr' ? 'Contact Person' : 'Personal Details'}
              </h3>
              <div className="form-grid-3">
                {form.donor_type === 'individual' ? (
                  <>
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
                  </>
                ) : (
                  <FormInput
                    label="Contact Person Name"
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                )}
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
              </div>
            </section>

            <section className="donor-register-card">
              <h3 className="donor-register-card__title">
                2b. Organization {form.donor_type === 'csr' ? '(required)' : '(optional)'}
              </h3>
              <div className="form-grid-2">
                <SearchableDropdown
                  label="Search organization"
                  placeholder="Search by company name..."
                  apiEndpoint="/organizations"
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
                      required={form.donor_type === 'csr'}
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
                  required={form.donor_type === 'individual'}
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
