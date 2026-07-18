import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';

const AddAlHasanainClg = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    total_students: 0,
    attendance_percent: 0,
    dropout_rate: 0,
    pass_rate: 0,
    fee_collection: 0,
    active_teachers: 0,
  });

  const onChange = (key) => (e) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await axiosInstance.post('/program/al-hasanain-clg', {
        total_students: Number(form.total_students) || 0,
        attendance_percent: Number(form.attendance_percent) || 0,
        dropout_rate: Number(form.dropout_rate) || 0,
        pass_rate: Number(form.pass_rate) || 0,
        fee_collection: Number(form.fee_collection) || 0,
        active_teachers: Number(form.active_teachers) || 0,
      });
      navigate('/program/al_hasanain_clg');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="form-wrapper">
        <PageHeader title="New Al Hasanain CLG entry" showBackButton backPath="/program/al_hasanain_clg" />
        <div className="form-content">
          <form onSubmit={handleSubmit}>
            {error && <div className="status-message status-message--error">{error}</div>}

            <div className="form-grid">
              <FormInput
                name="total_students"
                label="Total students"
                type="number"
                min={0}
                value={String(form.total_students)}
                onChange={onChange('total_students')}
                required
              />
              <FormInput
                name="active_teachers"
                label="Active teachers"
                type="number"
                min={0}
                value={String(form.active_teachers)}
                onChange={onChange('active_teachers')}
                required
              />
              <FormInput
                name="attendance_percent"
                label="Attendance %"
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={String(form.attendance_percent)}
                onChange={onChange('attendance_percent')}
                required
              />
              <FormInput
                name="dropout_rate"
                label="Dropout rate %"
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={String(form.dropout_rate)}
                onChange={onChange('dropout_rate')}
                required
              />
              <FormInput
                name="pass_rate"
                label="Pass rate %"
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={String(form.pass_rate)}
                onChange={onChange('pass_rate')}
                required
              />
              <FormInput
                name="fee_collection"
                label="Fee collection"
                type="number"
                min={0}
                step="0.01"
                value={String(form.fee_collection)}
                onChange={onChange('fee_collection')}
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddAlHasanainClg;

