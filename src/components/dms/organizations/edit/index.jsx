import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';

const EditOrganization = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    registration_number: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    notes: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/organizations/${id}`);
        const d = res.data?.data;
        if (!d) throw new Error('Not found');
        setForm({
          name: d.name || '',
          registration_number: d.registration_number || '',
          email: d.email || '',
          phone: d.phone || '',
          address: d.address || '',
          city: d.city || '',
          country: d.country || '',
          notes: d.notes || '',
          is_active: d.is_active !== false,
        });
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await axiosInstance.patch(`/organizations/${id}`, {
        name: form.name.trim(),
        registration_number: form.registration_number || null,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address || null,
        city: form.city || null,
        country: form.country || null,
        notes: form.notes || null,
        is_active: form.is_active,
      });
      navigate(`/dms/organizations/view/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <p>Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <div className="list-content">
          <PageHeader title="Edit Organization" onBack={() => navigate(`/dms/organizations/view/${id}`)} />
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
            <label className="form-group" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} />
              Active
            </label>
            <div className="form-actions">
              <button type="button" className="secondary_btn" onClick={() => navigate(`/dms/organizations/view/${id}`)}>
                Cancel
              </button>
              <button type="submit" className="primary_btn" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditOrganization;
