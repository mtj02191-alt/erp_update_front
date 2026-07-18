import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';

const FILE_TYPE_OPTIONS = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'pdf', label: 'PDF' },
  { value: 'document', label: 'Document' },
  { value: 'link', label: 'Link' },
];

const EvidenceAdd = () => {
  const { trackerId, stepId } = useParams();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    file_url: '',
    file_type: 'link',
  });

  const canSubmit = useMemo(() => form.file_url.trim().length > 0 && Boolean(form.file_type), [form]);

  const create = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await axiosInstance.post(`/progress/trackers/steps/${stepId}/evidence`, {
        file_url: form.file_url.trim(),
        file_type: form.file_type,
      });
      if (res.data?.success) {
        navigate(`/progress/trackers/${trackerId}/steps/${stepId}`);
        return;
      }
      setError(res.data?.message || 'Failed to add evidence');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to add evidence');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="view-wrapper">
        <PageHeader title="Add Evidence" showBackButton={true} backPath={`/progress/trackers/${trackerId}/steps/${stepId}`} />
        <div className="view-content">
          {error && (
            <div className="status-message status-message--error" style={{ marginBottom: 12 }}>
              {error}
            </div>
          )}

          <div className="view-section">
            <h3 className="view-section-title">Evidence</h3>
            <div className="form-grid-2">
              <FormInput
                label="File URL"
                name="file_url"
                value={form.file_url}
                onChange={(e) => setForm((p) => ({ ...p, file_url: e.target.value }))}
                placeholder="https://..."
              />
              <FormSelect
                label="Type"
                name="file_type"
                value={form.file_type}
                onChange={(e) => setForm((p) => ({ ...p, file_type: e.target.value }))}
                options={FILE_TYPE_OPTIONS}
              />
            </div>
            <div className="form-actions">
              <button type="button" className="primary_btn" onClick={create} disabled={saving || !canSubmit}>
                {saving ? 'Saving...' : 'Add'}
              </button>
              <button type="button" className="secondary_btn" onClick={() => navigate(`/progress/trackers/${trackerId}/steps/${stepId}`)} disabled={saving}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EvidenceAdd;

