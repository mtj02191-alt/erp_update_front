import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';

const UpdateDreamSchool = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ school_code: '', student_count: 0, location: '', kawish_id: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get(`/program/dream-schools/${id}`);
        if (res.data.success) {
          const d = res.data.data;
          setForm({
            school_code: d.school_code || '',
            student_count: d.student_count ?? 0,
            location: d.location || '',
            kawish_id: d.kawish_id || '',
          });
        } else {
          setError(res.data.message || 'Failed to load');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await axiosInstance.patch(`/program/dream-schools/${id}`, {
        student_count: Number(form.student_count) || 0,
        location: form.location.trim(),
        kawish_id: form.kawish_id.trim(),
      });
      navigate('/program/dream_schools');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="form-wrapper">
          <div className="status-message">Loading…</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="form-wrapper">
        <PageHeader title="Update Dream School" showBackButton={true} backPath="/program/dream_schools" />
        <div className="form-content">
          <form onSubmit={handleSubmit}>
            {error && <div className="status-message status-message--error">{error}</div>}
            <div className="form-grid">
              <FormInput name="school_code" label="School ID" value={form.school_code} onChange={() => {}} disabled />
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
                {submitting ? 'Saving…' : 'Update'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UpdateDreamSchool;
