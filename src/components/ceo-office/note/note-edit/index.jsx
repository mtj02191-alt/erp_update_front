
import React, { useState } from 'react';
import { FaPlus, FaMinus } from 'react-icons/fa';
import axios from '../../../../utils/axios';
import { toast } from 'react-toastify';
import './index.css';

const NoteEdit = ({ note, onSave, onCancel }) => {
  // Initialize form data
  const [formData, setFormData] = useState({
    date: note.date ? note.date.split('T')[0] : '',
    category: note.category || '',
    title: note.title || '',
    details: note.details || '',
    related_person: note.related_person || '',
    department: note.department || '',
    priority: note.priority || '',
    due_date: note.due_date ? note.due_date.split('T')[0] : '',
    status: note.status || '',
    attachment: note.attachment || '',
    voice_note: note.voice_note || '',
    pa_remarks: note.pa_remarks || '',
    ceo_remarks: note.ceo_remarks || '',
    // Follow-up fields
    follow_up_requested_from: note.follow_up_requested_from || '',
    follow_up_requested_date: note.follow_up_requested_date ? note.follow_up_requested_date.split('T')[0] : '',
    follow_up_last_date: note.follow_up_last_date ? note.follow_up_last_date.split('T')[0] : '',
    follow_up_next_date: note.follow_up_next_date ? note.follow_up_next_date.split('T')[0] : '',
    follow_up_current_response: note.follow_up_current_response || '',
    follow_up_remarks: note.follow_up_remarks || '',
    follow_up_history: note.follow_up_history || [],
    // Meeting fields
    meeting_date: note.meeting_date ? note.meeting_date.slice(0,16) : '',
    meeting_with: note.meeting_with || '',
    meeting_subject: note.meeting_subject || '',
    meeting_discussion_points: note.meeting_discussion_points || [{ id: Date.now().toString(), content: '' }],
    meeting_decisions: note.meeting_decisions || [{ id: Date.now().toString(), content: '' }],
    meeting_action_items: note.meeting_action_items || [{ id: Date.now().toString(), content: '', assigned_to: '', due_date: '', status: 'pending' }],
    // Emails & Approvals fields
    approval_type: note.approval_type || '',
    approval_requested_by: note.approval_requested_by || '',
    approval_subject: note.approval_subject || '',
    approval_reference_number: note.approval_reference_number || '',
    approval_amount: note.approval_amount || '',
    approval_decision: note.approval_decision || 'pending',
    approval_decision_remarks: note.approval_decision_remarks || '',
    // Waiting Response fields
    waiting_response_requested_from: note.waiting_response_requested_from || '',
    waiting_response_request_date: note.waiting_response_request_date ? note.waiting_response_request_date.split('T')[0] : '',
    waiting_response_expected_date: note.waiting_response_expected_date ? note.waiting_response_expected_date.split('T')[0] : '',
    waiting_response_last_reminder_date: note.waiting_response_last_reminder_date ? note.waiting_response_last_reminder_date.split('T')[0] : '',
    waiting_response_status: note.waiting_response_status || 'waiting_response',
    waiting_response_remarks: note.waiting_response_remarks || '',
    waiting_response_reminders: note.waiting_response_reminders || [{ id: Date.now().toString(), date: '', notes: '' }],
    // Visitors/Calls/WhatsApp fields
    type: note.type || 'visitor',
    visit_datetime: note.visit_datetime ? note.visit_datetime.slice(0, 16) : '',
    visitor_name: note.visitor_name || '',
    organization: note.organization || '',
    purpose: note.purpose || '',
    visitor_meeting_with: note.visitor_meeting_with || '',
    visitor_department: note.visitor_department || '',
    protocol_required: note.protocol_required || '',
    expected_duration: note.expected_duration || '',
    visitor_outcome: note.visitor_outcome || '',
    caller_name: note.caller_name || '',
    phone_number: note.phone_number || '',
    call_purpose: note.call_purpose || '',
    call_summary: note.call_summary || '',
    follow_up_required: note.follow_up_required || 'No',
    follow_up_date: note.follow_up_date ? note.follow_up_date.slice(0, 16) : '',
    assigned_to: note.assigned_to || '',
    contact_name: note.contact_name || '',
    message_summary: note.message_summary || '',
    required_action: note.required_action || '',
    attachment_url: note.attachment_url || '',
    response_status: note.response_status || '',
    remarks: note.remarks || '',
    // Project Command Sheet fields
    project_name: note.project_name || '',
    project_details: note.project_details || '',
    discussions: note.discussions || '',
    decisions: note.decisions || '',
    meeting_notes: note.meeting_notes || '',
    pending_items: note.pending_items || [],
    action_items: note.action_items || [],
    start_date: note.start_date ? note.start_date.split('T')[0] : '',
    end_date: note.end_date ? note.end_date.split('T')[0] : '',
    pcs_status: note.pcs_status || 'Pending',
    next_steps: note.next_steps || '',
    results: note.results || ''
  });

  const handleInputChange = (e) => {
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

  const handleSubmit = async () => {
    try {
      let cleanedData = { ...formData };
      cleanedData = cleanEmptyStrings(cleanedData);
      if (cleanedData.meeting_discussion_points) {
        cleanedData.meeting_discussion_points = cleanedData.meeting_discussion_points.filter(p => p.content.trim());
      }
      if (cleanedData.meeting_decisions) {
        cleanedData.meeting_decisions = cleanedData.meeting_decisions.filter(d => d.content.trim());
      }
      if (cleanedData.meeting_action_items) {
        cleanedData.meeting_action_items = cleanedData.meeting_action_items.filter(a => a.content.trim());
      }

      const response = await axios.patch(`/ceo-notes/${note.id}`, cleanedData);
      toast.success('Note updated successfully');
      onSave(response.data);
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note');
    }
  };

  return (
    <div className="note-edit-container">
      <div className="note-edit-meta-section">
        <div className="note-edit-form-group">
          <label>Date</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className="note-edit-form-control"
          />
        </div>
        <div className="note-edit-form-group">
          <label>Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="note-edit-form-control"
          >
            <option value="top_priority">Top Priority</option>
            <option value="today_task">Today Task</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="calls">Calls</option>
            <option value="visitors">Visitors</option>
            <option value="follow_up">Follow Up</option>
            <option value="meetings">Meetings</option>
            <option value="ceo_direct_orders">CEO Direct Orders</option>
            <option value="important_decisions">Important Decisions</option>
            <option value="emails_and_approvals">Emails & Approvals</option>
            <option value="waiting_response">Waiting Response</option>
            <option value="project_command_sheets">Project Command Sheets</option>
            <option value="project_notes">Project Notes</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="note-edit-form-group">
          <label>Priority</label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            className="note-edit-form-control"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div className="note-edit-form-group">
          <label>Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="note-edit-form-control"
          >
            <option value="unprocessed">Unprocessed</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_response">Waiting Response</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="note-edit-form-group">
        <label>Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          className="note-edit-form-control"
        />
      </div>

      <div className="note-edit-form-group">
        <label>Details</label>
        <textarea
          name="details"
          value={formData.details}
          onChange={handleInputChange}
          rows={6}
          className="note-edit-form-control"
        />
      </div>

      <div className="note-edit-two-column-grid">
        <div className="note-edit-form-group">
          <label>Related Person</label>
          <input
            type="text"
            name="related_person"
            value={formData.related_person}
            onChange={handleInputChange}
            className="note-edit-form-control"
          />
        </div>
        <div className="note-edit-form-group">
          <label>Department</label>
          <select
            name="department"
            value={formData.department}
            onChange={handleInputChange}
            className="note-edit-form-control"
          >
            <option value="">Select Department</option>
            <option value="admin">Admin</option>
            <option value="program">Program</option>
            <option value="store">Store</option>
            <option value="procurements">Procurements</option>
            <option value="accounts_and_finance">Accounts & Finance</option>
            <option value="fund_raising">Fund Raising</option>
            <option value="hr">HR</option>
            <option value="it">IT</option>
            <option value="marketing">Marketing</option>
            <option value="audio_video">Audio Video</option>
            <option value="meal">Meal</option>
            <option value="health">Health</option>
            <option value="executive_office">Executive Office</option>
            <option value="ceo">CEO</option>
            <option value="internal_audit">Internal Audit</option>
            <option value="crd">CRD</option>
            <option value="aas_lab">AAS Lab</option>
          </select>
        </div>
        <div className="note-edit-form-group">
          <label>Due Date</label>
          <input
            type="date"
            name="due_date"
            value={formData.due_date}
            onChange={handleInputChange}
            className="note-edit-form-control"
          />
        </div>

        

      </div>

      {/* Follow-up Section */}
      {formData.category === 'follow_up' && (
        <div className="note-edit-section">
          <h4 className="note-edit-section-title">Follow-up Information</h4>
          <div className="note-edit-two-column-grid">
            <div className="note-edit-form-group">
              <label>Requested From</label>
              <input
                type="text"
                name="follow_up_requested_from"
                value={formData.follow_up_requested_from}
                onChange={handleInputChange}
                className="note-edit-form-control"
              />
            </div>
            <div className="note-edit-form-group">
              <label>Requested Date</label>
              <input
                type="date"
                name="follow_up_requested_date"
                value={formData.follow_up_requested_date}
                onChange={handleInputChange}
                className="note-edit-form-control"
              />
            </div>
            <div className="note-edit-form-group">
              <label>Last Follow-up Date</label>
              <input
                type="date"
                name="follow_up_last_date"
                value={formData.follow_up_last_date}
                onChange={handleInputChange}
                className="note-edit-form-control"
              />
            </div>
            <div className="note-edit-form-group">
              <label>Next Follow-up Date</label>
              <input
                type="date"
                name="follow_up_next_date"
                value={formData.follow_up_next_date}
                onChange={handleInputChange}
                className="note-edit-form-control"
              />
            </div>
            <div className="note-edit-form-group note-edit-full-width">
              <label>Current Response</label>
              <textarea
                name="follow_up_current_response"
                value={formData.follow_up_current_response}
                onChange={handleInputChange}
                rows={3}
                className="note-edit-form-control"
              />
            </div>
            <div className="note-edit-form-group note-edit-full-width">
              <label>Remarks</label>
              <textarea
                name="follow_up_remarks"
                value={formData.follow_up_remarks}
                onChange={handleInputChange}
                rows={3}
                className="note-edit-form-control"
              />
            </div>
          </div>
        </div>
      )}

      {/* Meeting Section */}
      {formData.category === 'meetings' && (
        <div className="note-edit-section">
          <h4 className="note-edit-section-title">Meeting Information</h4>
          <div className="note-edit-two-column-grid">
            <div className="note-edit-form-group">
              <label>Meeting Date & Time</label>
              <input
                type="datetime-local"
                name="meeting_date"
                value={formData.meeting_date}
                onChange={handleInputChange}
                className="note-edit-form-control"
              />
            </div>
            <div className="note-edit-form-group">
              <label>Meeting With</label>
              <input
                type="text"
                name="visitor_meeting_with"
                value={formData.visitor_meeting_with}
                onChange={handleInputChange}
                className="note-edit-form-control"
              />
            </div>
          </div>
          <div className="note-edit-form-group note-edit-full-width">
            <label>Subject / Topic</label>
            <input
              type="text"
              name="meeting_subject"
              value={formData.meeting_subject}
              onChange={handleInputChange}
              className="note-edit-form-control"
            />
          </div>

          {/* Discussion Points */}
          <div className="note-edit-form-group note-edit-full-width">
            <div className="note-edit-array-header">
              <label>Discussion Points</label>
              <button
                type="button"
                onClick={() => addArrayItem('meeting_discussion_points', { content: '' })}
                className="note-edit-btn-sm note-edit-btn-primary"
              >
                <FaPlus size={12} /> Add
              </button>
            </div>
            {(formData.meeting_discussion_points || []).map((point, index) => (
              <div key={point.id} className="note-edit-array-item">
                <input
                  type="text"
                  value={point.content}
                  onChange={(e) => handleArrayItemChange('meeting_discussion_points', index, { content: e.target.value })}
                  className="note-edit-form-control"
                  placeholder="Enter discussion point"
                />
                {formData.meeting_discussion_points.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('meeting_discussion_points', index)}
                    className="note-edit-btn-sm note-edit-btn-danger"
                  >
                    <FaMinus size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Decisions */}
          <div className="note-edit-form-group note-edit-full-width">
            <div className="note-edit-array-header">
              <label>Decisions</label>
              <button
                type="button"
                onClick={() => addArrayItem('meeting_decisions', { content: '' })}
                className="note-edit-btn-sm note-edit-btn-primary"
              >
                <FaPlus size={12} /> Add
              </button>
            </div>
            {(formData.meeting_decisions || []).map((decision, index) => (
              <div key={decision.id} className="note-edit-array-item">
                <input
                  type="text"
                  value={decision.content}
                  onChange={(e) => handleArrayItemChange('meeting_decisions', index, { content: e.target.value })}
                  className="note-edit-form-control"
                  placeholder="Enter decision"
                />
                {formData.meeting_decisions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('meeting_decisions', index)}
                    className="note-edit-btn-sm note-edit-btn-danger"
                  >
                    <FaMinus size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Action Items */}
          <div className="note-edit-form-group note-edit-full-width">
            <div className="note-edit-array-header">
              <label>Action Items</label>
              <button
                type="button"
                onClick={() => addArrayItem('meeting_action_items', { content: '', assigned_to: '', due_date: '', status: 'pending' })}
                className="note-edit-btn-sm note-edit-btn-primary"
              >
                <FaPlus size={12} /> Add
              </button>
            </div>
            {(formData.meeting_action_items || []).map((item, index) => (
              <div key={item.id} className="note-edit-action-item">
                <div className="note-edit-form-group flex-3">
                  <label>Action</label>
                  <input
                    type="text"
                    value={item.content}
                    onChange={(e) => handleArrayItemChange('meeting_action_items', index, { content: e.target.value })}
                    className="note-edit-form-control"
                    placeholder="Enter action item"
                  />
                </div>
                <div className="note-edit-form-group flex-1">
                  <label>Assigned To</label>
                  <input
                    type="text"
                    value={item.assigned_to}
                    onChange={(e) => handleArrayItemChange('meeting_action_items', index, { assigned_to: e.target.value })}
                    className="note-edit-form-control"
                  />
                </div>
                <div className="note-edit-form-group flex-1">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={item.due_date}
                    onChange={(e) => handleArrayItemChange('meeting_action_items', index, { due_date: e.target.value })}
                    className="note-edit-form-control"
                  />
                </div>
                <div className="note-edit-form-group flex-1">
                  <label>Status</label>
                  <select
                    value={item.status}
                    onChange={(e) => handleArrayItemChange('meeting_action_items', index, { status: e.target.value })}
                    className="note-edit-form-control"
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
                    className="note-edit-btn-sm note-edit-btn-danger"
                  >
                    <FaMinus size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emails & Approvals Section */}
      {formData.category === 'emails_and_approvals' && (
        <div className="note-edit-section">
          <h4 className="note-edit-section-title">Approval Information</h4>
          <div className="note-edit-two-column-grid">
            <div className="note-edit-form-group">
              <label>Approval Type</label>
              <input
                type="text"
                name="approval_type"
                value={formData.approval_type}
                onChange={handleInputChange}
                className="note-edit-form-control"
              />
            </div>
            <div className="note-edit-form-group">
              <label>Requested By</label>
              <input
                type="text"
                name="approval_requested_by"
                value={formData.approval_requested_by}
                onChange={handleInputChange}
                className="note-edit-form-control"
              />
            </div>
            <div className="note-edit-form-group">
              <label>Subject</label>
              <input
                type="text"
                name="approval_subject"
                value={formData.approval_subject}
                onChange={handleInputChange}
                className="note-edit-form-control"
              />
            </div>
            <div className="note-edit-form-group">
              <label>Reference Number</label>
              <input
                type="text"
                name="approval_reference_number"
                value={formData.approval_reference_number}
                onChange={handleInputChange}
                className="note-edit-form-control"
              />
            </div>
            <div className="note-edit-form-group">
              <label>Approval Amount</label>
              <input
                type="number"
                step="0.01"
                name="approval_amount"
                value={formData.approval_amount}
                onChange={handleInputChange}
                className="note-edit-form-control"
              />
            </div>
            <div className="note-edit-form-group">
              <label>Decision</label>
              <select
                name="approval_decision"
                value={formData.approval_decision}
                onChange={handleInputChange}
                className="note-edit-form-control"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="request_clarification">Request Clarification</option>
              </select>
            </div>
            <div className="note-edit-form-group note-edit-full-width">
              <label>Decision Remarks</label>
              <textarea
                name="approval_decision_remarks"
                value={formData.approval_decision_remarks}
                onChange={handleInputChange}
                rows={3}
                className="note-edit-form-control"
              />
            </div>
          </div>
        </div>
      )}

      {/* Waiting Response Section */}
      {formData.category === 'waiting_response' && (
        <div className="note-edit-section">
          <h4 className="note-edit-section-title">Response Tracking</h4>
          <div className="note-edit-two-column-grid">
            <div className="note-edit-form-group">
              <label>Requested From</label>
              <input
                type="text"
                name="waiting_response_requested_from"
                value={formData.waiting_response_requested_from}
                onChange={handleInputChange}
                className="note-edit-form-control"
              />
            </div>
            <div className="note-edit-form-group">
              <label>Request Date</label>
              <input
                type="date"
                name="waiting_response_request_date"
                value={formData.waiting_response_request_date}
                onChange={handleInputChange}
                className="note-edit-form-control"
              />
            </div>
            <div className="note-edit-form-group">
              <label>Expected Response Date</label>
              <input
                type="date"
                name="waiting_response_expected_date"
                value={formData.waiting_response_expected_date}
                onChange={handleInputChange}
                className="note-edit-form-control"
              />
            </div>
            <div className="note-edit-form-group">
              <label>Last Reminder Date</label>
              <input
                type="date"
                name="waiting_response_last_reminder_date"
                value={formData.waiting_response_last_reminder_date}
                onChange={handleInputChange}
                className="note-edit-form-control"
              />
            </div>
            <div className="note-edit-form-group">
              <label>Response Status</label>
              <select
                name="waiting_response_status"
                value={formData.waiting_response_status}
                onChange={handleInputChange}
                className="note-edit-form-control"
              >
                <option value="waiting_response">Waiting Response</option>
                <option value="reminder_sent">Reminder Sent</option>
                <option value="received">Received</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="note-edit-form-group note-edit-full-width">
              <label>Remarks</label>
              <textarea
                name="waiting_response_remarks"
                value={formData.waiting_response_remarks}
                onChange={handleInputChange}
                rows={3}
                className="note-edit-form-control"
              />
            </div>

            {/* Waiting Response Reminders */}
            <div className="note-edit-form-group note-edit-full-width">
              <div className="note-edit-array-header">
                <label>Reminders</label>
                <button
                  type="button"
                  onClick={() => addArrayItem('waiting_response_reminders', { date: '', notes: '' })}
                  className="note-edit-btn-sm note-edit-btn-primary"
                >
                  <FaPlus size={12} /> Add
                </button>
              </div>
              {(formData.waiting_response_reminders || []).map((reminder, index) => (
                <div key={reminder.id} className="note-edit-action-item">
                  <div className="note-edit-form-group flex-1">
                    <label>Date</label>
                    <input
                      type="date"
                      value={reminder.date}
                      onChange={(e) => handleArrayItemChange('waiting_response_reminders', index, { date: e.target.value })}
                      className="note-edit-form-control"
                    />
                  </div>
                  <div className="note-edit-form-group flex-3">
                    <label>Notes</label>
                    <input
                      type="text"
                      value={reminder.notes}
                      onChange={(e) => handleArrayItemChange('waiting_response_reminders', index, { notes: e.target.value })}
                      className="note-edit-form-control"
                      placeholder="Reminder notes"
                    />
                  </div>
                  {formData.waiting_response_reminders.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('waiting_response_reminders', index)}
                      className="note-edit-btn-sm note-edit-btn-danger"
                    >
                      <FaMinus size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Visitors/Calls/WhatsApp Section */}
      {(formData.category === 'visitors' || formData.category === 'calls' || formData.category === 'whatsapp') && (
        <div className="note-edit-section">
          <h4 className="note-edit-section-title">
            {formData.category === 'visitors' ? 'Visitor Information' :
              formData.category === 'calls' ? 'Call Information' : 'WhatsApp Information'}
          </h4>
          <div className="note-edit-two-column-grid">
            {/* Type selector */}
            <div className="note-edit-form-group">
              <label>Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="note-edit-form-control"
              >
                <option value="visitor">Visitor</option>
                <option value="call">Call</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div className="note-edit-form-group">
              <label>Date & Time</label>
              <input
                type="datetime-local"
                name="visit_datetime"
                value={formData.visit_datetime}
                onChange={handleInputChange}
                className="note-edit-form-control"
              />
            </div>

            {/* Type-specific fields */}
            {formData.type === 'visitor' && (
              <>
                <div className="note-edit-form-group">
                  <label>Visitor Name</label>
                  <input
                    type="text"
                    name="visitor_name"
                    value={formData.visitor_name}
                    onChange={handleInputChange}
                    className="note-edit-form-control"
                  />
                </div>
                <div className="note-edit-form-group">
                  <label>Organization</label>
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleInputChange}
                    className="note-edit-form-control"
                  />
                </div>
                <div className="note-edit-form-group note-edit-full-width">
                  <label>Purpose</label>
                  <textarea
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    rows={2}
                    className="note-edit-form-control"
                  />
                </div>
                <div className="note-edit-form-group">
                  <label>Meeting With</label>
                  <input
                    type="text"
                    name="visitor_meeting_with"
                    value={formData.visitor_meeting_with}
                    onChange={handleInputChange}
                    className="note-edit-form-control"
                  />
                </div>
                <div className="note-edit-form-group">
                  <label>Department</label>
                  <select
                    name="visitor_department"
                    value={formData.visitor_department}
                    onChange={handleInputChange}
                    className="note-edit-form-control"
                  >
                    <option value="">Select Department</option>
                    <option value="admin">Admin</option>
                    <option value="program">Program</option>
                    <option value="store">Store</option>
                    <option value="procurements">Procurements</option>
                    <option value="accounts_and_finance">Accounts & Finance</option>
                    <option value="fund_raising">Fund Raising</option>
                    <option value="hr">HR</option>
                    <option value="it">IT</option>
                    <option value="marketing">Marketing</option>
                    <option value="audio_video">Audio Video</option>
                    <option value="meal">Meal</option>
                    <option value="health">Health</option>
                    <option value="executive_office">Executive Office</option>
                    <option value="ceo">CEO</option>
                    <option value="internal_audit">Internal Audit</option>
                    <option value="crd">CRD</option>
                    <option value="aas_lab">AAS Lab</option>
                  </select>
                </div>
                <div className="note-edit-form-group">
                  <label>Protocol Required</label>
                  <select
                    name="protocol_required"
                    value={formData.protocol_required}
                    onChange={handleInputChange}
                    className="note-edit-form-control"
                  >
                    <option value="">Select</option>
                    <option value="Normal">Normal</option>
                    <option value="VIP">VIP</option>
                    <option value="CEO Meeting">CEO Meeting</option>
                    <option value="Confidential">Confidential</option>
                  </select>
                </div>
                <div className="note-edit-form-group">
                  <label>Expected Duration</label>
                  <input
                    type="text"
                    name="expected_duration"
                    value={formData.expected_duration}
                    onChange={handleInputChange}
                    placeholder="e.g. 30 mins"
                    className="note-edit-form-control"
                  />
                </div>
                <div className="note-edit-form-group">
                  <label>Visitor Outcome</label>
                  <select
                    name="visitor_outcome"
                    value={formData.visitor_outcome}
                    onChange={handleInputChange}
                    className="note-edit-form-control"
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
                <div className="note-edit-form-group">
                  <label>Caller Name</label>
                  <input
                    type="text"
                    name="caller_name"
                    value={formData.caller_name}
                    onChange={handleInputChange}
                    className="note-edit-form-control"
                  />
                </div>
                <div className="note-edit-form-group">
                  <label>Organization</label>
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleInputChange}
                    className="note-edit-form-control"
                  />
                </div>
                <div className="note-edit-form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    className="note-edit-form-control"
                  />
                </div>
                <div className="note-edit-form-group note-edit-full-width">
                  <label>Call Purpose</label>
                  <textarea
                    name="call_purpose"
                    value={formData.call_purpose}
                    onChange={handleInputChange}
                    rows={2}
                    className="note-edit-form-control"
                  />
                </div>
                <div className="note-edit-form-group note-edit-full-width">
                  <label>Call Summary</label>
                  <textarea
                    name="call_summary"
                    value={formData.call_summary}
                    onChange={handleInputChange}
                    rows={2}
                    className="note-edit-form-control"
                  />
                </div>
                <div className="note-edit-form-group">
                  <label>Follow-up Required</label>
                  <select
                    name="follow_up_required"
                    value={formData.follow_up_required}
                    onChange={handleInputChange}
                    className="note-edit-form-control"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                {formData.follow_up_required === 'Yes' && (
                  <>
                    <div className="note-edit-form-group">
                      <label>Follow-up Date</label>
                      <input
                        type="datetime-local"
                        name="follow_up_date"
                        value={formData.follow_up_date}
                        onChange={handleInputChange}
                        className="note-edit-form-control"
                      />
                    </div>
                    <div className="note-edit-form-group">
                      <label>Assigned To</label>
                      <input
                        type="text"
                        name="assigned_to"
                        value={formData.assigned_to}
                        onChange={handleInputChange}
                        className="note-edit-form-control"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {formData.type === 'whatsapp' && (
              <>
                <div className="note-edit-form-group">
                  <label>Contact Name</label>
                  <input
                    type="text"
                    name="contact_name"
                    value={formData.contact_name}
                    onChange={handleInputChange}
                    className="note-edit-form-control"
                  />
                </div>
                <div className="note-edit-form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    className="note-edit-form-control"
                  />
                </div>
                <div className="note-edit-form-group note-edit-full-width">
                  <label>Message Summary</label>
                  <textarea
                    name="message_summary"
                    value={formData.message_summary}
                    onChange={handleInputChange}
                    rows={2}
                    className="note-edit-form-control"
                  />
                </div>
                <div className="note-edit-form-group note-edit-full-width">
                  <label>Required Action</label>
                  <textarea
                    name="required_action"
                    value={formData.required_action}
                    onChange={handleInputChange}
                    rows={2}
                    className="note-edit-form-control"
                  />
                </div>
                <div className="note-edit-form-group">
                  <label>Attachment URL</label>
                  <input
                    type="text"
                    name="attachment_url"
                    value={formData.attachment_url}
                    onChange={handleInputChange}
                    className="note-edit-form-control"
                  />
                </div>
                <div className="note-edit-form-group">
                  <label>Response Status</label>
                  <select
                    name="response_status"
                    value={formData.response_status}
                    onChange={handleInputChange}
                    className="note-edit-form-control"
                  >
                    <option value="">Select</option>
                    <option value="Pending Reply">Pending Reply</option>
                    <option value="Replied">Replied</option>
                    <option value="Waiting Response">Waiting Response</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                <div className="note-edit-form-group note-edit-full-width">
                  <label>Remarks</label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    rows={3}
                    className="note-edit-form-control"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Project Notes (Project Command Sheet) Section */}
              {formData.category === 'project_command_sheets' && (
                <div className="note-edit-section">
                  <h4 className="note-edit-section-title">Project Command Sheet</h4>
                  <div className="note-edit-two-column-grid">
                    <div className="note-edit-form-group note-edit-full-width">
                      <label>Project Name</label>
                      <input
                        type="text"
                        name="project_name"
                        value={formData.project_name}
                        onChange={handleInputChange}
                        className="note-edit-form-control"
                      />
                    </div>
                    <div className="note-edit-form-group note-edit-full-width">
                      <label>Project Details</label>
                      <textarea
                        name="project_details"
                        value={formData.project_details}
                        onChange={handleInputChange}
                        rows={3}
                        className="note-edit-form-control"
                      />
                    </div>
                    <div className="note-edit-form-group note-edit-full-width">
                      <label>Discussions</label>
                      <textarea
                        name="discussions"
                        value={formData.discussions}
                        onChange={handleInputChange}
                        rows={3}
                        className="note-edit-form-control"
                      />
                    </div>
                    <div className="note-edit-form-group note-edit-full-width">
                      <label>Decisions</label>
                      <textarea
                        name="decisions"
                        value={formData.decisions}
                        onChange={handleInputChange}
                        rows={3}
                        className="note-edit-form-control"
                      />
                    </div>
                    <div className="note-edit-form-group note-edit-full-width">
                      <label>Meeting Notes</label>
                      <textarea
                        name="meeting_notes"
                        value={formData.meeting_notes}
                        onChange={handleInputChange}
                        rows={3}
                        className="note-edit-form-control"
                      />
                    </div>
                    <div className="note-edit-form-group">
                      <label>Start Date</label>
                      <input
                        type="date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleInputChange}
                        className="note-edit-form-control"
                      />
                    </div>
                    <div className="note-edit-form-group">
                      <label>End Date</label>
                      <input
                        type="date"
                        name="end_date"
                        value={formData.end_date}
                        onChange={handleInputChange}
                        className="note-edit-form-control"
                      />
                    </div>
                    <div className="note-edit-form-group">
                      <label>Status</label>
                      <select
                        name="pcs_status"
                        value={formData.pcs_status}
                        onChange={handleInputChange}
                        className="note-edit-form-control"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    <div className="note-edit-form-group note-edit-full-width">
                      <label>Next Steps</label>
                      <textarea
                        name="next_steps"
                        value={formData.next_steps}
                        onChange={handleInputChange}
                        rows={3}
                        className="note-edit-form-control"
                      />
                    </div>
                    <div className="note-edit-form-group note-edit-full-width">
                      <label>Results</label>
                      <textarea
                        name="results"
                        value={formData.results}
                        onChange={handleInputChange}
                        rows={3}
                        className="note-edit-form-control"
                      />
                    </div>
                  </div>
                </div>
              )}

      <div className="note-edit-two-column-grid">
        <div className="note-edit-form-group">
          <label>PA Remarks</label>
          <textarea
            name="pa_remarks"
            value={formData.pa_remarks}
            onChange={handleInputChange}
            rows={3}
            className="note-edit-form-control"
          />
        </div>
        <div className="note-edit-form-group">
          <label>CEO Remarks</label>
          <textarea
            name="ceo_remarks"
            value={formData.ceo_remarks}
            onChange={handleInputChange}
            rows={3}
            className="note-edit-form-control"
          />
        </div>
      </div>

      <div className="note-edit-two-column-grid">
        <div className="note-edit-form-group">
          <label>Attachment</label>
          <input
            type="text"
            name="attachment"
            value={formData.attachment}
            onChange={handleInputChange}
            className="note-edit-form-control"
          />
        </div>
        <div className="note-edit-form-group">
          <label>Voice Note</label>
          <input
            type="text"
            name="voice_note"
            value={formData.voice_note}
            onChange={handleInputChange}
            className="note-edit-form-control"
          />
        </div>
      </div>

      <div className="note-edit-action-buttons-container">
        <button onClick={onCancel} className="note-edit-btn note-edit-btn-secondary">
          Cancel
        </button>
        <button onClick={handleSubmit} className="note-edit-btn note-edit-btn-primary">
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default NoteEdit;
