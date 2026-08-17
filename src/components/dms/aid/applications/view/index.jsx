import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import { useAuth } from '../../../../../context/AuthContext';
import { hasPermissionByPath } from '../../../../../utils/permissions';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormSelect from '../../../../common/FormSelect';
import FormTextarea from '../../../../common/FormTextarea';
import {
  AID_CEO_OPTIONS,
  AID_DELIVERY_OPTIONS,
  AID_VERIFICATION_CHECKLIST,
  aidStatusTone,
  formatAidStatus,
} from '../../aidConstants';
import '../../aid.css';

const emptyChecklist = () =>
  Object.fromEntries(AID_VERIFICATION_CHECKLIST.map((i) => [i.key, false]));

const AidApplicationView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const canUpdate =
    hasPermissionByPath(permissions, 'fund_raising.aid_applications.update') ||
    permissions?.super_admin ||
    permissions?.fund_raising_manager;
  const canCeo =
    hasPermissionByPath(permissions, 'fund_raising.aid_applications.ceo_approve') ||
    permissions?.super_admin ||
    permissions?.fund_raising_manager;
  const canDeliver =
    hasPermissionByPath(permissions, 'fund_raising.aid_applications.deliver') ||
    permissions?.super_admin ||
    permissions?.fund_raising_manager;

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [tab, setTab] = useState('verification');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [checklist, setChecklist] = useState(emptyChecklist);
  const [leakageOverride, setLeakageOverride] = useState('');
  const [ceoDecision, setCeoDecision] = useState('approved');
  const [ceoReason, setCeoReason] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState('delivered');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const appRes = await axiosInstance.get(`/aid/applications/${id}`);
      const payload = appRes.data?.data || null;
      setApp(payload);
      if (payload?.verification_checklist && typeof payload.verification_checklist === 'object') {
        setChecklist({
          ...emptyChecklist(),
          ...Object.fromEntries(
            AID_VERIFICATION_CHECKLIST.map((i) => [
              i.key,
              payload.verification_checklist[i.key] === true,
            ]),
          ),
        });
      } else {
        setChecklist(emptyChecklist());
      }
      if (payload?.verification_notes) setVerifyNotes(payload.verification_notes);
      if (payload?.leakage_override_reason) {
        setLeakageOverride(payload.leakage_override_reason);
      } else {
        setLeakageOverride('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load application');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn) => {
    setBusy(true);
    setActionError('');
    try {
      await fn();
      await load();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const uploadFile = async (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('context', tab);
    await run(() =>
      axiosInstance.post(`/aid/applications/${id}/attachments/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="form-content">Loading…</div>
      </>
    );
  }
  if (error || !app) {
    return (
      <>
        <Navbar />
        <div className="form-content">
          <div className="error-message">{error || 'Not found'}</div>
        </div>
      </>
    );
  }

  const status = app.status;
  const attachments = app.attachments || [];
  const flags = app.duplicate_flags || {};
  const history = app.aid_history || {};
  const needsLeakageOverride =
    !!history.requires_override && !history.override_recorded;
  const leakageOverrideOk =
    !needsLeakageOverride || String(leakageOverride || '').trim().length >= 5;
  const checklistItems =
    app.verification_checklist_items?.length > 0
      ? app.verification_checklist_items
      : AID_VERIFICATION_CHECKLIST;
  const checklistComplete = checklistItems.every(
    (item) => !item.required || checklist[item.key] === true,
  );
  const showReject =
    canUpdate && !['successful', 'delivered', 'rejected'].includes(status);
  const showVerify = canUpdate && ['submitted', 'under_review'].includes(status);
  const showCeo = canCeo && status === 'ceo_approval_required';
  const showDelivery = canDeliver && (status === 'successful' || status === 'delivered');
  const tabAtt = attachments.filter((a) => a.context === tab);
  const verifiedByName = app.verified_by
    ? [app.verified_by.first_name, app.verified_by.last_name].filter(Boolean).join(' ') ||
      app.verified_by.email
    : null;

  const formatWhen = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleString();
    } catch {
      return String(d);
    }
  };

  return (
    <>
      <Navbar />
      <div className="form-content aid-view">
        <PageHeader
          title={app.application_no}
          backPath="/dms/aid/applications/list"
          onBackClick={() => navigate('/dms/aid/applications/list')}
          showAdd={false}
        />

        {actionError && <div className="error-message">{actionError}</div>}

        <div className="aid-hero">
          <div>
            <h2 style={{ margin: '0 0 6px' }}>{app.title || 'Aid request'}</h2>
            <p style={{ margin: 0, color: '#64748b' }}>{app.request_summary || 'No summary'}</p>
          </div>
          <span className={`aid-status-pill aid-status-pill--${aidStatusTone(status)}`}>
            {formatAidStatus(status)}
          </span>
        </div>

        {history.requires_override && (
          <div className="aid-leak-banner">
            <strong>Aid history / leakage control</strong>
            {(history.reasons || []).length > 0 && (
              <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13 }}>
                {history.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
            <div className="aid-leak-pills">
              {history.already_received_this_year && (
                <span className="aid-status-pill aid-status-pill--danger">
                  Already received this year ({history.calendar_year})
                </span>
              )}
              {history.within_cooldown && (
                <span className="aid-status-pill aid-status-pill--warn">
                  Within {history.cooldown_days}-day cooldown
                  {history.days_since_last_success != null
                    ? ` · ${history.days_since_last_success}d since last`
                    : ''}
                </span>
              )}
              {history.override_recorded && (
                <span className="aid-status-pill aid-status-pill--info">
                  Override recorded
                </span>
              )}
            </div>
            {(history.person_successful || []).length > 0 && (
              <div className="aid-dup-group">
                <em>Beneficiary prior successful aids</em>
                <ul>
                  {history.person_successful.map((a) => (
                    <li key={`ps-${a.id}`}>
                      <Link to={`/dms/aid/applications/view/${a.id}`}>
                        {a.application_no}
                      </Link>
                      {` · ${formatAidStatus(a.status)} · ${a.requested_aid_type || '—'}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(history.household_successful || []).length > 0 && (
              <div className="aid-dup-group">
                <em>Household prior successful aids</em>
                <ul>
                  {history.household_successful.map((a) => (
                    <li key={`hs-${a.id}`}>
                      <Link to={`/dms/aid/applications/view/${a.id}`}>
                        {a.application_no}
                      </Link>
                      {` · ${a.beneficiary_name || '—'} · ${formatAidStatus(a.status)}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {app.leakage_override_reason && (
              <p style={{ fontSize: 13, marginTop: 8, marginBottom: 0 }}>
                Override reason: {app.leakage_override_reason}
              </p>
            )}
            {needsLeakageOverride && (showVerify || (showCeo && ceoDecision === 'approved')) && (
              <div style={{ marginTop: 12 }}>
                <FormTextarea
                  label="Leakage override reason (required to proceed)"
                  value={leakageOverride}
                  onChange={(e) => setLeakageOverride(e.target.value)}
                  rows={2}
                  placeholder="Explain why this case should proceed despite cooldown / same-year aid…"
                />
              </div>
            )}
          </div>
        )}

        {!history.requires_override &&
          ((history.person_successful || []).length > 0 ||
            (history.household_successful || []).length > 0) && (
            <div className="aid-history-banner">
              <strong>Aid history</strong>
              <p style={{ margin: '6px 0 0', fontSize: 13 }}>
                Prior successful aids found, outside cooldown / same-year block.
              </p>
              <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13 }}>
                {[...(history.person_successful || []), ...(history.household_successful || [])]
                  .slice(0, 8)
                  .map((a) => (
                    <li key={`hist-${a.id}`}>
                      <Link to={`/dms/aid/applications/view/${a.id}`}>
                        {a.application_no}
                      </Link>
                      {a.beneficiary_name ? ` · ${a.beneficiary_name}` : ''}
                      {` · ${formatAidStatus(a.status)}`}
                    </li>
                  ))}
              </ul>
            </div>
          )}

        {flags.has_flags && (
          <div className="aid-dup-banner">
            <strong>Duplicate / prior-aid flags</strong>
            <p style={{ margin: '6px 0 0', fontSize: 13 }}>
              Review these before checking “Duplicate / prior-aid flags reviewed”.
            </p>
            {(flags.cnic_matches || []).length > 0 && (
              <div className="aid-dup-group">
                <em>Same CNIC</em>
                <ul>
                  {flags.cnic_matches.map((p) => (
                    <li key={`cnic-${p.id}`}>
                      <Link to={`/dms/aid/people/view/${p.id}`}>{p.full_name}</Link>
                      {p.cnic ? ` · ${p.cnic}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(flags.phone_matches || []).length > 0 && (
              <div className="aid-dup-group">
                <em>Same phone</em>
                <ul>
                  {flags.phone_matches.map((p) => (
                    <li key={`phone-${p.id}`}>
                      <Link to={`/dms/aid/people/view/${p.id}`}>{p.full_name}</Link>
                      {p.phone ? ` · ${p.phone}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(flags.address_matches || []).length > 0 && (
              <div className="aid-dup-group">
                <em>Similar address</em>
                <ul>
                  {flags.address_matches.map((p) => (
                    <li key={`addr-${p.id}`}>
                      <Link to={`/dms/aid/people/view/${p.id}`}>{p.full_name}</Link>
                      {p.address ? ` · ${p.address}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(flags.prior_applications || []).length > 0 && (
              <div className="aid-dup-group">
                <em>Prior / related applications</em>
                <ul>
                  {flags.prior_applications.map((a) => (
                    <li key={`app-${a.id}`}>
                      <Link to={`/dms/aid/applications/view/${a.id}`}>
                        {a.application_no}
                      </Link>
                      {` · ${formatAidStatus(a.status)}`}
                      {a.beneficiary_name ? ` · ${a.beneficiary_name}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {(showVerify || app.verification_checklist) && (
          <section className="aid-section" style={{ marginBottom: 16 }}>
            <h3>Home visit / verification checklist</h3>
            {(app.verified_at || verifiedByName) && (
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 0 }}>
                Verified by: {verifiedByName || '—'} · At: {formatWhen(app.verified_at)}
              </p>
            )}
            <div className="aid-checklist">
              {checklistItems.map((item) => (
                <label key={item.key} className="aid-checklist__item">
                  <input
                    type="checkbox"
                    checked={checklist[item.key] === true}
                    disabled={!showVerify || busy}
                    onChange={(e) =>
                      setChecklist((p) => ({ ...p, [item.key]: e.target.checked }))
                    }
                  />
                  <span>
                    {item.label}
                    {item.required ? ' *' : ''}
                  </span>
                </label>
              ))}
            </div>
            {showVerify && !checklistComplete && (
              <p style={{ fontSize: 12, color: '#b45309', marginBottom: 0 }}>
                Tick all required items (*) before marking verified.
              </p>
            )}
            {showVerify && (
              <div style={{ marginTop: 12 }}>
                <FormTextarea
                  label="Verification notes (optional)"
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  rows={2}
                />
              </div>
            )}
            {!showVerify && app.verification_notes && (
              <p style={{ fontSize: 13, color: '#64748b' }}>
                Notes: {app.verification_notes}
              </p>
            )}
          </section>
        )}

        {(showReject || showVerify || showCeo || showDelivery) && (
          <div className="aid-cta-strip">
            {showReject && (
              <button
                type="button"
                className="secondary-btn"
                disabled={busy}
                onClick={() => setRejectOpen(true)}
              >
                Reject
              </button>
            )}
            {showVerify && (
              <button
                type="button"
                className="primary-btn"
                disabled={busy || !checklistComplete || !leakageOverrideOk}
                title={
                  !checklistComplete
                    ? 'Complete all checklist items first'
                    : !leakageOverrideOk
                      ? 'Leakage override reason required'
                      : 'Submit verification'
                }
                onClick={() =>
                  run(() =>
                    axiosInstance.post(`/aid/applications/${id}/verify`, {
                      verification_notes: verifyNotes || undefined,
                      verification_checklist: checklist,
                      leakage_override_reason: needsLeakageOverride
                        ? leakageOverride.trim()
                        : undefined,
                    }),
                  )
                }
              >
                Mark verified → CEO
              </button>
            )}
            {showCeo && (
              <>
                <FormSelect
                  label="CEO decision"
                  value={ceoDecision}
                  onChange={(e) => setCeoDecision(e.target.value)}
                  options={AID_CEO_OPTIONS}
                />
                <button
                  type="button"
                  className="primary-btn"
                  disabled={
                    busy ||
                    (ceoDecision === 'approved' && !leakageOverrideOk)
                  }
                  onClick={() =>
                    run(() =>
                      axiosInstance.post(`/aid/applications/${id}/ceo-decide`, {
                        decision: ceoDecision,
                        ceo_rejection_reason:
                          ceoDecision === 'rejected'
                            ? ceoReason || 'Rejected by CEO'
                            : undefined,
                        leakage_override_reason:
                          ceoDecision === 'approved' && needsLeakageOverride
                            ? leakageOverride.trim()
                            : undefined,
                      }),
                    )
                  }
                >
                  Record CEO decision
                </button>
              </>
            )}
            {showDelivery && (
              <>
                <FormSelect
                  label="Delivery status"
                  value={deliveryStatus}
                  onChange={(e) => setDeliveryStatus(e.target.value)}
                  options={AID_DELIVERY_OPTIONS}
                />
                <button
                  type="button"
                  className="primary-btn"
                  disabled={busy}
                  onClick={() =>
                    run(() =>
                      axiosInstance.post(`/aid/applications/${id}/delivery`, {
                        delivery_status: deliveryStatus,
                        delivery_notes: deliveryNotes || undefined,
                      }),
                    )
                  }
                >
                  Update delivery
                </button>
              </>
            )}
          </div>
        )}

        {showCeo && ceoDecision === 'rejected' && (
          <FormTextarea
            label="CEO rejection reason"
            value={ceoReason}
            onChange={(e) => setCeoReason(e.target.value)}
            rows={2}
          />
        )}
        {showDelivery && (
          <FormTextarea
            label="Delivery notes"
            value={deliveryNotes}
            onChange={(e) => setDeliveryNotes(e.target.value)}
            rows={2}
          />
        )}
        {rejectOpen && (
          <div className="aid-card" style={{ marginBottom: 16 }}>
            <FormTextarea
              label="Rejection reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              required
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                type="button"
                className="primary-btn"
                disabled={busy || !rejectReason.trim()}
                onClick={() => {
                  const reason = rejectReason.trim();
                  setRejectOpen(false);
                  run(() =>
                    axiosInstance.post(`/aid/applications/${id}/reject`, {
                      rejection_reason: reason,
                    }),
                  );
                }}
              >
                Confirm reject
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setRejectOpen(false);
                  setRejectReason('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="aid-sections">
          <section className="aid-section">
            <h3>Beneficiary</h3>
            {app.beneficiary ? (
              <>
                <p>
                  <Link to={`/dms/aid/people/view/${app.beneficiary.id}`}>
                    {app.beneficiary.full_name}
                  </Link>
                </p>
                <p style={{ fontSize: 13, color: '#64748b' }}>
                  CNIC: {app.beneficiary.cnic || '—'} · Phone: {app.beneficiary.phone || '—'}
                  {app.beneficiary.city ? ` · ${app.beneficiary.city}` : ''}
                  {app.beneficiary.marital_status
                    ? ` · ${app.beneficiary.marital_status}`
                    : ''}
                </p>
                {app.beneficiary.address && (
                  <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                    Address: {app.beneficiary.address}
                  </p>
                )}
                {(app.beneficiary.occupation || app.beneficiary.monthly_income) && (
                  <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                    {app.beneficiary.occupation
                      ? `Profession: ${app.beneficiary.occupation}`
                      : null}
                    {app.beneficiary.occupation && app.beneficiary.monthly_income
                      ? ' · '
                      : ''}
                    {app.beneficiary.monthly_income
                      ? `Income: PKR ${app.beneficiary.monthly_income}`
                      : null}
                  </p>
                )}
              </>
            ) : (
              <p>—</p>
            )}
          </section>
          <section className="aid-section">
            <h3>Writer</h3>
            {app.writer ? (
              <>
                <p>
                  <Link to={`/dms/aid/people/view/${app.writer.id}`}>{app.writer.full_name}</Link>
                </p>
                <p style={{ fontSize: 13, color: '#64748b', textTransform: 'capitalize' }}>
                  Relation: {app.writer_relation || '—'}
                  {app.writer.phone ? ` · ${app.writer.phone}` : ''}
                  {app.writer.city ? ` · ${app.writer.city}` : ''}
                </p>
                {app.writer.address && (
                  <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                    Address: {app.writer.address}
                  </p>
                )}
                {(app.writer.occupation || app.writer.monthly_income) && (
                  <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                    {app.writer.occupation ? `Profession: ${app.writer.occupation}` : null}
                    {app.writer.occupation && app.writer.monthly_income ? ' · ' : ''}
                    {app.writer.monthly_income
                      ? `Income: PKR ${app.writer.monthly_income}`
                      : null}
                  </p>
                )}
              </>
            ) : (
              <p>—</p>
            )}
          </section>
          <section className="aid-section">
            <h3>Case details</h3>
            <p style={{ textTransform: 'capitalize' }}>Aid type: {app.requested_aid_type}</p>
            <p>CEO: {app.ceo_approval_status}</p>
            <p>Delivery: {app.delivery_status}</p>
            {app.rejection_reason && (
              <p style={{ color: '#b91c1c' }}>Rejection: {app.rejection_reason}</p>
            )}
            {app.ceo_rejection_reason && (
              <p style={{ color: '#b91c1c' }}>CEO rejection: {app.ceo_rejection_reason}</p>
            )}
          </section>
        </div>

        <section className="aid-section" style={{ marginTop: 16 }}>
          <h3>Attachments</h3>
          <div className="aid-tabs">
            {['verification', 'delivery', 'profile'].map((t) => (
              <button
                key={t}
                type="button"
                className={`aid-tab ${tab === t ? 'aid-tab--active' : ''}`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          {canUpdate && (
            <input
              type="file"
              style={{ marginBottom: 12 }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadFile(f);
                e.target.value = '';
              }}
            />
          )}
          {tabAtt.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No {tab} attachments.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {tabAtt.map((a) => (
                <li key={a.id} style={{ marginBottom: 6 }}>
                  <a href={a.file_url} target="_blank" rel="noreferrer">
                    {a.file_name}
                  </a>
                  {canUpdate && (
                    <button
                      type="button"
                      className="secondary-btn"
                      style={{ marginLeft: 8, padding: '2px 8px', fontSize: 12 }}
                      onClick={() =>
                        run(() =>
                          axiosInstance.delete(`/aid/applications/attachments/${a.id}`),
                        )
                      }
                    >
                      Delete
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

    </>
  );
};

export default AidApplicationView;
