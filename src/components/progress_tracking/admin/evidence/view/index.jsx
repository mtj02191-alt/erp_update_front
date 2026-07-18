import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';
import { FiExternalLink, FiTrash2 } from 'react-icons/fi';

const FILE_TYPE_OPTIONS = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'pdf', label: 'PDF' },
  { value: 'document', label: 'Document' },
  { value: 'link', label: 'Link' },
];

const EvidenceEdit = () => {
  const { trackerId, stepId, evidenceId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ev, setEv] = useState(null);
  const [form, setForm] = useState({
    file_url: '',
    file_type: 'link',
    title: '',
    caption: '',
    sort_order: 0,
  });

  const fetchEvidence = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get(`/progress/trackers/${trackerId}/steps`);
      if (!res.data?.success) {
        setError(res.data?.message || 'Failed to load steps');
        return;
      }
      const step = (res.data.data || []).find((s) => String(s.id) === String(stepId));
      if (!step) {
        setError('Step not found');
        return;
      }
      const evidence = (step.evidence || []).find((e) => String(e.id) === String(evidenceId));
      if (!evidence) {
        setError('Evidence not found');
        return;
      }
      setEv(evidence);
      setForm({
        file_url: evidence.file_url || '',
        file_type: evidence.file_type || 'link',
        title: evidence.title || '',
        caption: evidence.caption || '',
        sort_order: evidence.sort_order ?? 0,
      });
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load evidence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (trackerId && stepId && evidenceId) fetchEvidence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackerId, stepId, evidenceId]);

  const canSubmit = useMemo(() => form.file_url.trim().length > 0, [form.file_url]);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await axiosInstance.patch(`/progress/trackers/evidence/${evidenceId}`, {
        file_url: form.file_url.trim(),
        file_type: form.file_type,
        title: form.title?.trim() || null,
        caption: form.caption?.trim() || null,
        sort_order: Number(form.sort_order) || 0,
      });
      if (!res.data?.success) {
        setError(res.data?.message || 'Failed to save evidence');
        return;
      }
      await fetchEvidence();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save evidence');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await axiosInstance.delete(`/progress/trackers/evidence/${evidenceId}`);
      if (res.data?.success) {
        navigate(`/progress/trackers/${trackerId}/steps/${stepId}`);
        return;
      }
      setError(res.data?.message || 'Failed to delete evidence');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to delete evidence');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader title="Evidence" showBackButton={true} backPath={`/progress/trackers/${trackerId}/steps/${stepId}`} />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader title="Evidence" showBackButton={true} backPath={`/progress/trackers/${trackerId}/steps/${stepId}`} />
          <div className="view-content">
            <div className="status-message status-message--error">{error}</div>
          </div>
        </div>
      </>
    );
  }

  if (!ev) return null;

  return (
    <>
      <Navbar />
      <div className="view-wrapper">
        <PageHeader title="Evidence" showBackButton={true} backPath={`/progress/trackers/${trackerId}/steps/${stepId}`} />
        <div className="view-content">
          <div className="view-section">
            <h3 className="view-section-title">Summary</h3>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div><strong>ID:</strong> {ev.id}</div>
              <div><strong>Type:</strong> {ev.file_type}</div>
              <div><strong>Order:</strong> {ev.sort_order ?? 0}</div>
              {ev.file_url && (
                <button
                  type="button"
                  className="secondary_btn"
                  onClick={() => window.open(ev.file_url, '_blank', 'noreferrer')}
                  disabled={saving}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <FiExternalLink /> Open link
                </button>
              )}
            </div>
          </div>

          <div className="view-section">
            <h3 className="view-section-title">Edit</h3>
            <div className="form-grid-2">
              <FormInput
                label="File URL"
                name="file_url"
                value={form.file_url}
                onChange={(e) => setForm((p) => ({ ...p, file_url: e.target.value }))}
              />
              <FormSelect
                label="Type"
                name="file_type"
                value={form.file_type}
                onChange={(e) => setForm((p) => ({ ...p, file_type: e.target.value }))}
                options={FILE_TYPE_OPTIONS}
              />
              <FormInput
                label="Title"
                name="title"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
              <FormInput
                label="Sort Order"
                name="sort_order"
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))}
              />
              <FormInput
                label="Caption"
                name="caption"
                type="textarea"
                value={form.caption}
                onChange={(e) => setForm((p) => ({ ...p, caption: e.target.value }))}
              />
            </div>
            <div className="form-actions">
              <button type="button" className="primary_btn" onClick={save} disabled={saving || !canSubmit}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button type="button" className="secondary_btn" onClick={() => navigate(`/progress/trackers/${trackerId}/steps/${stepId}`)} disabled={saving}>
                Back
              </button>
              <button
                type="button"
                className="secondary_btn"
                onClick={remove}
                disabled={saving}
                style={{ color: '#f44336', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <FiTrash2 /> Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EvidenceEdit;

