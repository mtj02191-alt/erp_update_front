import React, { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormSelect from '../../../../common/FormSelect';
import FormInput from '../../../../common/FormInput';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'skipped', label: 'Skipped' },
  { value: 'cancelled', label: 'Cancelled' },
];

const TrackersView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const batchIdFromUrl = searchParams.get('batch_id');
  const [tracker, setTracker] = useState(null);
  const [loading, setLoading] = useState(true);
  /** Initial load only — full-page error. */
  const [loadError, setLoadError] = useState('');
  /** Step / allocate / tag / token failures — inline banner so the page stays usable. */
  const [actionError, setActionError] = useState('');
  const [saving, setSaving] = useState(false);

  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceType, setEvidenceType] = useState('link');
  const [activeStepId, setActiveStepId] = useState(null);
  const [savingEvidenceStepId, setSavingEvidenceStepId] = useState(null);
  const [batchTagDraft, setBatchTagDraft] = useState('');
  const [batchTagNameDraft, setBatchTagNameDraft] = useState('');
  const [savingBatchTag, setSavingBatchTag] = useState(false);
  const [partsToAdd, setPartsToAdd] = useState('');
  const [allocatingParts, setAllocatingParts] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await axiosInstance.get(`/progress/trackers/${id}`);
      if (res.data?.success) {
        setTracker(res.data.data);
        setActionError('');
      } else {
        setLoadError(res.data?.message || 'Failed to load tracker');
      }
    } catch (e) {
      setLoadError(e.response?.data?.message || 'Failed to load tracker');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  useEffect(() => {
    const raw =
      batchIdFromUrl != null && String(batchIdFromUrl).trim() !== ''
        ? Number(batchIdFromUrl)
        : NaN;
    if (!Number.isFinite(raw) || raw <= 0) {
      setBatchTagDraft('');
      setBatchTagNameDraft('');
      return;
    }
    const steps = tracker?.steps || [];
    const step = steps.find((s) => s.batch_id != null && Number(s.batch_id) === raw);
    const tn = step?.batch?.tag_number;
    setBatchTagDraft(tn != null && String(tn).trim() !== '' ? String(tn).trim() : '');
    const tnm = step?.batch?.tag_name;
    setBatchTagNameDraft(tnm != null && String(tnm).trim() !== '' ? String(tnm).trim() : '');
  }, [batchIdFromUrl, tracker]);

  const batchFilterOptions = useMemo(() => {
    const steps = tracker?.steps || [];
    const map = new Map();
    for (const s of steps) {
      const bid = s.batch_id != null ? Number(s.batch_id) : null;
      if (bid == null || !Number.isFinite(bid) || bid <= 0) continue;
      const bn = s.batch?.batch_number != null ? Number(s.batch.batch_number) : bid;
      const tagRaw = s.batch?.tag_number;
      const tag =
        tagRaw != null && String(tagRaw).trim() !== '' ? String(tagRaw).trim() : null;
      const nameRaw = s.batch?.tag_name;
      const tname =
        nameRaw != null && String(nameRaw).trim() !== '' ? String(nameRaw).trim() : null;
      if (!map.has(bid)) {
        map.set(bid, {
          batch_id: bid,
          batch_number: bn,
          tag_number: tag,
          tag_name: tname,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.batch_number - b.batch_number);
  }, [tracker]);

  const visibleSteps = useMemo(() => {
    const steps = (tracker?.steps || []).filter((s) => !s.is_archived);
    const raw = batchIdFromUrl != null && String(batchIdFromUrl).trim() !== ''
      ? Number(batchIdFromUrl)
      : NaN;
    if (!Number.isFinite(raw) || raw <= 0) return steps;
    const scoped = steps.filter((s) => s.batch_id != null && Number(s.batch_id) === raw);
    return scoped.length ? scoped : steps;
  }, [tracker, batchIdFromUrl]);

  const updateStep = async (stepId, patch) => {
    setSaving(true);
    setActionError('');
    try {
      await axiosInstance.patch(`/progress/trackers/steps/${stepId}`, patch);
      await fetchData();
    } catch (e) {
      setActionError(e.response?.data?.message || 'Failed to update step');
    } finally {
      setSaving(false);
    }
  };

  const addEvidence = async (stepId) => {
    const sid = stepId != null ? stepId : activeStepId;
    if (!sid || !String(evidenceUrl || '').trim()) return;
    setSaving(true);
    setSavingEvidenceStepId(sid);
    setActionError('');
    try {
      await axiosInstance.post(`/progress/trackers/steps/${sid}/evidence`, {
        file_url: evidenceUrl,
        file_type: evidenceType,
        title: evidenceTitle || null,
      });
      setEvidenceUrl('');
      setEvidenceTitle('');
      await fetchData();
    } catch (e) {
      setActionError(e.response?.data?.message || 'Failed to add evidence');
    } finally {
      setSaving(false);
      setSavingEvidenceStepId(null);
    }
  };

  const regenToken = async () => {
    setSaving(true);
    setActionError('');
    try {
      await axiosInstance.post(`/progress/trackers/${id}/token`);
      await fetchData();
    } catch (e) {
      setActionError(e.response?.data?.message || 'Failed to generate token');
    } finally {
      setSaving(false);
    }
  };

  const saveBatchTag = async () => {
    const raw =
      batchIdFromUrl != null && String(batchIdFromUrl).trim() !== ''
        ? Number(batchIdFromUrl)
        : NaN;
    if (!Number.isFinite(raw) || raw <= 0) return;
    setSavingBatchTag(true);
    setActionError('');
    try {
      await axiosInstance.patch(`/progress/batches/${raw}`, {
        tag_number: batchTagDraft.trim() || null,
        tag_name: batchTagNameDraft.trim() || null,
      });
      await fetchData();
    } catch (e) {
      setActionError(e.response?.data?.message || 'Failed to update batch tag');
    } finally {
      setSavingBatchTag(false);
    }
  };

  const allocateMoreParts = async () => {
    const n = Number(partsToAdd || 0);
    if (!Number.isFinite(n) || n <= 0) return;
    setAllocatingParts(true);
    setActionError('');
    try {
      await axiosInstance.post(`/progress/trackers/${tracker.id}/allocate-parts`, {
        parts_requested: n,
      });
      setPartsToAdd('');
      await fetchData();
    } catch (e) {
      setActionError(e.response?.data?.message || 'Failed to allocate parts');
    } finally {
      setAllocatingParts(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader title="Progress Tracker" showBackButton={true} backPath="/progress/trackers" />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  if (loadError) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader title="Progress Tracker" showBackButton={true} backPath="/progress/trackers" />
          <div className="view-content">
            <div className="status-message status-message--error">{loadError}</div>
          </div>
        </div>
      </>
    );
  }

  if (!tracker) return null;

  return (
    <>
      <Navbar />
      <div className="view-wrapper">
        <PageHeader title="Progress Tracker" showBackButton={true} backPath="/progress/trackers" />
        <div className="view-content">
          {actionError ? (
            <div className="status-message status-message--error" style={{ marginBottom: 16 }}>
              {actionError}
            </div>
          ) : null}
          <div className="view-section">
            <h3 className="view-section-title">Summary</h3>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div><strong>ID:</strong> {tracker.id}</div>
              <div><strong>Overall:</strong> {tracker.overall_status}</div>
              <div><strong>Template:</strong> {tracker.template?.name || '-'}</div>
              <div><strong>Donation:</strong> {tracker.donation_id || '-'}</div>
              <div><strong>Token:</strong> {tracker.public_tracking_token || '-'}</div>
            </div>
            {tracker?.template?.is_batchable === true && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 10,
                  alignItems: 'end',
                  marginTop: 12,
                  padding: '10px 12px',
                  background: '#f8fafc',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  maxWidth: 520,
                }}
              >
                <div style={{ flex: '1 1 180px' }}>
                  <FormInput
                    label="Add parts (batchable templates)"
                    name="add_parts"
                    value={partsToAdd}
                    onChange={(e) => setPartsToAdd(e.target.value)}
                    placeholder="e.g. 1"
                    disabled={allocatingParts}
                  />
                </div>
                <button
                  type="button"
                  className="secondary_btn"
                  onClick={allocateMoreParts}
                  disabled={allocatingParts}
                  style={{ height: 40 }}
                >
                  {allocatingParts ? 'Allocating…' : 'Allocate'}
                </button>
              </div>
            )}
            <div className="form-actions" style={{ marginTop: 12 }}>
              <button type="button" className="primary_btn" onClick={regenToken} disabled={saving}>
                {saving ? 'Working...' : (tracker.public_tracking_token ? 'Regenerate Token' : 'Generate Token')}
              </button>
              {/* <button
                type="button"
                className="secondary_btn"
                onClick={() =>
                  navigate(
                    `/progress/trackers/${tracker.id}/steps${batchIdFromUrl ? `?batch_id=${encodeURIComponent(batchIdFromUrl)}` : ''}`,
                  )
                }
                disabled={saving}
              >
                Manage Steps
              </button> */}
              {tracker.donation_id && (
                <button type="button" className="secondary_btn" onClick={() => navigate(`/donations/online_donations/view/${tracker.donation_id}`)}>
                  Open Donation
                </button>
              )}
              {tracker.public_tracking_token && (
                <button type="button" className="secondary_btn" onClick={() => navigate(`/tracking/${tracker.public_tracking_token}`)}>
                  Open Public Page
                </button>
              )}
            </div>
          </div>

          <div className="view-section">
            <h3 className="view-section-title">Steps</h3>
            {batchFilterOptions.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  alignItems: 'center',
                  marginBottom: '12px',
                  padding: '10px 12px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <span style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>Batch:</span>
                <Link
                  to={`/progress/trackers/${tracker.id}`}
                  style={{
                    fontSize: '13px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    background: !batchIdFromUrl ? '#dbeafe' : 'white',
                    color: '#1e40af',
                    border: '1px solid #bfdbfe',
                  }}
                >
                  All
                </Link>
                {batchFilterOptions.map((b) => (
                  <Link
                    key={b.batch_id}
                    to={`/progress/trackers/${tracker.id}?batch_id=${b.batch_id}`}
                    style={{
                      fontSize: '13px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      background:
                        String(batchIdFromUrl) === String(b.batch_id) ? '#dbeafe' : 'white',
                      color: '#1e40af',
                      border: '1px solid #bfdbfe',
                    }}
                    title={
                      [b.tag_number, b.tag_name].filter(Boolean).length
                        ? [b.tag_number, b.tag_name].filter(Boolean).join(' — ')
                        : undefined
                    }
                  >
                    #{b.batch_number}
                    {b.tag_number ? ` · ${b.tag_number}` : ''}
                    {b.tag_name ? ` (${b.tag_name})` : ''}
                  </Link>
                ))}
              </div>
            )}
            {batchIdFromUrl != null &&
              String(batchIdFromUrl).trim() !== '' &&
              Number.isFinite(Number(batchIdFromUrl)) &&
              Number(batchIdFromUrl) > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 10,
                    alignItems: 'end',
                    marginBottom: 12,
                    padding: '10px 12px',
                    background: '#f1f5f9',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ flex: '1 1 200px', minWidth: 160 }}>
                    <FormInput
                      label="Tag number (shared on this batch)"
                      name="batch_tag"
                      value={batchTagDraft}
                      onChange={(e) => setBatchTagDraft(e.target.value)}
                      placeholder="e.g. 441"
                      disabled={savingBatchTag}
                    />
                  </div>
                  <div style={{ flex: '1 1 200px', minWidth: 160 }}>
                    <FormInput
                      label="Tag name (optional label)"
                      name="batch_tag_name"
                      value={batchTagNameDraft}
                      onChange={(e) => setBatchTagNameDraft(e.target.value)}
                      placeholder="e.g. North pen"
                      disabled={savingBatchTag}
                    />
                  </div>
                  <button
                    type="button"
                    className="secondary_btn"
                    onClick={saveBatchTag}
                    disabled={savingBatchTag}
                    style={{ height: 40 }}
                  >
                    {savingBatchTag ? 'Saving…' : 'Save batch tag'}
                  </button>
                </div>
              )}
            {visibleSteps.length === 0 && (tracker.steps || []).length > 0 && (
              <div className="status-message" style={{ marginBottom: 12 }}>
                No steps for the selected batch. Choose another batch or view all.
              </div>
            )}
            <div style={{ display: 'grid', gap: 10 }}>
              {visibleSteps.map((s) => (
                <div key={s.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 600 }}>
                      {s.step_order}. {s.title}
                      {s.batch_id != null && (
                        <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 500, color: '#64748b' }}>
                          (Batch #{s.batch?.batch_number ?? s.batch_id}
                          {s.batch?.tag_number != null && String(s.batch.tag_number).trim() !== ''
                            ? ` · ${String(s.batch.tag_number).trim()}`
                            : ''}
                          {s.batch?.tag_name != null && String(s.batch.tag_name).trim() !== ''
                            ? ` (${String(s.batch.tag_name).trim()})`
                            : ''}
                          )
                        </span>
                      )}
                    </div>
                    <span className={`status-badge status-${s.status}`}>{s.status}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 10, marginTop: 10 }}>
                    <FormSelect
                      label="Status"
                      name={`status_${s.id}`}
                      value={s.status}
                      onChange={(e) => updateStep(s.id, { status: e.target.value })}
                      options={STATUS_OPTIONS}
                    />
                    <FormInput
                      label="Notes"
                      name={`notes_${s.id}`}
                      type="textarea"
                      value={s.notes || ''}
                      onChange={(e) => updateStep(s.id, { notes: e.target.value })}
                      placeholder="Internal notes / donor-safe notes depending on visibility"
                    />
                  </div>

                  {(s.evidence || []).length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {(s.evidence || []).map((ev) => (
                        <a key={ev.id} href={ev.file_url} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>
                          {ev.evidence_label ? `${ev.evidence_label}: ` : ''}{ev.title || ev.file_type}
                        </a>
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 160px', gap: 10, alignItems: 'end' }}>
                    <FormInput
                      label="Evidence URL"
                      name={`evidence_${s.id}`}
                      value={activeStepId === s.id ? evidenceUrl : ''}
                      onChange={(e) => { setActiveStepId(s.id); setEvidenceUrl(e.target.value); }}
                      placeholder="https://..."
                    />
                    <button
                      type="button"
                      className="secondary_btn"
                      onClick={() => {
                        flushSync(() => setActiveStepId(s.id));
                        addEvidence(s.id);
                      }}
                      disabled={saving}
                    >
                      {savingEvidenceStepId === s.id ? 'Adding…' : 'Add Evidence'}
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 10, marginTop: 8 }}>
                    <FormInput
                      label="Evidence Title"
                      name={`evidence_title_${s.id}`}
                      value={activeStepId === s.id ? evidenceTitle : ''}
                      onChange={(e) => { setActiveStepId(s.id); setEvidenceTitle(e.target.value); }}
                      placeholder="Optional"
                    />
                    <FormSelect
                      label="Type"
                      name={`evidence_type_${s.id}`}
                      value={activeStepId === s.id ? evidenceType : 'link'}
                      onChange={(e) => { setActiveStepId(s.id); setEvidenceType(e.target.value); }}
                      options={[
                        { value: 'image', label: 'Image' },
                        { value: 'video', label: 'Video' },
                        { value: 'pdf', label: 'PDF' },
                        { value: 'document', label: 'Document' },
                        { value: 'link', label: 'Link' },
                      ]}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TrackersView;

