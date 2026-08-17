import React, { useEffect, useState } from 'react';
import axiosInstance from '../../../../utils/axios';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';
import { PrimaryButton } from '../../../common/buttons';
import {
  ACTIVITY_TYPE_OPTIONS,
  RESPONSE_TYPE_OPTIONS,
  INTERACTION_STATUS_OPTIONS,
  toDatetimeLocalValue,
} from './constants';
import '../donor-relationship.css';

const InteractionEditModal = ({ open, interaction, onClose, onSaved }) => {
  const [form, setForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!interaction) return;
    setForm({
      activity_type: interaction.activity_type || 'call',
      custom_activity_title: interaction.custom_activity_title || '',
      user_action_text: interaction.user_action_text || '',
      donor_response_text: interaction.donor_response_text || '',
      donor_response_type: interaction.donor_response_type || '',
      next_action_text: interaction.next_action_text || '',
      next_followup_datetime: toDatetimeLocalValue(interaction.next_followup_datetime),
      status: interaction.status || 'need_followup',
      activity_datetime: toDatetimeLocalValue(interaction.activity_datetime),
    });
    setError('');
  }, [interaction]);

  if (!open || !interaction || !form) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.user_action_text?.trim()) {
      setError('Please describe what you did');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const payload = {
        activity_type: form.activity_type,
        custom_activity_title:
          form.activity_type === 'custom' ? form.custom_activity_title : null,
        user_action_text: form.user_action_text,
        donor_response_text: form.donor_response_text || null,
        donor_response_type: form.donor_response_type || null,
        next_action_text: form.next_action_text || null,
        next_followup_datetime: form.next_followup_datetime || null,
        status: form.status,
        activity_datetime: form.activity_datetime || undefined,
      };

      const res = await axiosInstance.patch(
        `/donor-relationship/interactions/${interaction.id}`,
        payload,
      );
      if (res.data.success) {
        onSaved?.(res.data.data);
        onClose();
      } else {
        setError(res.data.message || 'Failed to update interaction');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update interaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="donor-relationship-modal-overlay">
      <div className="donor-relationship-modal">
        <div className="donor-relationship-modal__header">
          <h3>Edit interaction</h3>
          <button type="button" className="donor-relationship-modal__close" onClick={onClose}>
            &times;
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-grid-2">
            <FormSelect
              name="activity_type"
              label="Activity type"
              value={form.activity_type}
              onChange={handleChange}
              options={ACTIVITY_TYPE_OPTIONS}
              required
            />

            {form.activity_type === 'custom' && (
              <FormInput
                name="custom_activity_title"
                label="Custom activity title"
                value={form.custom_activity_title}
                onChange={handleChange}
                required
              />
            )}

            <FormSelect
              name="status"
              label="Status"
              value={form.status}
              onChange={handleChange}
              options={INTERACTION_STATUS_OPTIONS}
            />

            <FormSelect
              name="donor_response_type"
              label="Donor response type"
              value={form.donor_response_type}
              onChange={handleChange}
              options={RESPONSE_TYPE_OPTIONS}
            />

            <FormInput
              name="activity_datetime"
              label="Activity date & time"
              type="datetime-local"
              value={form.activity_datetime}
              onChange={handleChange}
            />

            <FormInput
              name="next_followup_datetime"
              label="Follow-up date & time"
              type="datetime-local"
              value={form.next_followup_datetime}
              onChange={handleChange}
            />
          </div>

          <FormTextarea
            name="user_action_text"
            label="What did you do?"
            value={form.user_action_text}
            onChange={handleChange}
            rows={3}
            required
          />

          <FormTextarea
            name="donor_response_text"
            label="Donor response"
            value={form.donor_response_text}
            onChange={handleChange}
            rows={3}
          />

          <FormTextarea
            name="next_action_text"
            label="Next step"
            value={form.next_action_text}
            onChange={handleChange}
            rows={2}
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

export default InteractionEditModal;
