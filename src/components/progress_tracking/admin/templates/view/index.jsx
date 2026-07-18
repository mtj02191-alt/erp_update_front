import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';

const TemplateView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [saving, setSaving] = useState(false);
  const [newStep, setNewStep] = useState({
    step_key: '',
    title: '',
    step_order: 1,
    allow_notes: true,
    allow_evidence: true,
    allow_metadata: false,
    notify_donor_on_complete: true,
    is_required: true,
  });

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [res, parentsRes] = await Promise.all([
        axiosInstance.get(`/progress/workflow-templates/${id}`),
        axiosInstance.get('/progress/workflow-templates'),
      ]);
      if (parentsRes.data?.success) setParents(parentsRes.data.data || []);
      if (res.data?.success) setTemplate(res.data.data);
      else setError(res.data?.message || 'Failed to load template');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const saveTemplate = async () => {
    setSaving(true);
    try {
      await axiosInstance.patch(`/progress/workflow-templates/${id}`, {
        name: template.name,
        code: template.code,
        description: template.description,
        is_active: template.is_active,
        parent_id: template.parent_id ? Number(template.parent_id) : null,
        target_amount:
          template.target_amount === '' || template.target_amount == null
            ? null
            : Number(template.target_amount),
        is_batchable: Boolean(template.is_batchable),
        batch_parts:
          !template.is_batchable || template.batch_parts === '' ? null : Number(template.batch_parts),
        batch_part_amount:
          !template.is_batchable || template.batch_part_amount === ''
            ? null
            : Number(template.batch_part_amount),
      });
      await fetchData();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const canSave = useMemo(() => {
    if (!template) return false;
    if (!template.name || !template.code) return false;
    if (!template.is_batchable) return true;
    const bp = Number(template.batch_parts);
    const bpa = Number(template.batch_part_amount);
    return Number.isFinite(bp) && bp > 0 && Number.isFinite(bpa) && bpa > 0;
  }, [template]);

  const addStep = async () => {
    setSaving(true);
    try {
      await axiosInstance.post(`/progress/workflow-templates/${id}/steps`, {
        ...newStep,
        step_order: Number(newStep.step_order),
      });
      setNewStep((p) => ({ ...p, step_key: '', title: '' }));
      await fetchData();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to add step');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader title="Workflow Template" showBackButton={true} backPath="/progress/templates" />
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
          <PageHeader title="Workflow Template" showBackButton={true} backPath="/progress/templates" />
          <div className="view-content">
            <div className="status-message status-message--error">{error}</div>
          </div>
        </div>
      </>
    );
  }

  if (!template) return null;

  return (
    <>
      <Navbar />
      <div className="view-wrapper">
        <PageHeader title="Workflow Template" showBackButton={true} backPath="/progress/templates" />
        <div className="view-content">
          <div className="view-section">
            <h3 className="view-section-title">Template</h3>
            <div className="form-grid-2">
              <FormSelect
                label="Parent Template (optional)"
                name="parent_id"
                value={template.parent_id == null ? '' : String(template.parent_id)}
                onChange={(e) =>
                  setTemplate({
                    ...template,
                    parent_id: e.target.value ? Number(e.target.value) : null,
                  })
                }
                options={[
                  { value: '', label: 'None' },
                  ...(parents || [])
                    .filter((p) => String(p.id) !== String(template.id))
                    .map((p) => ({ value: String(p.id), label: `${p.name} (${p.code})` })),
                ]}
              />
              <FormInput
                label="Target Amount (optional)"
                name="target_amount"
                type="number"
                value={template.target_amount ?? ''}
                onChange={(e) => setTemplate({ ...template, target_amount: e.target.value })}
              />
              <FormInput label="Name" name="name" value={template.name || ''} onChange={(e) => setTemplate({ ...template, name: e.target.value })} />
              <FormInput label="Code" name="code" value={template.code || ''} onChange={(e) => setTemplate({ ...template, code: e.target.value })} />
              <FormSelect
                label="Active"
                name="is_active"
                value={template.is_active ? 'true' : 'false'}
                onChange={(e) => setTemplate({ ...template, is_active: e.target.value === 'true' })}
                options={[
                  { value: 'true', label: 'Active' },
                  { value: 'false', label: 'Inactive' },
                ]}
              />
              <FormSelect
                label="Batchable"
                name="is_batchable"
                value={template.is_batchable ? 'true' : 'false'}
                onChange={(e) => setTemplate({ ...template, is_batchable: e.target.value === 'true' })}
                options={[
                  { value: 'false', label: 'No' },
                  { value: 'true', label: 'Yes' },
                ]}
              />
              {template.is_batchable && (
                <>
                  <FormInput
                    label="Batch Parts"
                    name="batch_parts"
                    type="number"
                    value={template.batch_parts ?? ''}
                    onChange={(e) => setTemplate({ ...template, batch_parts: e.target.value })}
                  />
                  <FormInput
                    label="Batch Part Amount"
                    name="batch_part_amount"
                    type="number"
                    value={template.batch_part_amount ?? ''}
                    onChange={(e) => setTemplate({ ...template, batch_part_amount: e.target.value })}
                  />
                </>
              )}
              <FormInput
                label="Description"
                name="description"
                type="textarea"
                value={template.description || ''}
                onChange={(e) => setTemplate({ ...template, description: e.target.value })}
              />
            </div>
            <div className="form-actions">
              <button type="button" className="primary_btn" onClick={saveTemplate} disabled={saving || !canSave}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button type="button" className="secondary_btn" onClick={() => navigate('/progress/templates')}>
                Back
              </button>
            </div>
          </div>

          <div className="view-section">
            <h3 className="view-section-title">Steps</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Key</th>
                    <th>Title</th>
                    <th className="hide-on-mobile">Notify</th>
                  </tr>
                </thead>
                <tbody>
                  {(template.steps || []).map((s) => (
                    <tr key={s.id}>
                      <td>{s.step_order}</td>
                      <td>{s.step_key}</td>
                      <td>{s.title}</td>
                      <td className="hide-on-mobile">{s.notify_donor_on_complete ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '14px', borderTop: '1px solid #eee', paddingTop: '14px' }}>
              <h4 style={{ marginBottom: '10px' }}>Add Step</h4>
              <div className="form-grid-2">
                <FormInput label="Step Key" name="step_key" value={newStep.step_key} onChange={(e) => setNewStep({ ...newStep, step_key: e.target.value })} />
                <FormInput label="Title" name="title" value={newStep.title} onChange={(e) => setNewStep({ ...newStep, title: e.target.value })} />
                <FormInput
                  label="Order"
                  name="step_order"
                  type="number"
                  value={newStep.step_order}
                  onChange={(e) => setNewStep({ ...newStep, step_order: e.target.value })}
                />
                <FormSelect
                  label="Notify Donor"
                  name="notify_donor_on_complete"
                  value={newStep.notify_donor_on_complete ? 'true' : 'false'}
                  onChange={(e) => setNewStep({ ...newStep, notify_donor_on_complete: e.target.value === 'true' })}
                  options={[
                    { value: 'true', label: 'Yes' },
                    { value: 'false', label: 'No' },
                  ]}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="primary_btn" onClick={addStep} disabled={saving || !newStep.step_key || !newStep.title}>
                  {saving ? 'Saving...' : 'Add Step'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TemplateView;

