import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';

const emptyForm = {
  name: '',
  registration_number: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: 'Pakistan',
  notes: '',
};

const AddOrganization = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Organization name is required');
      return;
    }
    setSaving(true);
    try {
      const res = await axiosInstance.post('/organizations', {
        name: form.name.trim(),
        registration_number: form.registration_number || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        country: form.country || undefined,
        notes: form.notes || undefined,
      });
      const id = res.data?.data?.id;
      navigate(id ? `/dms/organizations/view/${id}` : '/dms/organizations/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create organization');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <div className="list-content">
          <PageHeader title="Add Organization" onBack={() => navigate('/dms/organizations/list')} />
          {error && <div className="status-message status-message--error">{error}</div>}
          <form onSubmit={handleSubmit} className="form">
            <div className="form-grid-2">
              <FormInput label="Name" name="name" value={form.name} onChange={handleChange} required />
              <FormInput
                label="Registration number"
                name="registration_number"
                value={form.registration_number}
                onChange={handleChange}
              />
              <FormInput label="Email" type="email" name="email" value={form.email} onChange={handleChange} />
              <FormInput label="Phone" name="phone" value={form.phone} onChange={handleChange} />
              <FormInput label="City" name="city" value={form.city} onChange={handleChange} />
              <FormInput label="Country" name="country" value={form.country} onChange={handleChange} />
            </div>
            <FormInput label="Address" name="address" value={form.address} onChange={handleChange} />
            <FormInput
              label="Notes"
              type="textarea"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows="3"
            />
            <div className="form-actions">
              <button type="button" className="secondary_btn" onClick={() => navigate('/dms/organizations/list')}>
                Cancel
              </button>
              <button type="submit" className="primary_btn" disabled={saving}>
                {saving ? 'Saving...' : 'Create Organization'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddOrganization;
