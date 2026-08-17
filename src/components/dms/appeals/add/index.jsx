import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';
import Navbar from '../../../Navbar';
import OrganizerFields from '../shared/OrganizerFields';
import AppealImageUpload from '../shared/AppealImageUpload';
import AppealGalleryUpload from '../shared/AppealGalleryUpload';
import { buildAppealPayload } from '../shared/appealFormUtils';

const initialForm = {
  title: '',
  slug: '',
  short_description: '',
  story: '',
  status: 'draft',
  category: 'medical',
  tags: '',
  goal_amount: '',
  currency: 'PKR',
  start_at: '',
  end_at: '',
  cover_image_url: '',
  is_featured: false,
  is_urgent: false,
  is_verified: true,
  donation_protected: true,
  organizer_name: '',
  organizer_location: '',
  organizer_bio: '',
  organizer_image_url: '',
  organizer_verified: false,
  impact_points_text: '',
  beneficiary_name: '',
  beneficiary_age: '',
  beneficiary_location: '',
  beneficiary_bio: '',
  beneficiary_profile_image_url: '',
  gallery_image_urls: [],
};

const AddAppeal = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (error) setError('');
  };

  const handleUrlChange = (fieldName, url) => {
    setForm((prev) => ({ ...prev, [fieldName]: url }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (form.start_at && form.end_at && new Date(form.start_at) >= new Date(form.end_at)) {
      setError('End date must be after start date');
      setIsSubmitting(false);
      return;
    }

    if (!form.beneficiary_name?.trim()) {
      setError('Beneficiary name is required');
      setIsSubmitting(false);
      return;
    }

    try {
      await axiosInstance.post('/appeals', buildAppealPayload(form));
      navigate('/dms/appeals/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create appeal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'ended', label: 'Ended' },
  ];

  const categoryOptions = [
    { value: 'medical', label: 'Medical' },
    { value: 'education', label: 'Education' },
    { value: 'ration', label: 'Ration' },
    { value: 'widow_support', label: 'Widow Support' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'other', label: 'Other' },
  ];

  const currencyOptions = [
    { value: 'PKR', label: 'PKR' },
    { value: 'GBP', label: 'GBP' },
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' },
  ];

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader title="Create Appeal" onBack={() => navigate('/dms/appeals/list')} />
        {error && <div className="status-message status-message--error">{error}</div>}

        <form onSubmit={handleSubmit} className="form">
          <h3 className="form-section-title">Appeal details</h3>
          <div className="form-section">
            <div className="form-grid-2">
              <FormInput label="Title" name="title" value={form.title} onChange={handleChange} required maxLength={250} />
              <FormInput label="Slug (optional)" name="slug" value={form.slug} onChange={handleChange} maxLength={260} />
            </div>
            <FormTextarea label="Short description" name="short_description" value={form.short_description} onChange={handleChange} rows={2} />
            <FormTextarea label="Full story" name="story" value={form.story} onChange={handleChange} rows={6} />
            <AppealImageUpload
              label="Cover image"
              purpose="cover"
              urlFieldName="cover_image_url"
              urlValue={form.cover_image_url}
              onUrlChange={handleUrlChange}
              disabled={isSubmitting}
            />
            <AppealGalleryUpload
              urls={form.gallery_image_urls}
              onChange={(gallery_image_urls) =>
                setForm((prev) => ({ ...prev, gallery_image_urls }))
              }
              disabled={isSubmitting}
            />
          </div>

          <h3 className="form-section-title">Beneficiary</h3>
          <div className="form-section">
            <div className="form-grid-2">
              <FormInput label="Beneficiary name" name="beneficiary_name" value={form.beneficiary_name} onChange={handleChange} required />
              <FormInput label="Age" name="beneficiary_age" type="number" value={form.beneficiary_age} onChange={handleChange} min={0} />
            </div>
            <FormInput label="Location" name="beneficiary_location" value={form.beneficiary_location} onChange={handleChange} />
            <FormTextarea label="Bio" name="beneficiary_bio" value={form.beneficiary_bio} onChange={handleChange} rows={3} />
            <AppealImageUpload
              label="Beneficiary profile image"
              purpose="beneficiary"
              urlFieldName="beneficiary_profile_image_url"
              urlValue={form.beneficiary_profile_image_url}
              onUrlChange={handleUrlChange}
              disabled={isSubmitting}
            />
          </div>

          <h3 className="form-section-title">Fundraising</h3>
          <div className="form-section">
            <div className="form-grid-2">
              <FormSelect label="Status" name="status" value={form.status} onChange={handleChange} options={statusOptions} />
              <FormSelect label="Category" name="category" value={form.category} onChange={handleChange} options={categoryOptions} />
              <FormInput label="Goal amount" name="goal_amount" type="number" value={form.goal_amount} onChange={handleChange} min={0} step="0.01" />
              <FormSelect label="Currency" name="currency" value={form.currency} onChange={handleChange} options={currencyOptions} />
              <FormInput label="Start" name="start_at" type="datetime-local" value={form.start_at} onChange={handleChange} />
              <FormInput label="End" name="end_at" type="datetime-local" value={form.end_at} onChange={handleChange} />
            </div>
            <FormInput label="Tags (comma separated)" name="tags" value={form.tags} onChange={handleChange} />
            <FormTextarea label="How donations help (one line per bullet)" name="impact_points_text" value={form.impact_points_text} onChange={handleChange} rows={4} />
            <div className="form-grid-2" style={{ marginTop: 12 }}>
              <label><input type="checkbox" name="is_featured" checked={form.is_featured} onChange={handleChange} /> Featured</label>
              <label><input type="checkbox" name="is_urgent" checked={form.is_urgent} onChange={handleChange} /> Urgent</label>
              <label><input type="checkbox" name="is_verified" checked={form.is_verified} onChange={handleChange} /> Verified</label>
              <label><input type="checkbox" name="donation_protected" checked={form.donation_protected} onChange={handleChange} /> Donation protected</label>
            </div>
          </div>

          <h3 className="form-section-title">Organizer</h3>
          <div className="form-section">
            <OrganizerFields
              form={form}
              handleChange={handleChange}
              onUrlChange={handleUrlChange}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="secondary_btn" onClick={() => navigate('/dms/appeals/list')}>Cancel</button>
            <button type="submit" className="primary_btn" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Create Appeal'}</button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddAppeal;
