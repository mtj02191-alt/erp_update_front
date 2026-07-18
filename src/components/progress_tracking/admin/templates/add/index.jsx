import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';

const TemplateAdd = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [parents, setParents] = useState([]);

  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    is_active: true,
    parent_id: '',
    target_amount: '',
    is_batchable: false,
    batch_parts: '',
    batch_part_amount: '',
  });

  const fetchParents = async () => {
    try {
      const res = await axiosInstance.get('/progress/workflow-templates');
      if (res.data?.success) setParents(res.data.data || []);
    } catch (e) {
      // ignore; parent selection is optional
    }
  };

  useEffect(() => {
    fetchParents();
  }, []);

  const create = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await axiosInstance.post('/progress/workflow-templates', {
        name: form.name?.trim(),
        code: form.code?.trim(),
        description: form.description || null,
        is_active: Boolean(form.is_active),
        parent_id: form.parent_id ? Number(form.parent_id) : null,
        target_amount:
          form.target_amount === '' || form.target_amount == null
            ? null
            : Number(form.target_amount),
        is_batchable: Boolean(form.is_batchable),
        batch_parts:
          !form.is_batchable || form.batch_parts === '' ? null : Number(form.batch_parts),
        batch_part_amount:
          !form.is_batchable || form.batch_part_amount === ''
            ? null
            : Number(form.batch_part_amount),
      });
      if (res.data?.success && res.data?.data?.id) {
        navigate(`/progress/templates/${res.data.data.id}`);
        return;
      }
      setError(res.data?.message || 'Failed to create template');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create template');
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = useMemo(() => {
    if (form.name.trim().length === 0 || form.code.trim().length === 0) return false;
    if (!form.is_batchable) return true;
    const bp = Number(form.batch_parts);
    const bpa = Number(form.batch_part_amount);
    return Number.isFinite(bp) && bp > 0 && Number.isFinite(bpa) && bpa > 0;
  }, [form]);

  return (
    <>
      <Navbar />
      <div className="view-wrapper">
        <PageHeader title="Create Workflow Template" showBackButton={true} backPath="/progress/templates" />
        <div className="view-content">
          {error && (
            <div className="status-message status-message--error" style={{ marginBottom: 12 }}>
              {error}
            </div>
          )}

          <div className="view-section">
            <h3 className="view-section-title">Template</h3>
            <div className="form-grid-2">
              <FormSelect
                label="Parent Template (optional)"
                name="parent_id"
                value={form.parent_id}
                onChange={(e) => setForm((p) => ({ ...p, parent_id: e.target.value }))}
                options={[
                  { value: '', label: 'None' },
                  ...(parents || []).map((p) => ({ value: String(p.id), label: `${p.name} (${p.code})` })),
                ]}
              />
              <FormInput
                label="Target Amount (optional)"
                name="target_amount"
                type="number"
                value={form.target_amount}
                onChange={(e) => setForm((p) => ({ ...p, target_amount: e.target.value }))}
                placeholder="e.g. 70000"
              />
              <FormInput
                label="Name"
                name="name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
              <FormInput
                label="Code"
                name="code"
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                placeholder="e.g. qurbani_workflow"
              />
              <FormSelect
                label="Active"
                name="is_active"
                value={form.is_active ? 'true' : 'false'}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.value === 'true' }))}
                options={[
                  { value: 'true', label: 'Active' },
                  { value: 'false', label: 'Inactive' },
                ]}
              />
              <FormSelect
                label="Batchable"
                name="is_batchable"
                value={form.is_batchable ? 'true' : 'false'}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    is_batchable: e.target.value === 'true',
                  }))
                }
                options={[
                  { value: 'false', label: 'No' },
                  { value: 'true', label: 'Yes' },
                ]}
              />
              {form.is_batchable && (
                <>
                  <FormInput
                    label="Batch Parts"
                    name="batch_parts"
                    type="number"
                    value={form.batch_parts}
                    onChange={(e) => setForm((p) => ({ ...p, batch_parts: e.target.value }))}
                    placeholder="e.g. 7"
                  />
                  <FormInput
                    label="Batch Part Amount"
                    name="batch_part_amount"
                    type="number"
                    value={form.batch_part_amount}
                    onChange={(e) => setForm((p) => ({ ...p, batch_part_amount: e.target.value }))}
                    placeholder="e.g. 10000"
                  />
                </>
              )}
              <FormInput
                label="Description"
                name="description"
                type="textarea"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>

            <div className="form-actions">
              <button type="button" className="primary_btn" onClick={create} disabled={saving || !canSubmit}>
                {saving ? 'Creating...' : 'Create'}
              </button>
              <button type="button" className="secondary_btn" onClick={() => navigate('/progress/templates')} disabled={saving}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TemplateAdd;

