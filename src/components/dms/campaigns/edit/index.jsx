import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';
import Navbar from '../../../Navbar';
import {
  TARGET_FREQUENCY_OPTIONS,
  emptyCommunicationTemplates,
  communicationTemplatesFromApi,
  communicationTemplatesToApi,
} from '../campaignConstants';
import CampaignCommunicationSection from '../CampaignCommunicationSection';
import CampaignDonationItemsSection from '../CampaignDonationItemsSection';
import CampaignProgramFields, { parseOptionalCampaignId } from '../CampaignProgramFields';

const EditCampaign = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    status: 'draft',
    goal_amount: '',
    currency: 'PKR',
    start_at: '',
    end_at: '',
    is_featured: false,
    is_recurring: false,
    target_frequency: 'monthly',
    monthly_donor_automation_enabled: false,
    use_default_thanks_and_reminders: false,
    communication_templates: emptyCommunicationTemplates(),
    program_id: '',
    sub_program_id: '',
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/campaigns/${id}`);
      if (response.data.success) {
        const c = response.data.data;
        setForm({
          title: c.title || '',
          slug: c.slug || '',
          description: c.description || '',
          status: c.status || 'draft',
          goal_amount: c.goal_amount != null ? String(c.goal_amount) : '',
          currency: c.currency || 'PKR',
          start_at: c.start_at ? new Date(c.start_at).toISOString().slice(0, 16) : '',
          end_at: c.end_at ? new Date(c.end_at).toISOString().slice(0, 16) : '',
          is_featured: c.is_featured ?? false,
          is_recurring: c.is_recurring ?? false,
          target_frequency: c.target_frequency || 'monthly',
          monthly_donor_automation_enabled: c.monthly_donor_automation_enabled ?? false,
          use_default_thanks_and_reminders: c.use_default_thanks_and_reminders ?? false,
          communication_templates: communicationTemplatesFromApi(c.communication_templates),
          program_id: c.program_id != null ? String(c.program_id) : '',
          sub_program_id: c.sub_program_id != null ? String(c.sub_program_id) : '',
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch campaign');
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

  const handleToggleAutomation = (e) => {
    setForm((prev) => ({
      ...prev,
      monthly_donor_automation_enabled: e.target.checked,
      ...(e.target.checked
        ? {}
        : { use_default_thanks_and_reminders: false }),
    }));
  };

  const handleToggleDefaultComm = (e) => {
    setForm((prev) => ({
      ...prev,
      use_default_thanks_and_reminders: e.target.checked,
    }));
  };

  const handleSlotChange = (slotKey, field, value) => {
    setForm((prev) => ({
      ...prev,
      communication_templates: {
        ...prev.communication_templates,
        [slotKey]: {
          ...prev.communication_templates[slotKey],
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (form.start_at && form.end_at && new Date(form.start_at) >= new Date(form.end_at)) {
      setError('Start date must be before end date');
      setIsSubmitting(false);
      return;
    }

    if (form.is_recurring && !form.target_frequency) {
      setError('Please select a target frequency for recurring campaigns');
      setIsSubmitting(false);
      return;
    }

    try {
      const campaignData = {
        ...form,
        goal_amount: form.goal_amount ? parseFloat(form.goal_amount) : null,
        is_recurring: form.is_recurring,
        target_frequency: form.is_recurring ? form.target_frequency : null,
        monthly_donor_automation_enabled: form.is_recurring ? form.monthly_donor_automation_enabled : false,
        use_default_thanks_and_reminders:
          form.is_recurring && form.monthly_donor_automation_enabled
            ? form.use_default_thanks_and_reminders
            : false,
        communication_templates: form.is_recurring
          ? communicationTemplatesToApi(form.communication_templates)
          : null,
        program_id: parseOptionalCampaignId(form.program_id),
        sub_program_id: parseOptionalCampaignId(form.sub_program_id),
      };

      await axiosInstance.patch(`/campaigns/${id}`, campaignData);
      navigate(`/dms/campaigns/view/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => navigate(`/dms/campaigns/view/${id}`);

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'ended', label: 'Ended' },
    { value: 'archived', label: 'Archived' }
  ];

  const currencyOptions = [
    { value: 'PKR', label: 'PKR' },
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' },
    { value: 'GBP', label: 'GBP' }
  ];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading campaign...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader title="Edit Campaign" onBack={handleBack} />

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

              <FormInput
                label="Slug"
                type="text"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                maxLength={220}
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
              <FormSelect
                label="Status"
                name="status"
                value={form.status}
                onChange={handleChange}
                options={statusOptions}
              />

              <FormInput
                label={form.is_recurring ? 'Target per period' : 'Goal Amount'}
                type="number"
                name="goal_amount"
                value={form.goal_amount}
                onChange={handleChange}
                min={0}
                step="0.01"
              />
            </div>
          </div>

          <div className="form-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: form.is_recurring ? '16px' : 0 }}>
              <input
                type="checkbox"
                id="is_recurring"
                name="is_recurring"
                checked={form.is_recurring}
                onChange={handleChange}
                style={{ width: '18px', height: '18px' }}
              />
              <label htmlFor="is_recurring" style={{ cursor: 'pointer' }}>
                Recurring campaign (goal applies each period)
              </label>
            </div>
            {form.is_recurring && (
              <FormSelect
                label="Target frequency"
                name="target_frequency"
                value={form.target_frequency}
                onChange={handleChange}
                options={TARGET_FREQUENCY_OPTIONS}
                required
              />
            )}
          </div>

          <CampaignCommunicationSection
            form={form}
            onToggleAutomation={handleToggleAutomation}
            onToggleDefaultComm={handleToggleDefaultComm}
            onSlotChange={handleSlotChange}
          />

          <CampaignDonationItemsSection
            campaignId={Number(id)}
            defaultCurrency={form.currency || 'PKR'}
            isRecurring={form.is_recurring}
          />

          <CampaignProgramFields
            programId={form.program_id}
            subProgramId={form.sub_program_id}
            onProgramChange={(value) =>
              setForm((prev) => ({ ...prev, program_id: value }))
            }
            onSubProgramChange={(value) =>
              setForm((prev) => ({ ...prev, sub_program_id: value }))
            }
          />

          <div className="form-section">
            <div className="form-grid-2">
              <FormSelect
                label="Currency"
                name="currency"
                value={form.currency}
                onChange={handleChange}
                options={currencyOptions}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '25px' }}>
                <input
                  type="checkbox"
                  id="is_featured"
                  name="is_featured"
                  checked={form.is_featured}
                  onChange={handleChange}
                  style={{ width: '18px', height: '18px' }}
                />
                <label htmlFor="is_featured" style={{ cursor: 'pointer' }}>
                  Featured Campaign
                </label>
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-grid-2">
              <FormInput
                label="Start Date & Time"
                type="datetime-local"
                name="start_at"
                value={form.start_at}
                onChange={handleChange}
              />

              <FormInput
                label="End Date & Time"
                type="datetime-local"
                name="end_at"
                value={form.end_at}
                onChange={handleChange}
              />
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

export default EditCampaign;
