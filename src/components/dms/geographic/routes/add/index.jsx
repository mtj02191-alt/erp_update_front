import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';
import MultiSelect from '../../../../common/MultiSelect';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';

const ROUTE_TYPE_OPTIONS = [
  { value: 'main', label: 'Main' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'local', label: 'Local' },
  { value: 'highway', label: 'Highway' },
  { value: 'street', label: 'Street' },
  { value: 'other', label: 'Other' }
];

const AddRoute = () => {
  const navigate = useNavigate();
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [form, setForm] = useState({
    name: '',
    code: '',
    route_type: 'street',
    country_id: '',
    region_id: '',
    city_ids: [],
    distance_km: '',
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

  const fetchCities = async (regionId) => {
    if (!regionId) {
      setCities([]);
      return;
    }
    try {
      const res = await axiosInstance.get(`/cities?region_id=${regionId}`);
      if (res.data.success) setCities(res.data.data || []);
    } catch (err) {
      setCities([]);
    }
  };

  useEffect(() => { fetchCountries(); }, []);

  useEffect(() => {
    if (form.country_id) fetchRegions(form.country_id);
    else {
      setRegions([]);
      setForm((prev) => ({ ...prev, region_id: '', city_ids: [] }));
    }
  }, [form.country_id]);

  useEffect(() => {
    if (form.region_id) fetchCities(form.region_id);
    else {
      setCities([]);
      setForm((prev) => ({ ...prev, city_ids: [] }));
    }
  }, [form.region_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const val = name === 'is_active' ? e.target.checked : value;
    setForm((prev) => {
      const next = { ...prev, [name]: val };
      if (name === 'country_id') next.region_id = '';
      if (name === 'region_id') next.city_ids = [];
      return next;
    });
    if (error) setError('');
  };

  const handleCityIdsChange = (selectedValues) => {
    setForm((prev) => ({ ...prev, city_ids: selectedValues }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.country_id || !form.region_id) {
      setError('Please select country and region');
      return;
    }
    if (!form.city_ids || form.city_ids.length === 0) {
      setError('Please select at least one city');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code?.trim() || undefined,
        route_type: form.route_type,
        country_id: Number(form.country_id),
        region_id: Number(form.region_id),
        city_ids: form.city_ids.map((id) => Number(id)),
        distance_km: form.distance_km ? parseFloat(form.distance_km) : undefined,
        is_active: form.is_active,
        description: form.description?.trim() || undefined
      };
      await axiosInstance.post('/routes', payload);
      navigate('/dms/geographic/routes/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create route');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => navigate('/dms/geographic/routes/list');

  const countryOptions = countries.map((c) => ({ value: String(c.id), label: c.name }));
  const regionOptions = regions.map((r) => ({ value: String(r.id), label: r.name }));
  const cityOptions = cities.map((c) => ({ value: String(c.id), label: c.name }));

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader title="Add Route" onBack={handleBack} />
        {error && <div className="status-message status-message--error">{error}</div>}
        <form onSubmit={handleSubmit} className="form">
          <div className="form-section">
            <div className="form-grid-2">
              <FormInput label="Name" name="name" value={form.name} onChange={handleChange} required maxLength={100} />
              <FormInput label="Code" name="code" value={form.code} onChange={handleChange} maxLength={20} placeholder="Optional" />
              <FormSelect
                label="Route Type"
                name="route_type"
                value={form.route_type}
                onChange={handleChange}
                options={ROUTE_TYPE_OPTIONS}
              />
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
              <FormInput
                label="Distance (km)"
                type="number"
                name="distance_km"
                value={form.distance_km}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="form-section">
            <MultiSelect
              label="Cities"
              name="city_ids"
              options={cityOptions}
              value={form.city_ids}
              onChange={handleCityIdsChange}
              required
              placeholder={form.region_id ? 'Select cities in this region' : 'Select a region first'}
              disabled={!form.region_id}
            />
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
              {isSubmitting ? 'Saving...' : 'Save Route'}
            </button>
            <button type="button" className="secondary_btn" onClick={handleBack} disabled={isSubmitting}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddRoute;
