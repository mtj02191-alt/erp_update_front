import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';

const UpdateAlHasanainClg = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get(`/program/al-hasanain-clg/${id}`);
        if (res.data?.success && res.data?.data) {
          const d = res.data.data;
          setForm({
            total_students: d.total_students ?? 0,
            attendance_percent: d.attendance_percent ?? 0,
            dropout_rate: d.dropout_rate ?? 0,
            pass_rate: d.pass_rate ?? 0,
            fee_collection: d.fee_collection ?? 0,
            active_teachers: d.active_teachers ?? 0,
          });
          setError('');
        } else {
          setError(res.data?.message || 'Failed to load');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const onChange = (key) => (e) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await axiosInstance.patch(`/program/al-hasanain-clg/${id}`, {
        total_students: Number(form.total_students) || 0,
        attendance_percent: Number(form.attendance_percent) || 0,
        dropout_rate: Number(form.dropout_rate) || 0,
        pass_rate: Number(form.pass_rate) || 0,
        fee_collection: Number(form.fee_collection) || 0,
        active_teachers: Number(form.active_teachers) || 0,
      });
      navigate('/program/al_hasanain_clg');
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
        <PageHeader title="Edit Al Hasanain CLG entry" showBackButton backPath="/program/al_hasanain_clg" />
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
                {submitting ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UpdateAlHasanainClg;

