import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import Loader from '../../../common/loader/Loader';
import FormTextarea from '../../../common/FormTextarea';
import SearchableMultiSelect from '../../../common/SearchableMultiSelect';
import { PrimaryButton, SecondaryButton } from '../../../common/buttons';
import axiosInstance from '../../../../utils/axios';
import { useAuth } from '../../../../context/AuthContext';
import { getComplaintCasePermissions } from '../../../../utils/permissions';
import {
  COMPLAINT_WORKFLOW_STATUSES,
  DEPARTMENT_OPTIONS,
  getCategoryLabel,
  getStatusLabel,
} from '../shared/complaintCaseConfig';
import '../shared/complaintCase.css';
import './index.css';

export default function ViewComplaintCase() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, permissions } = useAuth();
  const casePerms = useMemo(
    () => getComplaintCasePermissions(permissions, user?.department, user?.role),
    [permissions, user?.department, user?.role],
  );

  const [loading, setLoading] = useState(true);
  const [complaint, setComplaint] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: '', remarks: '', resolution_summary: '' });
  const [remark, setRemark] = useState('');
  const [narratives, setNarratives] = useState({ complainer_narrative: '', accused_narrative: '' });
  const [meetingForm, setMeetingForm] = useState({
    scheduled_at: '',
    location: '',
    agenda: '',
    attendee_user_ids: [],
  });
  const [nomineeForm, setNomineeForm] = useState({
    nominated_departments: [],
    nominated_user_ids: [],
    investigator_ids: [],
  });

  const loadComplaint = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/tickets/case/${id}`);
      const data = response.data?.data;
      setComplaint(data);
      setStatusForm({
        status: data?.complaint_workflow_status || '',
        remarks: '',
        resolution_summary: data?.resolution_summary || '',
      });
      setNarratives({
        complainer_narrative: data?.complainer_narrative || '',
        accused_narrative: data?.accused_narrative || '',
      });
      const userIds = [
        ...(data?.nominated_user_ids || []),
        ...(data?.investigator_ids || []),
      ].filter((uid, idx, arr) => Number.isFinite(Number(uid)) && arr.indexOf(uid) === idx);

      let usersById = {};
      if (userIds.length) {
        try {
          const query = userIds.map((uid) => `ids=${uid}`).join('&');
          const usersRes = await axiosInstance.get(`/users/by-ids?${query}`);
          const users = usersRes.data?.data || usersRes.data || [];
          usersById = Object.fromEntries(
            users.map((u) => [
              u.id,
              {
                id: u.id,
                full_name: u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
                name: u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
              },
            ]),
          );
        } catch {
          /* keep id fallbacks */
        }
      }

      setNomineeForm({
        nominated_departments: (data?.nominated_departments || []).map((d) => ({
          id: d,
          name: DEPARTMENT_OPTIONS.find((opt) => opt.value === d)?.label || d,
        })),
        nominated_user_ids: (data?.nominated_user_ids || []).map((uid) =>
          usersById[uid] || { id: uid, full_name: String(uid), name: String(uid) },
        ),
        investigator_ids: (data?.investigator_ids || []).map((uid) =>
          usersById[uid] || { id: uid, full_name: String(uid), name: String(uid) },
        ),
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load complaint');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadComplaint();
  }, [loadComplaint]);

  const perms = complaint?.permissions || casePerms;

  const updateStatus = async () => {
    try {
      await axiosInstance.patch(`/tickets/case/${id}/status`, statusForm);
      toast.success('Status updated');
      loadComplaint();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    }
  };

  const saveNarratives = async () => {
    try {
      await axiosInstance.patch(`/tickets/case/${id}/narratives`, narratives);
      toast.success('Narratives saved');
      loadComplaint();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save narratives');
    }
  };

  const saveNominees = async () => {
    try {
      await axiosInstance.patch(`/tickets/case/${id}/nominees`, {
        nominated_departments: nomineeForm.nominated_departments.map((d) => d.id || d.value || d),
        nominated_user_ids: nomineeForm.nominated_user_ids.map((u) => Number(u.id || u.value)),
        investigator_ids: nomineeForm.investigator_ids.map((u) => Number(u.id || u.value)),
      });
      toast.success('Nominees updated');
      loadComplaint();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update nominees');
    }
  };

  const addRemark = async () => {
    if (!remark.trim()) return;
    try {
      await axiosInstance.post(`/tickets/case/${id}/investigation`, { remarks: remark.trim() });
      setRemark('');
      toast.success('Investigation remark added');
      loadComplaint();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add remark');
    }
  };

  const scheduleMeeting = async () => {
    if (!meetingForm.scheduled_at) {
      toast.error('Meeting date/time is required');
      return;
    }
    try {
      await axiosInstance.post(`/tickets/case/${id}/meetings`, {
        scheduled_at: meetingForm.scheduled_at,
        location: meetingForm.location,
        agenda: meetingForm.agenda,
        attendee_user_ids: meetingForm.attendee_user_ids.map((u) => Number(u.id || u.value)),
      });
      toast.success('Meeting scheduled');
      setMeetingForm({ scheduled_at: '', location: '', agenda: '', attendee_user_ids: [] });
      loadComplaint();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to schedule meeting');
    }
  };

  const completeMeeting = async (meetingId, notes) => {
    try {
      await axiosInstance.patch(`/tickets/case/${id}/meetings/${meetingId}`, {
        status: 'completed',
        discussion_notes: notes,
      });
      toast.success('Meeting marked completed');
      loadComplaint();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update meeting');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Loader />
      </>
    );
  }

  if (!complaint) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader title="Complaint Not Found" showBackButton backPath="/complaints/list" showAdd={false} />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          title={`Complaint ${complaint.complaint_code}`}
          showBackButton
          backPath="/complaints/list"
          showAdd={false}
        />
        <div className="list-content complaint-case-view cc-shell">
          <section className="cc-panel cc-panel--summary">
            <div className="cc-summary-head">
              <div>
                <div className="cc-summary-head__meta">
                  <span className="cc-code">{complaint.complaint_code}</span>
                  <span className={`cc-status cc-status--${complaint.complaint_workflow_status}`}>
                    {getStatusLabel(complaint.complaint_workflow_status)}
                  </span>
                </div>
                <h2>{complaint.title}</h2>
              </div>
              <div className="cc-summary-head__type">
                {getCategoryLabel(complaint.complaint_category, complaint.complaint_category_custom)}
              </div>
            </div>
            <div className="cc-summary-grid">
              <div className="cc-summary-item">
                <strong>Project / Location</strong>
                <div>{complaint.project_name || '—'}</div>
              </div>
              <div className="cc-summary-item">
                <strong>Meetings Held</strong>
                <div>{complaint.meetings?.length || 0}</div>
              </div>
              <div className="cc-summary-item">
                <strong>Submitted</strong>
                <div>
                  {complaint.created_at
                    ? new Date(complaint.created_at).toLocaleString()
                    : '—'}
                </div>
              </div>
              {complaint.related_issue && (
                <div className="cc-summary-item">
                  <strong>Related Issue</strong>
                  <div>
                    <button
                      type="button"
                      className="cc-link-btn"
                      onClick={() => navigate(`/tickets/view/${complaint.related_issue.id}`)}
                    >
                      #{complaint.related_issue.id} — {complaint.related_issue.title}
                    </button>
                  </div>
                </div>
              )}
            </div>
            {complaint.description && <p className="cc-description">{complaint.description}</p>}
          </section>

          <div className="cc-view-grid">
            <section className="cc-panel">
              <h3 className="cc-section-title"><span /> Complainer Narrative</h3>
              <FormTextarea
                value={narratives.complainer_narrative}
                onChange={(e) => setNarratives((p) => ({ ...p, complainer_narrative: e.target.value }))}
                rows={6}
                disabled={!perms.canAddNarrative && complaint.created_by_id !== user?.id}
              />
            </section>

            <section className="cc-panel">
              <h3 className="cc-section-title"><span /> Accused / Nominee Narrative</h3>
              <FormTextarea
                value={narratives.accused_narrative}
                onChange={(e) => setNarratives((p) => ({ ...p, accused_narrative: e.target.value }))}
                rows={6}
                disabled={!perms.canAddNarrative}
              />
            </section>
          </div>

          {(perms.canAddNarrative || complaint.created_by_id === user?.id) && (
            <div className="cc-actions-row">
              <PrimaryButton onClick={saveNarratives}>Save Narratives</PrimaryButton>
            </div>
          )}

          {(perms.canViewNominees || perms.isStakeholder) && (
            <section className="cc-panel">
              <h3 className="cc-section-title"><span /> Nominees & Investigators</h3>
              <div className="cc-form-grid">
                <div>
                  <SearchableMultiSelect
                    label="Nominated Departments"
                    value={nomineeForm.nominated_departments}
                    onSelect={(items) => setNomineeForm((p) => ({ ...p, nominated_departments: items }))}
                    onSearch={async (term) => {
                      const t = String(term || '').toLowerCase();
                      return DEPARTMENT_OPTIONS.filter((d) =>
                        d.label.toLowerCase().includes(t) || d.value.toLowerCase().includes(t),
                      ).map((d) => ({ id: d.value, name: d.label }));
                    }}
                    valueKey="id"
                    displayKey="name"
                    minSearchLength={0}
                    disabled={!perms.canManageNominees}
                  />
                </div>
                <div>
                  <SearchableMultiSelect
                    label="Nominated Users"
                    value={nomineeForm.nominated_user_ids}
                    onSelect={(items) => setNomineeForm((p) => ({ ...p, nominated_user_ids: items }))}
                    apiEndpoint="/users/options"
                    apiParams={{ active: true }}
                    valueKey="id"
                    displayKey="full_name"
                    disabled={!perms.canManageNominees}
                  />
                </div>
                <div>
                  <SearchableMultiSelect
                    label="Investigators"
                    value={nomineeForm.investigator_ids}
                    onSelect={(items) => setNomineeForm((p) => ({ ...p, investigator_ids: items }))}
                    apiEndpoint="/users/options"
                    apiParams={{ active: true }}
                    valueKey="id"
                    displayKey="full_name"
                    disabled={!perms.canManageNominees}
                  />
                </div>
              </div>
              {perms.canManageNominees && (
                <PrimaryButton onClick={saveNominees}>Update Nominees</PrimaryButton>
              )}
            </section>
          )}

          {perms.canUpdateStatus && (
            <section className="cc-panel">
              <h3 className="cc-section-title"><span /> Update Status</h3>
              <div className="cc-form-grid">
                <label className="form-label">
                  Status
                  <select
                    className="form-input"
                    value={statusForm.status}
                    onChange={(e) => setStatusForm((p) => ({ ...p, status: e.target.value }))}
                  >
                    {COMPLAINT_WORKFLOW_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </label>
                <FormTextarea
                  label="Remarks"
                  value={statusForm.remarks}
                  onChange={(e) => setStatusForm((p) => ({ ...p, remarks: e.target.value }))}
                  rows={3}
                />
                <FormTextarea
                  label="Resolution Summary"
                  value={statusForm.resolution_summary}
                  onChange={(e) => setStatusForm((p) => ({ ...p, resolution_summary: e.target.value }))}
                  rows={3}
                />
              </div>
              <PrimaryButton onClick={updateStatus}>Update Status</PrimaryButton>
            </section>
          )}

          {perms.canInvestigate && (
            <section className="cc-panel">
              <h3 className="cc-section-title"><span /> Investigation Remarks</h3>
              <FormTextarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={3} />
              <PrimaryButton onClick={addRemark}>Add Remark</PrimaryButton>
              <ul className="cc-log-list">
                {(complaint.investigation_logs || []).map((log) => (
                  <li key={log.id}>
                    <strong>{log.action?.replace(/_/g, ' ')}</strong>
                    <span>{new Date(log.created_at).toLocaleString()}</span>
                    <p>{log.remarks}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {perms.canScheduleMeetings && (
            <section className="cc-panel">
              <h3 className="cc-section-title"><span /> Meetings</h3>
              <div className="cc-form-grid">
                <FormInputCompat
                  label="Date & Time"
                  type="datetime-local"
                  value={meetingForm.scheduled_at}
                  onChange={(e) => setMeetingForm((p) => ({ ...p, scheduled_at: e.target.value }))}
                />
                <FormInputCompat
                  label="Location"
                  value={meetingForm.location}
                  onChange={(e) => setMeetingForm((p) => ({ ...p, location: e.target.value }))}
                />
                <FormTextarea
                  label="Agenda"
                  value={meetingForm.agenda}
                  onChange={(e) => setMeetingForm((p) => ({ ...p, agenda: e.target.value }))}
                  rows={2}
                />
                <div>
                  <SearchableMultiSelect
                    label="Attendees"
                    value={meetingForm.attendee_user_ids}
                    onSelect={(items) => setMeetingForm((p) => ({ ...p, attendee_user_ids: items }))}
                    apiEndpoint="/users/options"
                    apiParams={{ active: true }}
                    valueKey="id"
                    displayKey="full_name"
                  />
                </div>
              </div>
              <PrimaryButton onClick={scheduleMeeting}>Schedule Meeting</PrimaryButton>

              <ul className="cc-meeting-list">
                {(complaint.meetings || []).map((meeting) => (
                  <li key={meeting.id}>
                    <div><strong>{new Date(meeting.scheduled_at).toLocaleString()}</strong> — {meeting.status}</div>
                    <div>{meeting.location || 'No location'} · {meeting.agenda || 'No agenda'}</div>
                    {meeting.discussion_notes && <p>{meeting.discussion_notes}</p>}
                    {meeting.status === 'scheduled' && (
                      <SecondaryButton
                        onClick={() => {
                          const notes = window.prompt('Meeting discussion notes');
                          if (notes != null) completeMeeting(meeting.id, notes);
                        }}
                      >
                        Mark Completed
                      </SecondaryButton>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

function FormInputCompat({ label, type = 'text', value, onChange }) {
  return (
    <label className="form-label">
      {label}
      <input className="form-input" type={type} value={value} onChange={onChange} />
    </label>
  );
}
