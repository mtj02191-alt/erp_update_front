import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';
import Navbar from '../../../Navbar';

const AddCampaign = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    status: 'draft',
    goal_amount: '',
    currency: 'PKR',
    start_at: '',
    end_at: '',
    is_featured: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (form.start_at && form.end_at && new Date(form.start_at) >= new Date(form.end_at)) {
      setError('Start date must be before end date');
      setIsSubmitting(false);
      return;
    }

    try {
      const campaignData = {
        ...form,
        goal_amount: form.goal_amount ? parseFloat(form.goal_amount) : undefined
      };
      if (!campaignData.slug) delete campaignData.slug;

      await axiosInstance.post('/campaigns', campaignData);
      navigate('/dms/campaigns/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create campaign');
      console.error('Error creating campaign:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => navigate('/dms/campaigns/list');

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'ended', label: 'Ended' }
  ];

  const currencyOptions = [
    { value: 'PKR', label: 'PKR' },
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' },
    { value: 'GBP', label: 'GBP' }
  ];

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader title="Create Campaign" onBack={handleBack} />

        {error && (
          <div className="status-message status-message--error">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-section">
            <div className="form-grid-2">
              <FormInput
                label="Title"
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                maxLength={200}
              />

              <FormInput
                label="Slug (optional, auto-generated if empty)"
                type="text"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                maxLength={220}
                placeholder="campaign-url-slug"
              />
            </div>
          </div>

          <div className="form-section">
            <FormTextarea
              label="Description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="Campaign description..."
            />
          </div>

          <div className="form-section">
            <div className="form-grid-2">
              <FormSelect
                label="Status"
                name="status"
                value={form.status}
                onChange={handleChange}
                options={statusOptions}
              />

              <FormInput
                label="Goal Amount"
                type="number"
                name="goal_amount"
                value={form.goal_amount}
                onChange={handleChange}
                min={0}
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="form-section">
            <div className="form-grid-2">
              <FormSelect
                label="Currency"
                name="currency"
                value={form.currency}
                onChange={handleChange}
                options={currencyOptions}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '25px' }}>
                <input
                  type="checkbox"
                  id="is_featured"
                  name="is_featured"
                  checked={form.is_featured}
                  onChange={handleChange}
                  style={{ width: '18px', height: '18px' }}
                />
                <label htmlFor="is_featured" style={{ cursor: 'pointer' }}>
                  Featured Campaign
                </label>
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-grid-2">
              <FormInput
                label="Start Date & Time"
                type="datetime-local"
                name="start_at"
                value={form.start_at}
                onChange={handleChange}
              />

              <FormInput
                label="End Date & Time"
                type="datetime-local"
                name="end_at"
                value={form.end_at}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="secondary_btn" onClick={handleBack}>
              Cancel
            </button>
            <button type="submit" className="primary_btn" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddCampaign;
