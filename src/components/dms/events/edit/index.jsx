import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';
import Navbar from '../../../Navbar';

const EditEvent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
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
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/events/${id}`);
      if (response.data.success) {
        const event = response.data.data;
        setForm({
          title: event.title || '',
          description: event.description || '',
          status: event.status || 'draft',
          event_type: event.event_type || '',
          start_at: event.start_at ? new Date(event.start_at).toISOString().slice(0, 16) : '',
          end_at: event.end_at ? new Date(event.end_at).toISOString().slice(0, 16) : '',
          location: event.location || '',
          is_public: event.is_public ?? true,
          allowed_attendees: event.allowed_attendees || 0
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch event');
    } finally {
      setLoading(false);
    }
  };

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

      await axiosInstance.patch(`/events/${id}`, eventData);
      navigate(`/dms/events/view/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => navigate(`/dms/events/view/${id}`);

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const eventTypeOptions = [
    { value: '', label: 'Select Type' },
    { value: 'fundraising', label: 'Fundraising' },
    { value: 'awareness', label: 'Awareness' },
    { value: 'medical', label: 'Medical' },
    { value: 'internal', label: 'Internal' }
  ];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading event...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader title="Edit Event" onBack={handleBack} />

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
                  Public Event
                </label>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="secondary_btn" onClick={handleBack}>
              Cancel
            </button>
            <button type="submit" className="primary_btn" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default EditEvent;
