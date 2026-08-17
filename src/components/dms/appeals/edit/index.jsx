import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';
import Navbar from '../../../Navbar';
import OrganizerFields from '../shared/OrganizerFields';
import AppealImageUpload from '../shared/AppealImageUpload';
import { buildAppealPayload, mapAppealToForm } from '../shared/appealFormUtils';

const EditAppeal = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAppeal = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/appeals/${id}`);
        if (res.data.success) setForm(mapAppealToForm(res.data.data));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load appeal');
      } finally {
        setLoading(false);
      }
    };
    fetchAppeal();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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
    try {
      await axiosInstance.patch(`/appeals/${id}`, buildAppealPayload(form));
      navigate(`/dms/appeals/view/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update appeal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'ended', label: 'Ended' },
    { value: 'archived', label: 'Archived' },
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

  if (loading || !form) {
    return (
      <>
        <Navbar />
        <div className="form-content"><p>Loading...</p></div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader title="Edit Appeal" onBack={() => navigate(`/dms/appeals/view/${id}`)} />
        {error && <div className="status-message status-message--error">{error}</div>}
        <form onSubmit={handleSubmit} className="form">
          <div className="form-section">
            <div className="form-grid-2">
              <FormInput label="Title" name="title" value={form.title} onChange={handleChange} required />
              <FormInput label="Slug" name="slug" value={form.slug} onChange={handleChange} />
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
          </div>
          <div className="form-section">
            <div className="form-grid-2">
              <FormInput label="Beneficiary name" name="beneficiary_name" value={form.beneficiary_name} onChange={handleChange} required />
              <FormInput label="Age" name="beneficiary_age" type="number" value={form.beneficiary_age} onChange={handleChange} />
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
          <div className="form-section">
            <div className="form-grid-2">
              <FormSelect label="Status" name="status" value={form.status} onChange={handleChange} options={statusOptions} />
              <FormSelect label="Category" name="category" value={form.category} onChange={handleChange} options={categoryOptions} />
              <FormInput label="Goal amount" name="goal_amount" type="number" value={form.goal_amount} onChange={handleChange} />
              <FormSelect label="Currency" name="currency" value={form.currency} onChange={handleChange} options={currencyOptions} />
              <FormInput label="Start" name="start_at" type="datetime-local" value={form.start_at} onChange={handleChange} />
              <FormInput label="End" name="end_at" type="datetime-local" value={form.end_at} onChange={handleChange} />
            </div>
            <FormTextarea label="Impact bullets (one per line)" name="impact_points_text" value={form.impact_points_text} onChange={handleChange} rows={4} />
            <div className="form-grid-2" style={{ marginTop: 12 }}>
              <label><input type="checkbox" name="is_featured" checked={form.is_featured} onChange={handleChange} /> Featured</label>
              <label><input type="checkbox" name="is_urgent" checked={form.is_urgent} onChange={handleChange} /> Urgent</label>
            </div>
          </div>
          <div className="form-section">
            <OrganizerFields
              form={form}
              handleChange={handleChange}
              onUrlChange={handleUrlChange}
              disabled={isSubmitting}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="secondary_btn" onClick={() => navigate(`/dms/appeals/view/${id}`)}>Cancel</button>
            <button type="submit" className="primary_btn" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </>
  );
};

export default EditAppeal;
