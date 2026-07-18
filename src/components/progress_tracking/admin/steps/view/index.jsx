import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';
import ActionMenu from '../../../../common/ActionMenu';
import { FiExternalLink, FiPlus, FiTrash2 } from 'react-icons/fi';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'skipped', label: 'Skipped' },
  { value: 'cancelled', label: 'Cancelled' },
];

const EvidenceView = () => {
  const { trackerId, stepId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [step, setStep] = useState(null);
  const [form, setForm] = useState({
    status: 'pending',
    notes: '',
    donor_visible: true,
    donor_notified: false,
  });
  const [newEvidenceUrl, setNewEvidenceUrl] = useState('');
  const [newEvidenceType, setNewEvidenceType] = useState('link');

  const fetchStep = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get(`/progress/trackers/${trackerId}/steps`);
      if (!res.data?.success) {
        setError(res.data?.message || 'Failed to load steps');
        return;
      }
      const rows = res.data.data || [];
      const found = rows.find((s) => String(s.id) === String(stepId));
      if (!found) {
        setError('Step not found');
        return;
      }
      setStep(found);
      setForm({
        status: found.status || 'pending',
        notes: found.notes || '',
        donor_visible: Boolean(found.donor_visible),
        donor_notified: Boolean(found.donor_notified),
      });
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load step');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (trackerId && stepId) fetchStep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackerId, stepId]);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await axiosInstance.patch(`/progress/trackers/steps/${stepId}`, {
        status: form.status,
        notes: form.notes || null,
        donor_visible: Boolean(form.donor_visible),
        donor_notified: Boolean(form.donor_notified),
      });
      await fetchStep();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update step');
    } finally {
      setSaving(false);
    }
  };

  const addEvidenceInline = async () => {
    if (!newEvidenceUrl.trim()) return;
    setSaving(true);
    setError('');
    try {
      await axiosInstance.post(`/progress/trackers/steps/${stepId}/evidence`, {
        file_url: newEvidenceUrl.trim(),
        file_type: newEvidenceType,
      });
      setNewEvidenceUrl('');
      setNewEvidenceType('link');
      await fetchStep();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to add evidence');
    } finally {
      setSaving(false);
    }
  };

  const deleteEvidence = async (evidenceId) => {
    setSaving(true);
    setError('');
    try {
      await axiosInstance.delete(`/progress/trackers/evidence/${evidenceId}`);
      await fetchStep();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to remove evidence');
    } finally {
      setSaving(false);
    }
  };

  const evidenceActionsFor = (ev) => [
    {
      icon: <FiExternalLink />,
      label: 'Open',
      color: '#4CAF50',
      onClick: () => window.open(ev.file_url, '_blank', 'noreferrer'),
      visible: Boolean(ev.file_url),
    },
    {
      icon: <FiTrash2 />,
      label: 'Delete',
      color: '#f44336',
      onClick: () => deleteEvidence(ev.id),
      visible: true,
      disabled: saving,
    },
  ];

  const evidence = useMemo(() => (step?.evidence || []).slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)), [step]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader title="Tracker Step" showBackButton={true} backPath={`/progress/trackers/${trackerId}/steps`} />
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
          <PageHeader title="Tracker Step" showBackButton={true} backPath={`/progress/trackers/${trackerId}/steps`} />
          <div className="view-content">
            <div className="status-message status-message--error">{error}</div>
          </div>
        </div>
      </>
    );
  }

  if (!step) return null;

  return (
    <>
      <Navbar />
      <div className="view-wrapper">
        <PageHeader title="Tracker Step" showBackButton={true} backPath={`/progress/trackers/${trackerId}/steps`} />
        <div className="view-content">
          <div className="view-section">
            <h3 className="view-section-title">Summary</h3>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div><strong>ID:</strong> {step.id}</div>
              <div><strong>Key:</strong> {step.step_key}</div>
              <div><strong>Order:</strong> {step.step_order}</div>
              <div><strong>Title:</strong> {step.title}</div>
            </div>
          </div>

          <div className="view-section">
            <h3 className="view-section-title">Update</h3>
            <div className="form-grid-2">
              <FormSelect
                label="Status"
                name="status"
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                options={STATUS_OPTIONS}
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
              <FormSelect
                label="Donor Notified"
                name="donor_notified"
                value={form.donor_notified ? 'true' : 'false'}
                onChange={(e) => setForm((p) => ({ ...p, donor_notified: e.target.value === 'true' }))}
                options={[
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' },
                ]}
              />
              <FormInput
                label="Notes"
                name="notes"
                type="textarea"
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
            <div className="form-actions">
              <button type="button" className="primary_btn" onClick={save} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button type="button" className="secondary_btn" onClick={() => navigate(`/progress/trackers/${trackerId}`)} disabled={saving}>
                Back to Tracker
              </button>
            </div>
          </div>

          <div className="view-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <h3 className="view-section-title" style={{ marginBottom: 0 }}>Evidence</h3>
            </div>

            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 220px 160px', gap: 10, alignItems: 'end' }}>
              <FormInput
                label="Evidence URL"
                name="evidence_url"
                value={newEvidenceUrl}
                onChange={(e) => setNewEvidenceUrl(e.target.value)}
                placeholder="https://..."
              />
              <FormSelect
                label="Type"
                name="evidence_type"
                value={newEvidenceType}
                onChange={(e) => setNewEvidenceType(e.target.value)}
                options={[
                  { value: 'image', label: 'Image' },
                  { value: 'video', label: 'Video' },
                  { value: 'pdf', label: 'PDF' },
                  { value: 'document', label: 'Document' },
                  { value: 'link', label: 'Link' },
                ]}
              />
              <button
                type="button"
                className="secondary_btn"
                onClick={addEvidenceInline}
                disabled={saving || !newEvidenceUrl.trim()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}
              >
                <FiPlus /> Add
              </button>
            </div>

            <div className="table-container" style={{ marginTop: 12 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th className="table-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {evidence.map((ev) => (
                    <tr key={ev.id}>
                      <td>{ev.id}</td>
                      <td>
                        {ev.evidence_label ? (
                          <span style={{ fontSize: 12, color: '#6b7280', marginRight: 8 }}>
                            {ev.evidence_label}
                          </span>
                        ) : null}
                        {ev.file_type}
                      </td>
                      <td className="table-actions">
                        <ActionMenu actions={evidenceActionsFor(ev)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {evidence.length === 0 && (
              <div className="empty-state" style={{ padding: 20 }}>
                No evidence added yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default EvidenceView;

