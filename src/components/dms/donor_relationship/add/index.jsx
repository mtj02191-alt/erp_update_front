import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';
import { PrimaryButton } from '../../../common/buttons';
import {
  ACTIVITY_TYPE_OPTIONS,
  RESPONSE_TYPE_OPTIONS,
  INTERACTION_STATUS_OPTIONS,
} from '../shared/constants';
import '../donor-relationship.css';

const AddDonorInteraction = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedDonorId = searchParams.get('donor_id') || '';

  const [donors, setDonors] = useState([]);
  const [loadingDonors, setLoadingDonors] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    donor_id: preselectedDonorId,
    activity_type: 'call',
    custom_activity_title: '',
    user_action_text: '',
    donor_response_text: '',
    donor_response_type: '',
    next_action_text: '',
    next_followup_datetime: '',
    status: 'need_followup',
  });

  const donorOptions = useMemo(
    () => [
      { value: '', label: 'Select donor' },
      ...donors.map((d) => ({
        value: String(d.id),
        label: `${d.name || 'Unnamed'} (${d.phone || d.email || d.id})`,
      })),
    ],
    [donors],
  );

  useEffect(() => {
    const loadDonors = async () => {
      try {
        setLoadingDonors(true);
        const res = await axiosInstance.get('/donor-relationship/assigned-donors');
        if (res.data.success) {
          setDonors(res.data.data || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load assigned donors');
      } finally {
        setLoadingDonors(false);
      }
    };
    loadDonors();
  }, []);

  useEffect(() => {
    if (preselectedDonorId) {
      setForm((prev) => ({ ...prev, donor_id: preselectedDonorId }));
    }
  }, [preselectedDonorId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.donor_id) {
      setError('Please select a donor');
      return;
    }
    if (!form.user_action_text?.trim()) {
      setError('Please describe what you did');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const payload = {
        donor_id: Number(form.donor_id),
        activity_type: form.activity_type,
        custom_activity_title:
          form.activity_type === 'custom' ? form.custom_activity_title : undefined,
        user_action_text: form.user_action_text,
        donor_response_text: form.donor_response_text || undefined,
        donor_response_type: form.donor_response_type || undefined,
        next_action_text: form.next_action_text || undefined,
        next_followup_datetime: form.next_followup_datetime || undefined,
        status: form.status,
      };

      const response = await axiosInstance.post('/donor-relationship/interactions', payload);
      if (response.data.success) {
        const donorId = form.donor_id;
        navigate(`/dms/donors/view/${donorId}?tab=journey`, {
          state: { flashMessage: 'Interaction recorded successfully' },
        });
      } else {
        setError(response.data.message || 'Failed to save interaction');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save interaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader
          title="Add Donor Interaction"
          backPath="/dms/donor-relationship/follow-ups"
        />

        {error && (
          <div className="reconciliation-summary reconciliation-summary--error">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="form reconciliation-upload-card">
          <div className="form-section">
            <p className="reconciliation-notes">
              Record what you did and how the donor responded. You can only add interactions
              for donors assigned to you.
            </p>

            <div className="form-grid-2">
              <FormSelect
                name="donor_id"
                label="Donor"
                value={form.donor_id}
                onChange={handleChange}
                options={donorOptions}
                required
                disabled={loadingDonors}
              />

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
                Save interaction
              </PrimaryButton>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddDonorInteraction;
