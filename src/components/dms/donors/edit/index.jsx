import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import SearchableDropdown from '../../../common/SearchableDropdown';
import Modal from '../../../common/Modal';
import { FiKey } from 'react-icons/fi';
import '../register/index.css';

const EditDonor = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [donor, setDonor] = useState(null);
  const [form, setForm] = useState({
    donor_type: 'individual',
    name: '',
    email: '',
    phone: '',
    cnic: '',
    source: '',
    address: '',
    city: '',
    country: '',
    postal_code: '',
    notes: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    is_active: true,
    affiliation_role: 'contact',
    business_type: '',
    business_type_other: '',
    area_of_interest: '',
  });

  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [pwModalTitle, setPwModalTitle] = useState('');
  const [pwValue, setPwValue] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [assignedUser, setAssignedUser] = useState(null);
  const [referrerUser, setReferrerUser] = useState(null);
  const [selectedOrganization, setSelectedOrganization] = useState(null);

  useEffect(() => {
    fetchDonor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDonor = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axiosInstance.get(`/donors/${id}`);
      if (!res.data?.success) throw new Error(res.data?.message || 'Failed to load donor');
      const d = res.data.data;
      setDonor(d);
      const primaryAff =
        (d.organization_affiliations || []).find((a) => a.is_primary) ||
        (d.organization_affiliations || [])[0] ||
        null;
      setForm({
        donor_type: d.donor_type || 'individual',
        name: d.name || '',
        email: d.email || '',
        phone: d.phone || '',
        cnic: d.cnic || '',
        source: d.source || '',
        address: d.address || '',
        city: d.city || '',
        country: d.country || '',
        postal_code: d.postal_code || '',
        notes: d.notes || '',
        first_name: d.first_name || '',
        last_name: d.last_name || '',
        date_of_birth: d.date_of_birth
          ? String(d.date_of_birth).slice(0, 10)
          : '',
        is_active: d.is_active !== false,
        affiliation_role: primaryAff?.role || 'contact',
        business_type: d.business_type || '',
        business_type_other: d.business_type_other || '',
        area_of_interest: d.area_of_interest || '',
      });
      setAssignedUser(d.assigned_to || null);
      setReferrerUser(d.referred_by || null);
      setSelectedOrganization(primaryAff?.organization || null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load donor');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => navigate(`/dms/donors/view/${id}`);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleToggleActive = () => {
    setForm((prev) => ({ ...prev, is_active: !prev.is_active }));
  };

  const handleUserSelect = (user) => setAssignedUser(user);
  const handleUserClear = () => setAssignedUser(null);
  const handleReferrerSelect = (user) => setReferrerUser(user);
  const handleReferrerClear = () => setReferrerUser(null);
  const handleOrganizationSelect = (org) => setSelectedOrganization(org);
  const handleOrganizationClear = () => setSelectedOrganization(null);

  const renderUserOption = (user, onSelect) => (
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        donor_type: form.donor_type,
        name: form.name,
        email: form.email,
        phone: form.phone,
        cnic: form.cnic,
        source: form.source,
        address: form.address,
        city: form.city,
        country: form.country,
        postal_code: form.postal_code,
        notes: form.notes,
        is_active: form.is_active,
      };

      if (form.donor_type === 'individual') {
        payload.first_name = form.first_name;
        payload.last_name = form.last_name;
        payload.name = `${form.first_name || ''} ${form.last_name || ''}`.trim() || payload.name;
      } else {
        payload.name = form.name?.trim() || payload.name;
        if (form.donor_type === 'csr' && !selectedOrganization?.id) {
          throw new Error('Please select an organization for CSR donors.');
        }
      }

      if (form.donor_type === 'csr') {
        payload.business_type = form.business_type || null;
        payload.business_type_other =
          form.business_type === 'Other' ? form.business_type_other || null : null;
      }

      payload.area_of_interest = form.area_of_interest || null;

      payload.assigned_to_user_id = assignedUser?.id ?? null;
      payload.referrer_user_id = referrerUser?.id ?? null;
      payload.date_of_birth = form.date_of_birth || null;

      if (selectedOrganization?.id) {
        payload.organization_id = selectedOrganization.id;
        payload.affiliation_role = form.affiliation_role || 'contact';
        payload.affiliation_is_primary = true;
      }

      const res = await axiosInstance.patch(`/donors/${id}`, payload);
      if (!res.data?.success) throw new Error(res.data?.message || 'Failed to update donor');
      navigate(`/dms/donors/view/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update donor');
    } finally {
      setSaving(false);
    }
  };

  const closePwModal = () => {
    setPwModalOpen(false);
    setPwModalTitle('');
    setPwValue('');
    setPwError('');
    setPwLoading(false);
  };

  const handleResetPassword = async () => {
    try {
      setPwError('');
      setPwLoading(true);
      setPwModalTitle(`Reset Password — ${donor?.name || donor?.email || 'Donor'}`);
      setPwModalOpen(true);
      const res = await axiosInstance.post(`/donors/${id}/reset-password`);
      const pw = res?.data?.data?.password || '';
      setPwValue(pw);
      if (!pw) setPwError('No password returned.');
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setPwLoading(false);
    }
  };

  const donorTypeOptions = [
    { value: 'individual', label: 'Individual Donor' },
    { value: 'csr', label: 'CSR Donor (Corporate)' },
  ];

  const affiliationRoleOptions = [
    { value: 'contact', label: 'Contact' },
    { value: 'ceo', label: 'CEO' },
    { value: 'cfo', label: 'CFO' },
    { value: 'csr_head', label: 'CSR Head' },
    { value: 'branch_manager', label: 'Branch Manager' },
    { value: 'other', label: 'Other' },
  ];

  const businessTypeOptions = [
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

  const renderOrgOption = (org, onSelect) => (
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

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading donor...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <div className="list-content donor-register-page">
          <PageHeader title="Edit Donor" onBack={handleBack} />

          {error && <div className="status-message status-message--error">{error}</div>}

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
            </section>

            {form.donor_type === 'individual' ? (
              <section className="donor-register-card">
                <h3 className="donor-register-card__title">2. Personal Details</h3>
                <div className="form-grid-3">
                  <FormInput
                    label="First Name"
                    type="text"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                  />
                  <FormInput
                    label="Last Name"
                    type="text"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
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
            ) : (
              <section className="donor-register-card">
                <h3 className="donor-register-card__title">2. Contact Person</h3>
                <div className="form-grid-3">
                  <FormInput
                    label="Contact Person Name"
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                  <FormInput
                    label="CNIC (optional)"
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
            )}

            {form.donor_type === 'csr' && (
              <section className="donor-register-card">
                <h3 className="donor-register-card__title">2c. Business Type (CSR)</h3>
                <div className="form-grid-2">
                  <FormSelect
                    label="Business Type"
                    name="business_type"
                    value={form.business_type}
                    onChange={handleChange}
                    options={businessTypeOptions}
                    showDefaultOption
                    defaultOptionText="Select Business Type (optional)"
                  />
                  {form.business_type === 'Other' && (
                    <FormInput
                      label="Other business type (optional)"
                      type="text"
                      name="business_type_other"
                      value={form.business_type_other}
                      onChange={handleChange}
                      placeholder="Type business type..."
                    />
                  )}
                </div>
              </section>
            )}

            <section className="donor-register-card">
              <h3 className="donor-register-card__title">
                2b. Organization Link {form.donor_type === 'csr' ? '(required)' : '(optional)'}
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
                  renderOption={(org) => renderOrgOption(org, handleOrganizationSelect)}
                />
                <FormSelect
                  label="Role at organization"
                  name="affiliation_role"
                  value={form.affiliation_role}
                  onChange={handleChange}
                  options={affiliationRoleOptions}
                />
              </div>
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
                  label="Source"
                  type="text"
                  name="source"
                  value={form.source}
                  onChange={handleChange}
                />
                <div className="donor-edit-status-field">
                  <span className="donor-edit-status-field__label">Status</span>
                  <button
                    type="button"
                    className={`donor-edit-status-btn ${
                      form.is_active ? 'donor-edit-status-btn--active' : 'donor-edit-status-btn--inactive'
                    }`}
                    onClick={handleToggleActive}
                  >
                    {form.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>
                <SearchableDropdown
                  label="Assign to Fundraising User (Optional)"
                  placeholder="Search users by name or email..."
                  apiEndpoint="/users"
                  onSelect={handleUserSelect}
                  onClear={handleUserClear}
                  value={assignedUser}
                  displayKey="first_name"
                  debounceDelay={500}
                  minSearchLength={2}
                  allowResearch={true}
                  renderOption={(user) => renderUserOption(user, handleUserSelect)}
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
                  renderOption={(user) => renderUserOption(user, handleReferrerSelect)}
                />
              </div>
              <div className="donor-register-lookup">
                <button
                  type="button"
                  className="donor-edit-reset-btn"
                  onClick={handleResetPassword}
                  title="Generate a new password and store it securely"
                >
                  <FiKey size={16} />
                  Reset Password
                </button>
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
                rows="3"
              />
            </section>

            <div className="form-actions donor-register-actions">
              <button type="button" className="donor-register-cancel" onClick={handleBack}>
                Cancel
              </button>
              <button type="submit" className="primary_btn" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Modal
        open={pwModalOpen}
        onClose={closePwModal}
        title={pwModalTitle || 'Reset Password'}
        details={{
          Status: pwLoading ? 'Loading...' : pwError ? 'Error' : 'Success',
          ...(pwError ? { Message: pwError } : {}),
          ...(pwValue ? { 'New Password': pwValue } : {}),
          Note: 'Copy and share with donor securely. Close this dialog when done.',
        }}
      />
    </>
  );
};

export default EditDonor;
