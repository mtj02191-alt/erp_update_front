import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';

const TrackersAdd = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({
    template_id: '',
    donation_id: '',
    donor_visible: true,
  });

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axiosInstance.get('/progress/workflow-templates');
        if (res.data?.success) {
          setTemplates(res.data.data || []);
        } else {
          setError(res.data?.message || 'Failed to load templates');
        }
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load templates');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const templateOptions = useMemo(() => {
    const opts = (templates || [])
      .filter((t) => t && t.is_active !== false)
      .map((t) => ({ value: String(t.id), label: `${t.name} (${t.code})` }));
    return [{ value: '', label: 'Select template' }, ...opts];
  }, [templates]);

  const create = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        template_id: Number(form.template_id),
        donation_id: form.donation_id ? Number(form.donation_id) : undefined,
        donor_visible: Boolean(form.donor_visible),
      };
      const res = await axiosInstance.post('/progress/trackers', payload);
      if (res.data?.success && res.data?.data?.id) {
        navigate(`/progress/trackers/${res.data.data.id}`);
        return;
      }
      setError(res.data?.message || 'Failed to create tracker');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create tracker');
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = Boolean(form.template_id);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader title="Create Progress Tracker" showBackButton={true} backPath="/progress/trackers" />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="view-wrapper">
        <PageHeader title="Create Progress Tracker" showBackButton={true} backPath="/progress/trackers" />
        <div className="view-content">
          {error && (
            <div className="status-message status-message--error" style={{ marginBottom: 12 }}>
              {error}
            </div>
          )}

          <div className="view-section">
            <h3 className="view-section-title">Tracker</h3>
            <div className="form-grid-2">
              <FormSelect
                label="Template"
                name="template_id"
                value={form.template_id}
                onChange={(e) => setForm((p) => ({ ...p, template_id: e.target.value }))}
                options={templateOptions}
              />
              <FormInput
                label="Donation ID (optional)"
                name="donation_id"
                type="number"
                value={form.donation_id}
                onChange={(e) => setForm((p) => ({ ...p, donation_id: e.target.value }))}
                placeholder="Link to an online donation"
              />
              <FormSelect
                label="Donor Visible"
                name="donor_visible"
                value={form.donor_visible ? 'true' : 'false'}
                onChange={(e) => setForm((p) => ({ ...p, donor_visible: e.target.value === 'true' }))}
                options={[
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' },
                ]}
              />
            </div>

            <div className="form-actions">
              <button type="button" className="primary_btn" onClick={create} disabled={saving || !canSubmit}>
                {saving ? 'Creating...' : 'Create'}
              </button>
              <button type="button" className="secondary_btn" onClick={() => navigate('/progress/trackers')} disabled={saving}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TrackersAdd;

