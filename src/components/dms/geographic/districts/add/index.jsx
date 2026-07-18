import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';

const AddDistrict = () => {
  const navigate = useNavigate();
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [form, setForm] = useState({
    name: '',
    code: '',
    country_id: '',
    region_id: '',
    is_active: true,
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchCountries = async () => {
    try {
      const res = await axiosInstance.get('/countries');
      if (res.data.success) setCountries(res.data.data || []);
    } catch (err) {
      console.error('Failed to load countries', err);
    }
  };

  const fetchRegions = async (countryId) => {
    if (!countryId) {
      setRegions([]);
      return;
    }
    try {
      const res = await axiosInstance.get(`/regions?country_id=${countryId}`);
      if (res.data.success) setRegions(res.data.data || []);
    } catch (err) {
      setRegions([]);
    }
  };

  useEffect(() => { fetchCountries(); }, []);

  useEffect(() => {
    if (form.country_id) fetchRegions(form.country_id);
    else {
      setRegions([]);
      setForm((prev) => ({ ...prev, region_id: '' }));
    }
  }, [form.country_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const val = name === 'is_active' ? e.target.checked : value;
    setForm((prev) => {
      const next = { ...prev, [name]: val };
      if (name === 'country_id') next.region_id = '';
      return next;
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.country_id || !form.region_id) {
      setError('Please select country and region');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code?.trim() || undefined,
        country_id: Number(form.country_id),
        region_id: Number(form.region_id),
        is_active: form.is_active,
        description: form.description?.trim() || undefined
      };
      await axiosInstance.post('/districts', payload);
      navigate('/dms/geographic/districts/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create district');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => navigate('/dms/geographic/districts/list');

  const countryOptions = countries.map((c) => ({ value: String(c.id), label: c.name }));
  const regionOptions = regions.map((r) => ({ value: String(r.id), label: r.name }));

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader title="Add District" onBack={handleBack} />
        {error && <div className="status-message status-message--error">{error}</div>}
        <form onSubmit={handleSubmit} className="form">
          <div className="form-section">
            <div className="form-grid-2">
              <FormInput label="Name" name="name" value={form.name} onChange={handleChange} required maxLength={100} />
              <FormInput label="Code" name="code" value={form.code} onChange={handleChange} maxLength={10} placeholder="Optional" />
              <FormSelect
                label="Country"
                name="country_id"
                value={form.country_id}
                onChange={handleChange}
                options={countryOptions}
                required
                showDefaultOption
                defaultOptionText="Select country"
              />
              <FormSelect
                label="Region"
                name="region_id"
                value={form.region_id}
                onChange={handleChange}
                options={regionOptions}
                required
                showDefaultOption
                defaultOptionText="Select region"
              />
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
              {isSubmitting ? 'Saving...' : 'Save District'}
            </button>
            <button type="button" className="secondary_btn" onClick={handleBack} disabled={isSubmitting}>Cancel</button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddDistrict;
