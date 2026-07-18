import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import Modal from '../../../common/Modal';
import { FiKey } from 'react-icons/fi';

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
    // Individual
    first_name: '',
    last_name: '',
    // CSR
    company_name: '',
    company_registration: '',
    contact_person: '',
    designation: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    is_active: true,
  });

  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [pwModalTitle, setPwModalTitle] = useState('');
  const [pwValue, setPwValue] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');

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
        company_name: d.company_name || '',
        company_registration: d.company_registration || '',
        contact_person: d.contact_person || '',
        designation: d.designation || '',
        company_address: d.company_address || '',
        company_phone: d.company_phone || '',
        company_email: d.company_email || '',
        is_active: d.is_active !== false,
      });
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
        // Clear CSR fields
        payload.company_name = null;
        payload.company_registration = null;
        payload.contact_person = null;
        payload.designation = null;
        payload.company_address = null;
        payload.company_phone = null;
        payload.company_email = null;
      } else {
        payload.company_name = form.company_name;
        payload.company_registration = form.company_registration;
        payload.contact_person = form.contact_person;
        payload.designation = form.designation;
        payload.company_address = form.company_address;
        payload.company_phone = form.company_phone;
        payload.company_email = form.company_email;
        payload.name = form.company_name || payload.name;
        // Clear individual fields
        payload.first_name = null;
        payload.last_name = null;
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
      <div className="form-content">
        <PageHeader title="Edit Donor" onBack={handleBack} />

        {error && <div className="status-message status-message--error">{error}</div>}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-section">
            <FormSelect
              label="Donor Type"
              name="donor_type"
              value={form.donor_type}
              onChange={handleChange}
              options={donorTypeOptions}
              required
            />
          </div>

          <div className="form-section">
            <div className="form-grid-2">
              <FormInput label="Email" type="email" name="email" value={form.email} onChange={handleChange} required />
              <FormInput label="Phone" type="tel" name="phone" value={form.phone} onChange={handleChange} required />
            </div>
          </div>

          {form.donor_type === 'individual' ? (
            <div className="form-section">
              <div className="form-grid-2">
                <FormInput label="First Name" type="text" name="first_name" value={form.first_name} onChange={handleChange} />
                <FormInput label="Last Name" type="text" name="last_name" value={form.last_name} onChange={handleChange} />
              </div>
            </div>
          ) : (
            <>
              <div className="form-section">
                <div className="form-grid-2">
                  <FormInput label="Company Name" type="text" name="company_name" value={form.company_name} onChange={handleChange} required />
                  <FormInput label="Registration Number" type="text" name="company_registration" value={form.company_registration} onChange={handleChange} />
                </div>
              </div>
              <div className="form-section">
                <div className="form-grid-2">
                  <FormInput label="Contact Person" type="text" name="contact_person" value={form.contact_person} onChange={handleChange} required />
                  <FormInput label="Designation" type="text" name="designation" value={form.designation} onChange={handleChange} />
                </div>
              </div>
              <div className="form-section">
                <div className="form-grid-2">
                  <FormInput label="Company Phone" type="tel" name="company_phone" value={form.company_phone} onChange={handleChange} />
                  <FormInput label="Company Email" type="email" name="company_email" value={form.company_email} onChange={handleChange} />
                </div>
              </div>
              <div className="form-section">
                <div className="form-grid-2">
                  <FormInput label="Company Address" type="text" name="company_address" value={form.company_address} onChange={handleChange} />
                </div>
              </div>
            </>
          )}

          <div className="form-section">
            <div className="form-grid-2">
              <FormInput label="CNIC" type="text" name="cnic" value={form.cnic} onChange={handleChange} />
              <FormInput label="Source" type="text" name="source" value={form.source} onChange={handleChange} />
            </div>
          </div>

          <div className="form-section">
            <div className="form-grid-2">
              <FormInput label="Address" type="text" name="address" value={form.address} onChange={handleChange} />
              <FormInput label="City" type="text" name="city" value={form.city} onChange={handleChange} />
            </div>
          </div>

          <div className="form-section">
            <div className="form-grid-2">
              <FormInput label="Country" type="text" name="country" value={form.country} onChange={handleChange} />
              <FormInput label="Postal Code" type="text" name="postal_code" value={form.postal_code} onChange={handleChange} />
            </div>
          </div>

          <div className="form-section">
            <FormInput label="Notes" type="textarea" name="notes" value={form.notes} onChange={handleChange} rows="3" />
          </div>

          <div className="form-section">
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="primary_btn"
                onClick={handleToggleActive}
                style={{ backgroundColor: form.is_active ? '#10b981' : '#6b7280' }}
              >
                {form.is_active ? 'Active' : 'Inactive'}
              </button>

              <button
                type="button"
                className="primary_btn"
                onClick={handleResetPassword}
                style={{ backgroundColor: '#dc2626' }}
                title="Generate a new password and store it securely"
              >
                <FiKey style={{ marginRight: '8px' }} />
                Reset Password
              </button>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="primary_btn" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
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

