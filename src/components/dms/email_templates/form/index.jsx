import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormTextarea from '../../../common/FormTextarea';
import MultiSelect from '../../../common/MultiSelect';
import EmailBodyEditor from './EmailBodyEditor';
import {
  TEMPLATE_CHANNELS,
  TEMPLATE_PURPOSES,
  TEMPLATE_STATUSES,
  TEMPLATE_VARIABLES,
  CTA_BUTTON_TEXT_OPTIONS,
  toArray,
  firstOrNull,
} from '../templateConstants';

const EMPTY_FORM = {
  name: '',
  subject: '',
  body: '',
  description: '',
  channels: [],
  purposes: [],
  campaign_ids: [],
  appeal_ids: [],
  event_ids: [],
  cta_button_text: [],
  cta_url: '',
  variables: [],
  statuses: ['draft'],
  category: 'general',
};

const EmailTemplateForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [campaignOptions, setCampaignOptions] = useState([]);
  const [appealOptions, setAppealOptions] = useState([]);
  const [eventOptions, setEventOptions] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [testChannel, setTestChannel] = useState('email');
  const [testRecipient, setTestRecipient] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const bodyEditorRef = useRef(null);

  const loadRelatedOptions = useCallback(async () => {
    try {
      const [campaignsRes, appealsRes, eventsRes] = await Promise.all([
        axiosInstance.get('/campaigns', { params: { page: 1, pageSize: 500 } }),
        axiosInstance.get('/appeals', { params: { page: 1, pageSize: 500 } }),
        axiosInstance.get('/events', { params: { page: 1, pageSize: 500 } }),
      ]);

      const mapOptions = (res) =>
        (res.data?.data || []).map((item) => ({
          value: String(item.id),
          label: item.title || item.name || `#${item.id}`,
        }));

      setCampaignOptions(mapOptions(campaignsRes));
      setAppealOptions(mapOptions(appealsRes));
      setEventOptions(mapOptions(eventsRes));
    } catch (err) {
      console.error('Failed to load related options', err);
    }
  }, []);

  useEffect(() => {
    loadRelatedOptions();
    if (id) fetchTemplate();
  }, [id, loadRelatedOptions]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/email-templates/${id}`);
      if (response.data.success) {
        const data = response.data.data;
        setForm({
          name: data.name || '',
          subject: data.subject || '',
          body: data.body || '',
          description: data.description || '',
          channels: toArray(data.channels),
          purposes: toArray(data.purposes),
          campaign_ids: toArray(data.campaign_ids),
          appeal_ids: toArray(data.appeal_ids),
          event_ids: toArray(data.event_ids),
          cta_button_text: data.cta_button_text ? [data.cta_button_text] : [],
          cta_url: data.cta_url || '',
          variables: toArray(data.variables),
          statuses: data.status ? [data.status] : ['draft'],
          category: data.category || 'general',
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch template');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resolveSuggestedCtaUrl = async (nextForm) => {
    if (id) {
      try {
        const res = await axiosInstance.get(`/email-templates/suggested-cta/${id}`);
        if (res.data?.data?.cta_url) {
          updateField('cta_url', res.data.data.cta_url);
          return;
        }
      } catch {
        // fall through to client-side hint
      }
    }
    const base = window.location.origin;
    const campaignId = firstOrNull(nextForm.campaign_ids);
    const appealId = firstOrNull(nextForm.appeal_ids);
    const eventId = firstOrNull(nextForm.event_ids);
    if (campaignId) {
      const campaign = campaignOptions.find((o) => o.value === campaignId);
      if (campaign) updateField('cta_url', `${base}/campaigns/${campaign.label}`);
    } else if (appealId) {
      updateField('cta_url', `${base}/appeals/${appealId}`);
    } else if (eventId) {
      updateField('cta_url', `${base}/events/${eventId}`);
    }
  };

  const handleRelatedChange = (key, value) => {
    const nextForm = { ...form, [key]: value };
    setForm(nextForm);
    if (!form.cta_url && value?.length) {
      resolveSuggestedCtaUrl(nextForm);
    }
  };

  const buildPayload = () => ({
    name: form.name,
    subject: form.subject || null,
    body: form.body,
    description: form.description || null,
    channels: form.channels.length ? form.channels : null,
    purposes: form.purposes.length ? form.purposes : null,
    campaign_ids: form.campaign_ids.length ? form.campaign_ids : null,
    appeal_ids: form.appeal_ids.length ? form.appeal_ids : null,
    event_ids: form.event_ids.length ? form.event_ids : null,
    cta_button_text: firstOrNull(form.cta_button_text),
    cta_url: form.cta_url || null,
    variables: form.variables.length ? form.variables : null,
    status: firstOrNull(form.statuses) || 'draft',
    category: firstOrNull(form.purposes) || form.category || 'general',
    is_active: (firstOrNull(form.statuses) || 'draft') === 'active',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = buildPayload();
      const bodyText = String(payload.body || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .trim();
      if (!bodyText) {
        setError('Message content is required');
        setLoading(false);
        return;
      }
      if (payload.channels?.includes('email') && !payload.subject?.trim()) {
        setError('Subject is required when Email channel is selected');
        setLoading(false);
        return;
      }
      if (id) {
        await axiosInstance.patch(`/email-templates/${id}`, payload);
      } else {
        await axiosInstance.post('/email-templates', payload);
      }
      navigate('/dms/email_templates/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    setLoading(true);
    setTestMessage('');
    try {
      let response;
      if (id) {
        response = await axiosInstance.post(`/email-templates/${id}/preview`, {
          sample_data: {},
        });
      } else {
        setPreviewData({
          subject: form.subject,
          body: form.body,
          context: {},
        });
        setLoading(false);
        return;
      }
      if (response.data.success) {
        setPreviewData(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Preview failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTestSend = async () => {
    if (!id) {
      setTestMessage('Save the template first before sending a test message.');
      return;
    }
    if (!testRecipient.trim()) {
      setTestMessage('Enter a test recipient.');
      return;
    }
    setLoading(true);
    setTestMessage('');
    try {
      const response = await axiosInstance.post(`/email-templates/${id}/test-send`, {
        channel: testChannel,
        recipient: testRecipient,
        sample_data: {},
      });
      setTestMessage(
        response.data.success
          ? 'Test message sent successfully.'
          : response.data.data?.message || 'Test send failed.',
      );
    } catch (err) {
      setTestMessage(err.response?.data?.message || 'Test send failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInsertVariable = (variableKey) => {
    const token = `{{${variableKey}}}`;
    if (bodyEditorRef.current?.insertToken) {
      bodyEditorRef.current.insertToken(token);
    } else {
      updateField('body', form.body ? `${form.body} ${token}` : token);
    }
    if (!form.variables.includes(variableKey)) {
      updateField('variables', [...form.variables, variableKey]);
    }
  };

  const handleBack = () => navigate('/dms/email_templates/list');

  if (loading && id && !form.name) {
    return (
      <>
        <Navbar />
        <div className="form-content"><div className="loading">Loading...</div></div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader
          title={id ? 'Edit Communication Template' : 'Create Communication Template'}
          onBack={handleBack}
        />

        <div className="form-card card">
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <FormInput
                label="Template Name"
                name="name"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g. Ramadan Campaign Invite"
                required
              />

              <MultiSelect
                label="Channels"
                name="channels"
                options={TEMPLATE_CHANNELS}
                value={form.channels}
                onChange={(value) => updateField('channels', value)}
                placeholder="Select channels (optional)"
              />

              <MultiSelect
                label="Purpose"
                name="purposes"
                options={TEMPLATE_PURPOSES}
                value={form.purposes}
                onChange={(value) => updateField('purposes', value)}
                placeholder="Select purpose (optional)"
              />

              <MultiSelect
                label="Save Status"
                name="statuses"
                options={TEMPLATE_STATUSES}
                value={form.statuses}
                onChange={(value) => updateField('statuses', value)}
                placeholder="Draft / Active / Archived"
              />
            </div>

            <div className="form-grid">
              <MultiSelect
                label="Related Campaigns"
                name="campaign_ids"
                options={campaignOptions}
                value={form.campaign_ids}
                onChange={(value) => handleRelatedChange('campaign_ids', value)}
                placeholder="Select campaigns (optional)"
              />
              <MultiSelect
                label="Related Appeals"
                name="appeal_ids"
                options={appealOptions}
                value={form.appeal_ids}
                onChange={(value) => handleRelatedChange('appeal_ids', value)}
                placeholder="Select appeals (optional)"
              />
              <MultiSelect
                label="Related Events"
                name="event_ids"
                options={eventOptions}
                value={form.event_ids}
                onChange={(value) => handleRelatedChange('event_ids', value)}
                placeholder="Select events (optional)"
              />
            </div>

            <div className="form-grid">
              <FormInput
                label="Email Subject"
                name="subject"
                value={form.subject}
                onChange={(e) => updateField('subject', e.target.value)}
                placeholder="Subject for email channel"
              />
              <MultiSelect
                label="CTA Button Text"
                name="cta_button_text"
                options={CTA_BUTTON_TEXT_OPTIONS}
                value={form.cta_button_text}
                onChange={(value) => updateField('cta_button_text', value)}
                placeholder="Donate Now, View Event... (optional)"
              />
              <FormInput
                label="CTA URL"
                name="cta_url"
                value={form.cta_url}
                onChange={(e) => updateField('cta_url', e.target.value)}
                placeholder="Auto-filled from campaign/appeal/event or enter manually"
              />
            </div>

            <MultiSelect
              label="Template Variables"
              name="variables"
              options={TEMPLATE_VARIABLES}
              value={form.variables}
              onChange={(value) => updateField('variables', value)}
              placeholder="Select variables used in this template (optional)"
            />



            <p style={{ margin: '0 0 8px', fontSize: 13, color: '#6b7280' }}>
              Click a name below to insert it into the message (e.g. donor name). Place the cursor where you want it first.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {TEMPLATE_VARIABLES.map((v) => (
                <button
                  key={v.value}
                  type="button"
                  className="secondary-btn"
                  style={{ fontSize: 12, padding: '4px 10px' }}
                  onClick={() => handleInsertVariable(v.value)}
                >
                  Insert {v.label}
                </button>
              ))}
            </div>

            <EmailBodyEditor
              ref={bodyEditorRef}
              label="Message Content"
              value={form.body}
              onChange={(html) => updateField('body', html)}
              required
            />
            <FormTextarea
              label="Internal Notes (not sent in email)"
              name="description"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Staff-only notes. Recipients will not see this."
            />
            <div className="form-actions" style={{ flexWrap: 'wrap', gap: 10 }}>
              <button type="button" className="secondary-btn" onClick={handleBack}>
                Cancel
              </button>
              <button type="button" className="secondary-btn" onClick={handlePreview} disabled={loading}>
                Preview
              </button>
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </form>

          {id && (
            <div className="card" style={{ marginTop: 24, padding: 16 }}>
              <h3 style={{ marginTop: 0 }}>Send Test Message</h3>
              <div className="form-grid">
                <MultiSelect
                  label="Test Channel"
                  name="testChannel"
                  options={TEMPLATE_CHANNELS}
                  value={testChannel ? [testChannel] : []}
                  onChange={(value) => setTestChannel(firstOrNull(value) || 'email')}
                  placeholder="Select channel"
                />
                <FormInput
                  label="Test Recipient"
                  name="testRecipient"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="Email address or phone number"
                />
              </div>
              <button type="button" className="primary-btn" onClick={handleTestSend} disabled={loading}>
                Send Test
              </button>
              {testMessage && <p style={{ marginTop: 12 }}>{testMessage}</p>}
            </div>
          )}
          {previewData && (
            <div className="card" style={{ marginTop: 24, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ marginTop: 0 }}>Preview</h3>
                <button type="button" className="secondary-btn" onClick={() => setPreviewData(null)}>
                  Close Preview
                </button>
              </div>
              {previewData.subject && (
                <p><strong>Subject:</strong> {previewData.subject}</p>
              )}
              <div
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: 16,
                  maxHeight: 400,
                  overflow: 'auto',
                }}
                dangerouslySetInnerHTML={{ __html: previewData.body }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EmailTemplateForm;
