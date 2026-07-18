import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import FormInput from '../../../../common/FormInput';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';

const AddCountry = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    code: '',
    currency: 'PKR',
    currency_symbol: 'Rs',
    phone_code: '+92',
    is_active: true,
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    const val = name === 'is_active' ? e.target.checked : value;
    setForm({ ...form, [name]: val });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        currency: form.currency?.trim() || 'PKR',
        currency_symbol: form.currency_symbol?.trim() || undefined,
        phone_code: form.phone_code?.trim() || undefined,
        description: form.description?.trim() || undefined
      };
      await axiosInstance.post('/countries', payload);
      navigate('/dms/geographic/countries/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create country');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => navigate('/dms/geographic/countries/list');

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader title="Add Country" onBack={handleBack} />
        {error && <div className="status-message status-message--error">{error}</div>}
        <form onSubmit={handleSubmit} className="form">
          <div className="form-section">
            <div className="form-grid-2">
              <FormInput label="Name" name="name" value={form.name} onChange={handleChange} required maxLength={100} />
              <FormInput label="Code" name="code" value={form.code} onChange={handleChange} required placeholder="e.g. PK" maxLength={3} />
              <FormInput label="Currency" name="currency" value={form.currency} onChange={handleChange} required maxLength={3} />
              <FormInput label="Currency Symbol" name="currency_symbol" value={form.currency_symbol} onChange={handleChange} maxLength={2} placeholder="e.g. Rs" />
              <FormInput label="Phone Code" name="phone_code" value={form.phone_code} onChange={handleChange} maxLength={10} placeholder="e.g. +92" />
            </div>
          </div>
          <div className="form-section">
            <FormInput label="Description" type="textarea" name="description" value={form.description} onChange={handleChange} rows={3} />
          </div>
          <div className="form-section">
            <label className="form-label">
              <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} /> Active
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="primary_btn" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Country'}
            </button>
            <button type="button" className="secondary_btn" onClick={handleBack} disabled={isSubmitting}>Cancel</button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddCountry;
