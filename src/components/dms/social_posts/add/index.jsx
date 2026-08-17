import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';

import { FiRepeat, FiImage, FiUpload } from 'react-icons/fi';

const initialForm = {
  campaign_id: '',
  appeal_id: '',
  buffer_channel_id: '',
  buffer_channel_name: '',
  post_text: '',
  image_url: '',
  scheduled_at: '',
  publish_to_buffer: false,
  status: 'draft',
};

const SocialPostAdd = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [bufferChannels, setBufferChannels] = useState([]);
  const [channelOptions, setChannelOptions] = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(true);

  const [aiContext, setAiContext] = useState('');
  const [aiTone, setAiTone] = useState('warm, trustworthy, concise');
  const [aiPlatform, setAiPlatform] = useState('general social media');
  const [generatingText, setGeneratingText] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);

  const postText = form.post_text || '';
  const charCount = postText.length;
  const normalizedPlatform = String(aiPlatform || '').toLowerCase();
  const isX =
    normalizedPlatform.includes('twitter') ||
    normalizedPlatform === 'x' ||
    normalizedPlatform.includes('x ');
  const platformLimit = isX ? 280 : null;
  const overLimit = platformLimit != null ? charCount > platformLimit : false;

  useEffect(() => {
    const loadChannels = async () => {
      try {
        setLoadingChannels(true);
        const res = await axiosInstance.get('/social-posts/buffer/channels');
        if (res.data.success) {
          const channels = res.data.data || [];
          setBufferChannels(channels);
          setChannelOptions(
            channels.map((c) => ({
              value: c.id,
              label: c.service ? `${c.name} (${c.service})` : c.name,
            })),
          );
        } else {
          setError(res.data.message || 'Failed to load Buffer channels');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load Buffer channels');
      } finally {
        setLoadingChannels(false);
      }
    };
    loadChannels();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (error) setError('');
  };

  const handleSelectChannel = (value) => {
    const channel = bufferChannels.find((c) => c.id === value);
    setForm((prev) => ({
      ...prev,
      buffer_channel_id: value,
      buffer_channel_name: channel?.name || '',
    }));
    if (error) setError('');
  };

  const handleGenerateText = async () => {
    try {
      setGeneratingText(true);
      setError('');

      const payload = {
        appeal_id: form.appeal_id ? Number(form.appeal_id) : undefined,
        campaign_id: form.campaign_id ? Number(form.campaign_id) : undefined,
        context: aiContext || undefined,
        tone: aiTone,
        platform: aiPlatform,
      };

      const res = await axiosInstance.post('/social-posts/ai/generate-text', payload);
      if (res.data.success) {
        setForm((prev) => ({ ...prev, post_text: res.data.data.text || '' }));
      } else {
        setError(res.data.message || 'Failed to generate post text');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate post text');
    } finally {
      setGeneratingText(false);
    }
  };

  const handleGenerateImage = async () => {
    try {
      setGeneratingImage(true);
      setError('');

      const payload = {
        appeal_id: form.appeal_id ? Number(form.appeal_id) : undefined,
        campaign_id: form.campaign_id ? Number(form.campaign_id) : undefined,
        context: aiContext || undefined,
        tone: aiTone,
        platform: aiPlatform,
      };

      const res = await axiosInstance.post('/social-posts/ai/generate-image', payload);
      if (res.data.success) {
        setForm((prev) => ({ ...prev, image_url: res.data.data.image_url || '' }));
      } else {
        setError(res.data.message || 'Failed to generate post image');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate post image');
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleUploadImage = async (file) => {
    if (!file) return;
    try {
      setError('');
      const fd = new FormData();
      fd.append('file', file);
      const res = await axiosInstance.post('/social-posts/upload/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setForm((prev) => ({ ...prev, image_url: res.data.data.url || '' }));
      } else {
        setError(res.data.message || 'Failed to upload image');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const payload = {
      campaign_id: form.campaign_id ? Number(form.campaign_id) : undefined,
      appeal_id: form.appeal_id ? Number(form.appeal_id) : undefined,
      buffer_channel_id: form.buffer_channel_id || undefined,
      buffer_channel_name: form.buffer_channel_name || undefined,
      post_text: form.post_text || undefined,
      image_url: form.image_url || undefined,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : undefined,
      publish_to_buffer: form.publish_to_buffer,
      status: form.status,
    };

    try {
      await axiosInstance.post('/social-posts', payload);
      navigate('/dms/social-posts/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create social post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => navigate('/dms/social-posts/list');

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader title="Create Social Post" onBack={handleBack} />

        {error && <div className="status-message status-message--error">{error}</div>}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-section">
            <div className="form-grid-2">
              <FormInput
                label="Campaign ID (optional)"
                type="number"
                name="campaign_id"
                value={form.campaign_id}
                onChange={handleChange}
                placeholder="e.g. 12"
              />

              <FormInput
                label="Appeal ID (optional)"
                type="number"
                name="appeal_id"
                value={form.appeal_id}
                onChange={handleChange}
                placeholder="e.g. 45"
              />
            </div>
          </div>

          <div className="form-section">
            <FormSelect
              name="buffer_channel_id"
              label="Buffer Channel"
              value={form.buffer_channel_id}
              options={channelOptions}
              onChange={(e) => handleSelectChannel(e.target.value)}
              showDefaultOption
              defaultOptionText={loadingChannels ? 'Loading...' : 'Select channel'}
            />

            <FormInput
              label="Scheduled At (optional)"
              type="datetime-local"
              name="scheduled_at"
              value={form.scheduled_at}
              onChange={handleChange}
            />
          </div>

          <div className="form-section">
            <FormTextarea
              label="Post Text"
              name="post_text"
              value={form.post_text}
              onChange={handleChange}
              rows={6}
              placeholder="Write your post or use AI generate text..."
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 6,
                color: overLimit ? '#ef4444' : '#6b7280',
                fontSize: 13,
              }}
            >
              <span>
                {platformLimit ? (
                  <>
                    Characters: <strong>{charCount}</strong> / {platformLimit}{' '}
                    {overLimit ? '(over limit for X/Twitter)' : ''}
                  </>
                ) : (
                  <>
                    Characters: <strong>{charCount}</strong>
                  </>
                )}
              </span>
              <button
                type="button"
                className="secondary_btn"
                style={{ padding: '6px 10px' }}
                onClick={() => navigator.clipboard?.writeText(postText)}
                disabled={!postText}
                title="Copy post text"
              >
                Copy
              </button>
            </div>

            <div className="form-actions" style={{ justifyContent: 'space-between' }}>
              <button type="button" className="secondary_btn" onClick={handleGenerateText} disabled={generatingText}>
                <FiRepeat style={{ marginRight: 8 }} />
                {generatingText ? 'Generating...' : 'Generate Text'}
              </button>

              <button type="button" className="secondary_btn" onClick={handleGenerateImage} disabled={generatingImage}>
                <FiImage style={{ marginRight: 8 }} />
                {generatingImage ? 'Generating...' : 'Generate Image'}
              </button>
            </div>

            <div style={{ marginTop: 16 }}>
              <FormTextarea
                label="AI Context (optional)"
                name="ai_context"
                value={aiContext}
                onChange={(e) => setAiContext(e.target.value)}
                rows={3}
                placeholder="Add extra details (who/what/where/CTA) to guide the post..."
              />
            </div>

            <div className="form-grid-2" style={{ marginTop: 8 }}>
              <FormInput
                label="Tone"
                type="text"
                name="ai_tone"
                value={aiTone}
                onChange={(e) => setAiTone(e.target.value)}
              />
              <FormInput
                label="Platform"
                type="text"
                name="ai_platform"
                value={aiPlatform}
                onChange={(e) => setAiPlatform(e.target.value)}
              />
            </div>
          </div>

          <div className="form-section">
            <FormTextarea
              label="Image URL (optional)"
              name="image_url"
              value={form.image_url}
              onChange={handleChange}
              rows={2}
              placeholder="Paste image URL or generate/upload..."
            />

            <div className="form-actions" style={{ justifyContent: 'space-between' }}>
              <label className="secondary_btn" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                <FiUpload style={{ marginRight: 8 }} />
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleUploadImage(e.target.files?.[0])}
                />
              </label>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    name="publish_to_buffer"
                    checked={form.publish_to_buffer}
                    onChange={handleChange}
                  />
                  Publish to Buffer
                </label>
              </div>
            </div>

            {form.image_url ? (
              <div style={{ marginTop: 12 }}>
                <img
                  src={form.image_url}
                  alt="Preview"
                  style={{ maxWidth: '100%', borderRadius: 8 }}
                />
              </div>
            ) : null}
          </div>

          <div className="form-section">
            <div style={{ marginBottom: 8, color: '#6b7280' }}>
              <strong>Preview</strong>
              <div style={{ fontSize: 13 }}>
                Channel: {form.buffer_channel_name || '—'} | Scheduled:{' '}
                {form.scheduled_at ? new Date(form.scheduled_at).toLocaleString() : '—'}
              </div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {postText || 'Write something to see preview...'}
              </pre>
              {form.image_url ? (
                <div style={{ marginTop: 12 }}>
                  <img
                    src={form.image_url}
                    alt="Preview"
                    style={{ maxWidth: '100%', borderRadius: 10 }}
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="secondary_btn" onClick={handleBack}>
              Cancel
            </button>
            <button type="submit" className="primary_btn" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Social Post'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default SocialPostAdd;

