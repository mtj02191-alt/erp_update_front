import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import { FaPlus, FaMinus, FaFileAlt, FaFileInvoiceDollar } from 'react-icons/fa';
import './index.css';

const QuickNote = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category');
  const [isDetailedMode, setIsDetailedMode] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: categoryFromUrl || 'today_task',
    title: '',
    details: '',
    related_person: '',
    department: '',
    priority: 'medium',
    due_date: '',
    status: 'unprocessed',
    attachment: '',
    voice_note: '',
    pa_remarks: '',
    ceo_remarks: '',
    // Follow-up fields
    follow_up_requested_from: '',
    follow_up_requested_date: '',
    follow_up_last_date: '',
    follow_up_next_date: '',
    follow_up_current_response: '',
    follow_up_remarks: '',
    follow_up_history: [],
    // Meeting fields
    meeting_date: '',
    meeting_with: '',
    meeting_subject: '',
    meeting_discussion_points: [{ id: Date.now().toString(), content: '' }],
    meeting_decisions: [{ id: Date.now().toString(), content: '' }],
    meeting_action_items: [{ id: Date.now().toString(), content: '', assigned_to: '', due_date: '', status: 'pending' }],
    // Emails & Approvals fields
    approval_type: '',
    approval_requested_by: '',
    approval_subject: '',
    approval_reference_number: '',
    approval_amount: '',
    approval_decision: 'pending',
    approval_decision_remarks: '',
    // Waiting Response fields
    waiting_response_requested_from: '',
    waiting_response_request_date: '',
    waiting_response_expected_date: '',
    waiting_response_last_reminder_date: '',
    waiting_response_status: 'waiting_response',
    waiting_response_remarks: '',
    waiting_response_reminders: [{ id: Date.now().toString(), date: '', notes: '' }],
    // Visitors/Calls/WhatsApp fields
    type: 'visitor', // 'visitor' | 'call' | 'whatsapp'
    visit_datetime: '',
    visitor_name: '',
    organization: '',
    purpose: '',
    visitor_meeting_with: '',
    visitor_department: '',
    protocol_required: '',
    expected_duration: '',
    visitor_outcome: '',
    caller_name: '',
    phone_number: '',
    call_purpose: '',
    call_summary: '',
    follow_up_required: 'No',
    follow_up_date: '',
    assigned_to: '',
    contact_name: '',
    message_summary: '',
    required_action: '',
    attachment_url: '',
    response_status: '',
    relatedNoteId: null,
    remarks: '',
    // Project Command Sheet fields
    project_name: '',
    project_details: '',
    discussions: '',
    decisions: '',
    meeting_notes: '',
    pending_items: [],
    action_items: [],
    start_date: '',
    end_date: '',
    pcs_status: 'Pending',
    next_steps: '',
    results: ''
  });
  const [loading, setLoading] = useState(false);

  // Update type when category changes
  useEffect(() => {
    if (formData.category === 'visitors') {
      setFormData(prev => ({ ...prev, type: 'visitor' }));
    } else if (formData.category === 'calls') {
      setFormData(prev => ({ ...prev, type: 'call' }));
    } else if (formData.category === 'whatsapp') {
      setFormData(prev => ({ ...prev, type: 'whatsapp' }));
    }
  }, [formData.category]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleArrayItemChange = (field, index, value) => {
    const newArray = [...formData[field]];
    newArray[index] = { ...newArray[index], ...value };
    setFormData({ ...formData, [field]: newArray });
  };

  const addArrayItem = (field, defaultItem) => {
    setFormData({
      ...formData,
      [field]: [...formData[field], { id: Date.now().toString(), ...defaultItem }]
    });
  };

  const removeArrayItem = (field, index) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: newArray });
  };

  // Helper function to clean empty strings
  const cleanEmptyStrings = (obj) => {
    const cleaned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (typeof value === 'string' && value.trim() === '') {
          cleaned[key] = null;
        } else {
          cleaned[key] = value;
        }
      }
    }
    return cleaned;
  };

  // Helper function to build visitor payload with correct field names (camelCase to snake_case)
  const buildVisitorPayload = (data, relatedNoteId = null) => {
    const type = data.type;
    // Common fields
    const payload = {
      type,
      status: data.status || 'Pending',
      visit_datetime: data.visitDatetime,
      remarks: data.remarks,
    };
    if (relatedNoteId) {
      payload.related_note_id = relatedNoteId;
    }

    // Type-specific fields
    if (type === 'visitor') {
      return {
        ...payload,
        visitor_name: data.visitorName,
        organization: data.organization,
        purpose: data.purpose,
        meeting_with: data.meetingWith,
        department: data.visitorDepartment,
        protocol_required: data.protocolRequired,
        expected_duration: data.expectedDuration,
        visitor_outcome: data.visitorOutcome,
      };
    }
    if (type === 'call') {
      const callPayload = {
        ...payload,
        caller_name: data.callerName,
        organization: data.organization,
        phone_number: data.phoneNumber,
        call_purpose: data.callPurpose,
        call_summary: data.callSummary,
        follow_up_required: data.followUpRequired,
      };
      if (data.followUpRequired === 'Yes' && data.followUpDate) {
        callPayload.follow_up_date = data.followUpDate;
        callPayload.assigned_to = data.assignedTo;
      }
      return callPayload;
    }
    if (type === 'whatsapp') {
      return {
        ...payload,
        contact_name: data.contactName,
        phone_number: data.whatsappPhoneNumber,
        message_summary: data.messageSummary,
        required_action: data.requiredAction,
        attachment_url: data.attachmentUrl,
        response_status: data.responseStatus,
      };
    }
    return payload;
  };

  // Helper function to build project command sheet payload
  const buildPcsPayload = (data, relatedNoteId = null) => {
    return {
      project_name: data.projectName,
      project_details: data.projectDetails,
      discussions: data.discussions,
      decisions: data.decisions,
      meeting_notes: data.meetingNotes,
      pending_items: data.pendingItems || [],
      action_items: data.actionItems || [],
      next_steps: data.nextSteps,
      results: data.results,
      start_date: data.startDate || null,
      end_date: data.endDate || null,
      status: data.pcsStatus || 'Pending'
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // First: Always send to ceo-notes to create the note record
      let cleanedNoteData = { ...formData };
      cleanedNoteData = cleanEmptyStrings(cleanedNoteData);
      cleanedNoteData.meeting_discussion_points = formData.meeting_discussion_points.filter(p => p.content.trim());
      cleanedNoteData.meeting_decisions = formData.meeting_decisions.filter(d => d.content.trim());
      cleanedNoteData.meeting_action_items = formData.meeting_action_items.filter(a => a.content.trim());

      // For categories that correspond to visitor types, set the type appropriately
      if (formData.category === 'visitors') {
        cleanedNoteData.type = 'visitor';
      } else if (formData.category === 'calls') {
        cleanedNoteData.type = 'call';
      } else if (formData.category === 'whatsapp') {
        cleanedNoteData.type = 'whatsapp';
      }
      

      await axios.post('/ceo-notes', cleanedNoteData);
      toast.success('Note created successfully');

      navigate('/ceo-office/dashboard');
    } catch (error) {
      console.error('Error creating record:', error);
      toast.error('Failed to create record');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'top_priority', label: 'Top Priority' },
    { value: 'today_task', label: 'Today Task' },
    { value: 'follow_up', label: 'Follow-up' },
    { value: 'visitors', label: 'Visitors' },
    { value: 'calls', label: 'Calls' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'meetings', label: 'Meetings' },
    { value: 'ceo_direct_orders', label: 'CEO Direct Orders' },
    { value: 'important_decisions', label: 'Important Decisions' },
    { value: 'emails_and_approvals', label: 'Emails & Approvals' },
    { value: 'waiting_response', label: 'Waiting Response' },
    { value: 'project_command_sheets', label: 'Project Command Sheets' },
    { value: 'project_notes', label: 'Project Notes' },
    { value: 'completed', label: 'Completed' },
  ];

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
  ];

  const statuses = [
    { value: 'unprocessed', label: 'Unprocessed' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'waiting_response', label: 'Waiting Response' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'completed', label: 'Completed' },
    { value: 'closed', label: 'Closed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const departments = [
    "admin",
    "store",
    "procurements",
    "accounts_and_finance",
    "program",
    "it",
    "hr",
    "marketing",
    "audio_video",
    "fund_raising",
    "meal",
    "health",
    "executive_office",
    "ceo",
    "internal_audit",
    "crd",
    "aas_lab"
  ];

  const approvalDecisions = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'request_clarification', label: 'Request Clarification' },
  ];

  const waitingResponseStatuses = [
    { value: 'waiting_response', label: 'Waiting Response' },
    { value: 'reminder_sent', label: 'Reminder Sent' },
    { value: 'received', label: 'Received' },
    { value: 'closed', label: 'Closed' },
  ];

  return (
    <>
      <Navbar />
      <div className="quick-note-container">
        <div className="quick-note-header">
        <h3>Quick CEO Note</h3>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="quick-toggle-group">
            <button
              className={`view-toggle-btn ${!isDetailedMode ? 'active' : ''}`}
              onClick={() => setIsDetailedMode(false)}
              title="Quick Mode"
            >
              <FaFileAlt /> Quick
            </button>
            <button
              className={`view-toggle-btn ${isDetailedMode ? 'active' : ''}`}
              onClick={() => setIsDetailedMode(true)}
              title="Detailed Mode"
            >
              <FaFileInvoiceDollar /> Detailed
            </button>
          </div>

          <button
            onClick={() => navigate('/ceo-office/dashboard')}
            className="quick-note-back-btn"
          >
            Back
          </button>
        </div>
      </div>


        <form onSubmit={handleSubmit} className="note-form">
          <div className="form-grid-quick-note">
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-control"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group full-width">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="form-control"
                placeholder="Enter note title"
              />
            </div>

            <div className="form-group full-width">
              <label>Details</label>
              <textarea
                name="details"
                value={formData.details}
                onChange={handleChange}
                className="form-control"
                rows="4"
                placeholder="Enter note details"
              />
            </div>

            <div className="form-group">
              <label>Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="form-control"
              >
                {priorities.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-control"
              >
                {statuses.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {isDetailedMode && (
              <>
                <div className="form-group">
                  <label>Related Person</label>
                  <input
                    type="text"
                    name="related_person"
                    value={formData.related_person}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Enter related person"
                  />
                </div>

                <div className="form-group">
                            <label>Department</label>
                            <select
                              name="visitor_department"
                              value={formData.visitor_department}
                              onChange={handleChange}
                              className="form-control"
                            >
                              <option value="">Select Department</option>
                              {departments.map(dept => (
                                <option key={dept} value={dept}>{dept.replace('_', ' ')}</option>
                              ))}
                            </select>
                          </div>



                <div className="form-group">
                  <label>Attachment URL</label>
                  <input
                    type="text"
                    name="attachment"
                    value={formData.attachment}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Enter attachment URL"
                  />
                </div>

                <div className="form-group">
                  <label>Voice Note URL</label>
                  <input
                    type="text"
                    name="voice_note"
                    value={formData.voice_note}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Enter voice note URL"
                  />
                </div>

                <div className="form-group full-width">
                  <label>PA Remarks</label>
                  <textarea
                    name="pa_remarks"
                    value={formData.pa_remarks}
                    onChange={handleChange}
                    className="form-control"
                    rows="3"
                    placeholder="Enter PA remarks"
                  />
                </div>

                <div className="form-group full-width">
                  <label>CEO Remarks</label>
                  <textarea
                    name="ceo_remarks"
                    value={formData.ceo_remarks}
                    onChange={handleChange}
                    className="form-control"
                    rows="3"
                    placeholder="Enter CEO remarks"
                  />
                </div>
              </>
            )}

            {/* Detailed Mode Only Fields */}
            {isDetailedMode && (
              <>
                {/* Follow-up Fields */}
                {formData.category === 'follow_up' && (
                  <div className="form-section full-width">
                    <h4 className="section-title">Follow-up Information</h4>
                    <div className="form-grid-quick-note">
                      <div className="form-group">
                        <label>Requested From (Person/Department)</label>
                        <input
                          type="text"
                          name="follow_up_requested_from"
                          value={formData.follow_up_requested_from}
                          onChange={handleChange}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Requested Date</label>
                        <input
                          type="date"
                          name="follow_up_requested_date"
                          value={formData.follow_up_requested_date}
                          onChange={handleChange}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Last Follow-up Date</label>
                        <input
                          type="date"
                          name="follow_up_last_date"
                          value={formData.follow_up_last_date}
                          onChange={handleChange}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Next Follow-up Date</label>
                        <input
                          type="date"
                          name="follow_up_next_date"
                          value={formData.follow_up_next_date}
                          onChange={handleChange}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group full-width">
                        <label>Current Response</label>
                        <textarea
                          name="follow_up_current_response"
                          value={formData.follow_up_current_response}
                          onChange={handleChange}
                          className="form-control"
                          rows="3"
                        />
                      </div>
                      <div className="form-group full-width">
                        <label>Follow-up Remarks</label>
                        <textarea
                          name="follow_up_remarks"
                          value={formData.follow_up_remarks}
                          onChange={handleChange}
                          className="form-control"
                          rows="3"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Meeting Fields */}
                {formData.category === 'meetings' && (
                  <div className="form-section full-width">
                    <h4 className="section-title">Meeting Information</h4>
                    <div className="form-grid-quick-note">
                      <div className="form-group">
                        <label>Meeting Date & Time</label>
                        <input
                          type="datetime-local"
                          name="meeting_date"
                          value={formData.meeting_date}
                          onChange={handleChange}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Meeting With</label>
                        <input
                          type="text"
                          name="visitor_meeting_with"
                          value={formData.visitor_meeting_with}
                          onChange={handleChange}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group full-width">
                        <label>Subject / Topic</label>
                        <input
                          type="text"
                          name="meeting_subject"
                          value={formData.meeting_subject}
                          onChange={handleChange}
                          className="form-control"
                        />
                      </div>

                      {/* Discussion Points */}
                      <div className="form-group full-width">
                        <div className="array-field-header">
                          <label>Discussion Points</label>
                          <button
                            type="button"
                            onClick={() => addArrayItem('meeting_discussion_points', { content: '' })}
                            className="btn-icon-sm"
                          >
                            <FaPlus />
                          </button>
                        </div>
                        {formData.meeting_discussion_points.map((point, index) => (
                          <div key={point.id} className="array-item">
                            <input
                              type="text"
                              value={point.content}
                              onChange={(e) => handleArrayItemChange('meeting_discussion_points', index, { content: e.target.value })}
                              className="form-control"
                              placeholder="Enter discussion point"
                            />
                            {formData.meeting_discussion_points.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeArrayItem('meeting_discussion_points', index)}
                                className="btn-icon-sm btn-danger"
                              >
                                <FaMinus />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Decisions */}
                      <div className="form-group full-width">
                        <div className="array-field-header">
                          <label>Decisions</label>
                          <button
                            type="button"
                            onClick={() => addArrayItem('meeting_decisions', { content: '' })}
                            className="btn-icon-sm"
                          >
                            <FaPlus />
                          </button>
                        </div>
                        {formData.meeting_decisions.map((decision, index) => (
                          <div key={decision.id} className="array-item">
                            <input
                              type="text"
                              value={decision.content}
                              onChange={(e) => handleArrayItemChange('meeting_decisions', index, { content: e.target.value })}
                              className="form-control"
                              placeholder="Enter decision"
                            />
                            {formData.meeting_decisions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeArrayItem('meeting_decisions', index)}
                                className="btn-icon-sm btn-danger"
                              >
                                <FaMinus />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Action Items */}
                      <div className="form-group full-width">
                        <div className="array-field-header">
                          <label>Action Items</label>
                          <button
                            type="button"
                            onClick={() => addArrayItem('meeting_action_items', { content: '', assigned_to: '', due_date: '', status: 'pending' })}
                            className="btn-icon-sm"
                          >
                            <FaPlus />
                          </button>
                        </div>
                        {formData.meeting_action_items.map((item, index) => (
                          <div key={item.id} className="array-item-grid">
                            <div className="form-group flex-3">
                              <label>Action</label>
                              <input
                                type="text"
                                value={item.content}
                                onChange={(e) => handleArrayItemChange('meeting_action_items', index, { content: e.target.value })}
                                className="form-control"
                                placeholder="Enter action item"
                              />
                            </div>
                            <div className="form-group flex-1">
                              <label>Assigned To</label>
                              <input
                                type="text"
                                value={item.assigned_to}
                                onChange={(e) => handleArrayItemChange('meeting_action_items', index, { assigned_to: e.target.value })}
                                className="form-control"
                                placeholder="Assigned to"
                              />
                            </div>
                            <div className="form-group flex-1">
                              <label>Due Date</label>
                              <input
                                type="date"
                                value={item.due_date}
                                onChange={(e) => handleArrayItemChange('meeting_action_items', index, { due_date: e.target.value })}
                                className="form-control"
                              />
                            </div>
                            <div className="form-group flex-1">
                              <label>Status</label>
                              <select
                                value={item.status}
                                onChange={(e) => handleArrayItemChange('meeting_action_items', index, { status: e.target.value })}
                                className="form-control"
                              >
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                              </select>
                            </div>
                            {formData.meeting_action_items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeArrayItem('meeting_action_items', index)}
                                className="btn-icon-sm btn-danger"
                              >
                                <FaMinus />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Emails & Approvals Fields */}
                {formData.category === 'emails_and_approvals' && (
                  <div className="form-section full-width">
                    <h4 className="section-title">Approval Information</h4>
                    <div className="form-grid-quick-note">
                      <div className="form-group">
                        <label>Approval Type</label>
                        <input
                          type="text"
                          name="approval_type"
                          value={formData.approval_type}
                          onChange={handleChange}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Requested By</label>
                        <input
                          type="text"
                          name="approval_requested_by"
                          value={formData.approval_requested_by}
                          onChange={handleChange}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group full-width">
                        <label>Subject</label>
                        <input
                          type="text"
                          name="approval_subject"
                          value={formData.approval_subject}
                          onChange={handleChange}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Reference Number</label>
                        <input
                          type="text"
                          name="approval_reference_number"
                          value={formData.approval_reference_number}
                          onChange={handleChange}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Approval Amount (Optional)</label>
                        <input
                          type="number"
                          step="0.01"
                          name="approval_amount"
                          value={formData.approval_amount}
                          onChange={handleChange}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Decision</label>
                        <select
                          name="approval_decision"
                          value={formData.approval_decision}
                          onChange={handleChange}
                          className="form-control"
                        >
                          {approvalDecisions.map(d => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group full-width">
                        <label>Decision Remarks</label>
                        <textarea
                          name="approval_decision_remarks"
                          value={formData.approval_decision_remarks}
                          onChange={handleChange}
                          className="form-control"
                          rows="3"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Waiting Response Fields */}
                {formData.category === 'waiting_response' && (
                  <div className="form-section full-width">
                    <h4 className="section-title">Response Tracking</h4>
                    <div className="form-grid-quick-note">
                      <div className="form-group">
                        <label>Requested From</label>
                        <input
                          type="text"
                          name="waiting_response_requested_from"
                          value={formData.waiting_response_requested_from}
                          onChange={handleChange}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Request Date</label>
                        <input
                          type="date"
                          name="waiting_response_request_date"
                          value={formData.waiting_response_request_date}
                          onChange={handleChange}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Expected Response Date</label>
                        <input
                          type="date"
                          name="waiting_response_expected_date"
                          value={formData.waiting_response_expected_date}
                          onChange={handleChange}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Last Reminder Date</label>
                        <input
                          type="date"
                          name="waiting_response_last_reminder_date"
                          value={formData.waiting_response_last_reminder_date}
                          onChange={handleChange}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Current Response Status</label>
                        <select
                          name="waiting_response_status"
                          value={formData.waiting_response_status}
                          onChange={handleChange}
                          className="form-control"
                        >
                          {waitingResponseStatuses.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group full-width">
                        <label>Response Remarks</label>
                        <textarea
                          name="waiting_response_remarks"
                          value={formData.waiting_response_remarks}
                          onChange={handleChange}
                          className="form-control"
                          rows="3"
                        />
                      </div>

                      {/* Waiting Response Reminders */}
                      <div className="form-group full-width">
                        <div className="array-field-header">
                          <label>Reminders</label>
                          <button
                            type="button"
                            onClick={() => addArrayItem('waiting_response_reminders', { date: '', notes: '' })}
                            className="btn-icon-sm"
                          >
                            <FaPlus />
                          </button>
                        </div>
                        {formData.waiting_response_reminders.map((reminder, index) => (
                          <div key={reminder.id} className="array-item-grid">
                            <div className="form-group flex-2">
                              <label>Date</label>
                              <input
                                type="date"
                                value={reminder.date}
                                onChange={(e) => handleArrayItemChange('waiting_response_reminders', index, { date: e.target.value })}
                                className="form-control"
                              />
                            </div>
                            <div className="form-group flex-3">
                              <label>Notes</label>
                              <input
                                type="text"
                                value={reminder.notes}
                                onChange={(e) => handleArrayItemChange('waiting_response_reminders', index, { notes: e.target.value })}
                                className="form-control"
                                placeholder="Reminder notes"
                              />
                            </div>
                            {formData.waiting_response_reminders.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeArrayItem('waiting_response_reminders', index)}
                                className="btn-icon-sm btn-danger"
                              >
                                <FaMinus />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Visitors/Calls/WhatsApp Fields */}
                {(formData.category === 'visitors' || formData.category === 'calls' || formData.category === 'whatsapp') && (
                  <div className="form-section full-width">
                    <h4 className="section-title">
                      {formData.category === 'visitors' ? 'Visitor Information' :
                        formData.category === 'calls' ? 'Call Information' : 'WhatsApp Information'}
                    </h4>
                    <div className="form-grid-quick-note">
                      {/* Type selector (for consistency, though category determines this) */}
                      <div className="form-group">
                        <label>Type</label>
                        <select
                          name="type"
                          value={formData.type}
                          onChange={handleChange}
                          className="form-control"
                        >
                          <option value="visitor">Visitor</option>
                          <option value="call">Call</option>
                          <option value="whatsapp">WhatsApp</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Date & Time *</label>
                        <input
                          type="datetime-local"
                          name="visit_datetime"
                          value={formData.visit_datetime}
                          onChange={handleChange}
                          required={isDetailedMode}
                          className="form-control"
                        />
                      </div>

                      {/* Type-specific fields */}
                      {formData.type === 'visitor' && (
                        <>
                          <div className="form-group">
                            <label>Visitor Name *</label>
                            <input
                              type="text"
                              name="visitor_name"
                              value={formData.visitor_name}
                              onChange={handleChange}
                              required={isDetailedMode}
                              className="form-control"
                            />
                          </div>
                          <div className="form-group">
                            <label>Organization</label>
                            <input
                              type="text"
                              name="organization"
                              value={formData.organization}
                              onChange={handleChange}
                              className="form-control"
                            />
                          </div>
                          <div className="form-group full-width">
                            <label>Purpose *</label>
                            <textarea
                              name="purpose"
                              value={formData.purpose}
                              onChange={handleChange}
                              rows="2"
                              required={isDetailedMode}
                              className="form-control"
                            />
                          </div>
                          <div className="form-group">
                            <label>Meeting With</label>
                            <input
                              type="text"
                              name="visitor_meeting_with"
                              value={formData.visitor_meeting_with}
                              onChange={handleChange}
                              className="form-control"
                            />
                          </div>
                          <div className="form-group">
                            <label>Department</label>
                            <select
                              name="visitor_department"
                              value={formData.visitor_department}
                              onChange={handleChange}
                              className="form-control"
                            >
                              <option value="">Select Department</option>
                              {departments.map(dept => (
                                <option key={dept} value={dept}>{dept.replace('_', ' ')}</option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Protocol Required</label>
                            <select
                              name="protocol_required"
                              value={formData.protocol_required}
                              onChange={handleChange}
                              className="form-control"
                            >
                              <option value="">Select</option>
                              <option value="Normal">Normal</option>
                              <option value="VIP">VIP</option>
                              <option value="CEO Meeting">CEO Meeting</option>
                              <option value="Confidential">Confidential</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Expected Duration</label>
                            <input
                              type="text"
                              name="expected_duration"
                              value={formData.expected_duration}
                              onChange={handleChange}
                              placeholder="e.g. 30 mins"
                              className="form-control"
                            />
                          </div>
                          <div className="form-group">
                            <label>Visitor Outcome</label>
                            <select
                              name="visitor_outcome"
                              value={formData.visitor_outcome}
                              onChange={handleChange}
                              className="form-control"
                            >
                              <option value="">Select</option>
                              <option value="Meeting Completed">Meeting Completed</option>
                              <option value="Waiting">Waiting</option>
                              <option value="Rescheduled">Rescheduled</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                        </>
                      )}

                      {formData.type === 'call' && (
                        <>
                          <div className="form-group">
                            <label>Caller Name *</label>
                            <input
                              type="text"
                              name="caller_name"
                              value={formData.caller_name}
                              onChange={handleChange}
                              required={isDetailedMode}
                              className="form-control"
                            />
                          </div>
                          <div className="form-group">
                            <label>Organization</label>
                            <input
                              type="text"
                              name="organization"
                              value={formData.organization}
                              onChange={handleChange}
                              className="form-control"
                            />
                          </div>
                          <div className="form-group">
                            <label>Phone Number *</label>
                            <input
                              type="text"
                              name="phone_number"
                              value={formData.phone_number}
                              onChange={handleChange}
                              required={isDetailedMode}
                              className="form-control"
                            />
                          </div>
                          <div className="form-group full-width">
                            <label>Call Purpose</label>
                            <textarea
                              name="call_purpose"
                              value={formData.call_purpose}
                              onChange={handleChange}
                              rows="2"
                              className="form-control"
                            />
                          </div>
                          <div className="form-group full-width">
                            <label>Call Summary</label>
                            <textarea
                              name="call_summary"
                              value={formData.call_summary}
                              onChange={handleChange}
                              rows="2"
                              className="form-control"
                            />
                          </div>
                          <div className="form-group">
                            <label>Follow-up Required</label>
                            <select
                              name="follow_up_required"
                              value={formData.follow_up_required}
                              onChange={handleChange}
                              className="form-control"
                            >
                              <option value="No">No</option>
                              <option value="Yes">Yes</option>
                            </select>
                          </div>
                          {formData.follow_up_required === 'Yes' && (
                            <>
                              <div className="form-group">
                                <label>Follow-up Date</label>
                                <input
                                  type="datetime-local"
                                  name="follow_up_date"
                                  value={formData.follow_up_date}
                                  onChange={handleChange}
                                  className="form-control"
                                />
                              </div>
                              <div className="form-group">
                                <label>Assigned To</label>
                                <input
                                  type="text"
                                  name="assigned_to"
                                  value={formData.assigned_to}
                                  onChange={handleChange}
                                  className="form-control"
                                />
                              </div>
                            </>
                          )}
                        </>
                      )}

                      {formData.type === 'whatsapp' && (
                        <>
                          <div className="form-group">
                            <label>Contact Name *</label>
                            <input
                              type="text"
                              name="contact_name"
                              value={formData.contact_name}
                              onChange={handleChange}
                              required={isDetailedMode}
                              className="form-control"
                            />
                          </div>
                          <div className="form-group">
                            <label>Phone Number *</label>
                            <input
                              type="text"
                              name="phone_number"
                              value={formData.phone_number}
                              onChange={handleChange}
                              required={isDetailedMode}
                              className="form-control"
                            />
                          </div>
                          <div className="form-group full-width">
                            <label>Message Summary</label>
                            <textarea
                              name="message_summary"
                              value={formData.message_summary}
                              onChange={handleChange}
                              rows="2"
                              className="form-control"
                            />
                          </div>
                          <div className="form-group full-width">
                            <label>Required Action</label>
                            <textarea
                              name="required_action"
                              value={formData.required_action}
                              onChange={handleChange}
                              rows="2"
                              className="form-control"
                            />
                          </div>
                          <div className="form-group">
                            <label>Attachment URL</label>
                            <input
                              type="text"
                              name="attachment_url"
                              value={formData.attachment_url}
                              onChange={handleChange}
                              className="form-control"
                            />
                          </div>
                          <div className="form-group">
                            <label>Response Status</label>
                            <select
                              name="response_status"
                              value={formData.response_status}
                              onChange={handleChange}
                              className="form-control"
                            >
                              <option value="">Select</option>
                              <option value="Pending Reply">Pending Reply</option>
                              <option value="Replied">Replied</option>
                              <option value="Waiting Response">Waiting Response</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </div>
                        </>
                      )}

                      {/* Common fields for all three types */}
                      {/* <div className="form-group">
                        <label>Related Note ID</label>
                        <input
                          type="number"
                          name="relatedNoteId"
                          value={formData.relatedNoteId || ''}
                          onChange={handleChange}
                          className="form-control"
                        />
                      </div> */}
                      <div className="form-group full-width">
                        <label>Remarks</label>
                        <textarea
                          name="remarks"
                          value={formData.remarks}
                          onChange={handleChange}
                          rows="2"
                          className="form-control"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Project Notes (Project Command Sheet) Fields */}
                {formData.category === 'project_command_sheets' && (
                  <div className="form-section full-width">
                    <h4 className="section-title">Project Command Sheet</h4>
                    <div className="form-grid-quick-note">
                      <div className="form-group full-width">
                        <label>Project Name *</label>
                        <input
                          type="text"
                          name="project_name"
                          value={formData.project_name}
                          onChange={handleChange}
                          required={isDetailedMode}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group full-width">
                        <label>Project Details</label>
                        <textarea
                          name="project_details"
                          value={formData.project_details}
                          onChange={handleChange}
                          rows="3"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group full-width">
                        <label>Discussions</label>
                        <textarea
                          name="discussions"
                          value={formData.discussions}
                          onChange={handleChange}
                          rows="3"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group full-width">
                        <label>Decisions</label>
                        <textarea
                          name="decisions"
                          value={formData.decisions}
                          onChange={handleChange}
                          rows="3"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group full-width">
                        <label>Meeting Notes</label>
                        <textarea
                          name="meeting_notes"
                          value={formData.meeting_notes}
                          onChange={handleChange}
                          rows="3"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Start Date</label>
                        <input
                          type="date"
                          name="start_date"
                          value={formData.start_date}
                          onChange={handleChange}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>End Date</label>
                        <input
                          type="date"
                          name="end_date"
                          value={formData.end_date}
                          onChange={handleChange}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Status</label>
                        <select
                          name="pcs_status"
                          value={formData.pcs_status}
                          onChange={handleChange}
                          className="form-control"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="On Hold">On Hold</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                      <div className="form-group full-width">
                        <label>Next Steps</label>
                        <textarea
                          name="next_steps"
                          value={formData.next_steps}
                          onChange={handleChange}
                          rows="3"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group full-width">
                        <label>Results</label>
                        <textarea
                          name="results"
                          value={formData.results}
                          onChange={handleChange}
                          rows="3"
                          className="form-control"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate('/ceo-office/dashboard')} className="quick-note-cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="quick-note-create-btn">
              {loading ? 'Creating...' : 'Create Note'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default QuickNote;
