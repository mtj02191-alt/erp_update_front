import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';

const AddDreamSchool = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    student_count: 0,
    location: '',
    kawish_id: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.location.trim()) return setError('Location is required');
    if (!form.kawish_id.trim()) return setError('Kawish ID is required');
    setSubmitting(true);
    try {
      await axiosInstance.post('/program/dream-schools', {
        student_count: Number(form.student_count) || 0,
        location: form.location.trim(),
        kawish_id: form.kawish_id.trim(),
      });
      navigate('/program/dream_schools');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create dream school');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="form-wrapper">
        <PageHeader title="Register Dream School" showBackButton={true} backPath="/program/dream_schools" />
        <div className="form-content">
          <p className="status-message" style={{ marginBottom: '1rem' }}>
            School ID (e.g. MTJF-EDU/DS-25-02) is generated automatically when you save.
          </p>
          <form onSubmit={handleSubmit}>
            {error && <div className="status-message status-message--error">{error}</div>}
            <div className="form-grid">
              <FormInput
                name="student_count"
                label="No. of students"
                type="number"
                min={0}
                value={String(form.student_count)}
                onChange={(e) => setForm((p) => ({ ...p, student_count: e.target.value }))}
                required
              />
              <FormInput
                name="location"
                label="Location"
                value={form.location}
                onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                required
              />
              <FormInput
                name="kawish_id"
                label="Kawish ID"
                value={form.kawish_id}
                onChange={(e) => setForm((p) => ({ ...p, kawish_id: e.target.value }))}
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="primary_btn" disabled={submitting}>
                {submitting ? 'Saving…' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddDreamSchool;
