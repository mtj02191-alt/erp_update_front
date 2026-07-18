import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';
import Navbar from '../../../Navbar';

const AddEvent = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'draft',
    event_type: '',
    start_at: '',
    end_at: '',
    location: '',
    is_public: true,
    allowed_attendees: 0
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

    // Validate dates
    if (new Date(form.start_at) >= new Date(form.end_at)) {
      setError('Start date must be before end date');
      setIsSubmitting(false);
      return;
    }

    try {
      const eventData = {
        ...form,
        allowed_attendees: parseInt(form.allowed_attendees) || 0
      };

      await axiosInstance.post('/events', eventData);
      navigate('/dms/events/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create event');
      console.error('Error creating event:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => navigate('/dms/events/list');

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'ongoing', label: 'Ongoing' }
  ];

  const eventTypeOptions = [
    { value: '', label: 'Select Type' },
    { value: 'fundraising', label: 'Fundraising' },
    { value: 'awareness', label: 'Awareness' },
    { value: 'medical', label: 'Medical' },
    { value: 'internal', label: 'Internal' }
  ];

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader title="Create Event" onBack={handleBack} />

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

              <FormSelect
                label="Event Type"
                name="event_type"
                value={form.event_type}
                onChange={handleChange}
                options={eventTypeOptions}
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
              placeholder="Event description..."
            />
          </div>

          <div className="form-section">
            <div className="form-grid-2">
              <FormInput
                label="Start Date & Time"
                type="datetime-local"
                name="start_at"
                value={form.start_at}
                onChange={handleChange}
                required
              />

              <FormInput
                label="End Date & Time"
                type="datetime-local"
                name="end_at"
                value={form.end_at}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-section">
            <div className="form-grid-2">
              <FormInput
                label="Location"
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Event venue..."
              />

              <FormInput
                label="Capacity (Allowed Attendees)"
                type="number"
                name="allowed_attendees"
                value={form.allowed_attendees}
                onChange={handleChange}
                min={0}
                required
              />
            </div>
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '25px' }}>
                <input
                  type="checkbox"
                  id="is_public"
                  name="is_public"
                  checked={form.is_public}
                  onChange={handleChange}
                  style={{ width: '18px', height: '18px' }}
                />
                <label htmlFor="is_public" style={{ cursor: 'pointer' }}>
                  Public Event (visible on website)
                </label>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="secondary_btn"
              onClick={handleBack}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary_btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddEvent;
