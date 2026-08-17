import React, { useEffect, useState } from 'react';
import axiosInstance from '../../../../utils/axios';
import FormInput from '../../../common/FormInput';
import FormTextarea from '../../../common/FormTextarea';
import { PrimaryButton } from '../../../common/buttons';
import { toDatetimeLocalValue } from './constants';
import '../donor-relationship.css';

const FollowupEditModal = ({ open, followup, onClose, onSaved }) => {
  const [form, setForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!followup) return;
    setForm({
      followup_title: followup.followup_title || '',
      followup_reason: followup.followup_reason || '',
      due_datetime: toDatetimeLocalValue(followup.due_datetime),
    });
    setError('');
  }, [followup]);

  if (!open || !followup || !form) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.followup_title?.trim()) {
      setError('Follow-up title is required');
      return;
    }
    if (!form.due_datetime) {
      setError('Due date & time is required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await axiosInstance.patch(`/donor-relationship/follow-ups/${followup.id}`, {
        followup_title: form.followup_title,
        followup_reason: form.followup_reason || null,
        due_datetime: form.due_datetime,
      });
      if (res.data.success) {
        onSaved?.(res.data.data);
        onClose();
      } else {
        setError(res.data.message || 'Failed to update follow-up');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update follow-up');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="donor-relationship-modal-overlay">
      <div className="donor-relationship-modal">
        <div className="donor-relationship-modal__header">
          <h3>Edit follow-up</h3>
          <button type="button" className="donor-relationship-modal__close" onClick={onClose}>
            &times;
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="form">
          <FormInput
            name="followup_title"
            label="Title"
            value={form.followup_title}
            onChange={handleChange}
            required
          />

          <FormTextarea
            name="followup_reason"
            label="Reason / notes"
            value={form.followup_reason}
            onChange={handleChange}
            rows={3}
          />

          <FormInput
            name="due_datetime"
            label="Due date & time"
            type="datetime-local"
            value={form.due_datetime}
            onChange={handleChange}
            required
          />

          <div className="form-actions">
            <PrimaryButton type="submit" loading={submitting} loadingText="Saving…">
              Save changes
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FollowupEditModal;
