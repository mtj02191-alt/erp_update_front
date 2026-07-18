
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import ConvertToTaskModal from '../../ConvertToTaskModal';
import NoteEdit from '../note-edit';
import './index.css';

const CeoNoteView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(location.state?.isEditing || false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [approvalData, setApprovalData] = useState({
    decision: 'approved',
    remarks: ''
  });
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [convertData, setConvertData] = useState({
    task_title: '',
    task_description: '',
    task_department: '',
    task_priority: '',
    task_due_date: '',
    assigned_users: [],
    mov_items: []
  });
  const [auditHistory, setAuditHistory] = useState([]);
  const [showAuditHistory, setShowAuditHistory] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    if (id) {
      fetchNote();
    }
  }, [id]);

  const fetchNote = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/ceo-notes/${id}`);
      setNote(response.data);

      setConvertData({
        task_title: response.data.title,
        task_description: response.data.details,
        task_department: response.data.department,
        task_priority: response.data.priority,
        task_due_date: response.data.due_date ? response.data.due_date.split('T')[0] : '',
        assigned_users: response.data.assigned_user_ids?.length > 0 
          ? response.data.assigned_user_ids 
          : [],
      });
    } catch (error) {
      console.error('Error fetching note:', error);
      toast.error('Failed to load note');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditHistory = async () => {
    try {
      setLoadingAudit(true);
      const response = await axios.get(`/ceo-notes/${id}/audit-history`);
      setAuditHistory(response.data);
      setShowAuditHistory(true);
    } catch (error) {
      console.error('Error fetching audit history:', error);
      toast.error('Failed to load audit history');
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await axios.delete(`/ceo-notes/${id}`);
      toast.success('Note deleted successfully');
      navigate('/ceo-office/instruction-register');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  const handleApprove = async () => {
    try {
      await axios.post(`/ceo-notes/${id}/approve`, approvalData);
      toast.success('Approval submitted');
      setApprovalModalOpen(false);
      fetchNote();
    } catch (error) {
      console.error('Error submitting approval:', error);
      toast.error('Failed to submit approval');
    }
  };

  const handleConvertToTask = async () => {
    try {
      await axios.post(`/ceo-notes/${id}/convert-to-task`, convertData);
      toast.success('Note converted to task successfully');
      setConvertModalOpen(false);
      fetchNote();
    } catch (error) {
      console.error('Error converting to task:', error);
      toast.error('Failed to convert note to task');
    }
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      unprocessed: 'note-view-status-unprocessed',
      pending: 'note-view-status-pending',
      in_progress: 'note-view-status-in_progress',
      waiting_response: 'note-view-status-waiting_response',
      submitted: 'note-view-status-submitted',
      approved: 'note-view-status-approved',
      rejected: 'note-view-status-rejected',
      completed: 'note-view-status-completed',
      closed: 'note-view-status-closed',
      cancelled: 'note-view-status-cancelled'
    };
    return classes[status] || 'note-view-status-pending';
  };

  const getPriorityBadgeClass = (priority) => {
    const classes = {
      low: 'note-view-priority-low',
      medium: 'note-view-priority-medium',
      high: 'note-view-priority-high',
      critical: 'note-view-priority-critical'
    };
    return classes[priority] || 'note-view-priority-medium';
  };

  // Helper to check if a value is considered "present"
  const hasValue = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (Array.isArray(value)) {
      return value.length > 0 && value.some(item => {
        if (typeof item === 'object' && item !== null) {
          return Object.values(item).some(hasValue);
        }
        return hasValue(item);
      });
    }
    if (typeof value === 'object') {
      return Object.values(value).some(hasValue);
    }
    return true;
  };

  // Helper to render a field only if it has value
  const renderFieldIfPresent = (label, value, renderFn) => {
    if (!hasValue(value)) return null;
    return (
      <div className="note-view-form-group">
        <label>{label}</label>
        <p className="note-view-content-text">
          {renderFn ? renderFn(value) : value}
        </p>
      </div>
    );
  };

  const handleRemind = async () => {
    try {
      // Add a reminder entry
      const reminder = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        notes: 'Reminder sent'
      };
      
      const updatedWaitingResponseReminders = [
        ...(note.waiting_response_reminders || []),
        reminder
      ];
      
      await axios.patch(`/ceo-notes/${id}`, {
        waiting_response_reminders: updatedWaitingResponseReminders,
        waiting_response_last_reminder_date: new Date().toISOString().split('T')[0]
      });
      
      toast.success('Reminder sent successfully');
      fetchNote();
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error('Failed to send reminder');
    }
  };

  const handleReopen = async () => {
    try {
      await axios.patch(`/ceo-notes/${id}`, {
        status: 'in_progress'
      });
      
      toast.success('Note reopened successfully');
      fetchNote();
    } catch (error) {
      console.error('Error reopening note:', error);
      toast.error('Failed to reopen note');
    }
  };

  const renderCategorySpecificButtons = () => {
    const buttons = [];

    switch (note.category) {
      case 'emails_and_approvals':
        buttons.push(
          <button key="approval" onClick={() => setApprovalModalOpen(true)} className="note-view-btn note-view-btn-success">
            Approval
          </button>
        );
        break;

      case 'top_priority':
      case 'today_task':
      case 'ceo_direct_orders':
        if (!note.related_task_id) {
          buttons.push(
            <button key="convert-to-task" onClick={() => setConvertModalOpen(true)} className="note-view-btn note-view-btn-info">
              Convert to Task
            </button>
          );
        }
        break;

      case 'follow_up':
      case 'waiting_response':
        buttons.push(
          <button key="remind" onClick={handleRemind} className="note-view-btn note-view-btn-warning">
            Remind
          </button>
        );
        break;

      case 'calls':
      case 'whatsapp':
      case 'visitors':
        buttons.push(
          <button key="edit" onClick={() => setIsEditing(true)} className="note-view-btn note-view-btn-primary">
            Edit
          </button>
        );
        buttons.push(
          <button key="delete" onClick={handleDelete} className="note-view-btn note-view-btn-danger">
            Delete
          </button>
        );
        break;

      case 'meetings':
        buttons.push(
          <button key="add-action-item" onClick={() => setIsEditing(true)} className="note-view-btn note-view-btn-primary">
            Add Action Item
          </button>
        );
        break;

      case 'project_notes':
        buttons.push(
          <button key="edit" onClick={() => setIsEditing(true)} className="note-view-btn note-view-btn-primary">
            Edit
          </button>
        );
        break;

      case 'important_decisions':
        buttons.push(
          <button key="view-decision" onClick={() => {
            // Scroll to meeting decisions section if available
            const decisionsSection = document.querySelector('.note-view-section');
            if (decisionsSection) {
              decisionsSection.scrollIntoView({ behavior: 'smooth' });
            }
          }} className="note-view-btn note-view-btn-info">
            View Decision
          </button>
        );
        break;

      default:
        break;
    }

    // Always keep Audit History
    buttons.push(
      <button key="audit-history" onClick={fetchAuditHistory} className="note-view-btn note-view-btn-warning" disabled={loadingAudit}>
        {loadingAudit ? 'Loading...' : 'Audit History'}
      </button>
    );

    // If status is completed, add Reopen button
    if (note.status === 'completed') {
      buttons.push(
        <button key="reopen" onClick={handleReopen} className="note-view-btn note-view-btn-primary">
          Reopen
        </button>
      );
    }

    return buttons;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="note-view-loading-container">Loading...</div>
      </>
    );
  }

  if (!note) {
    return (
      <>
        <Navbar />
        <div className="note-view-loading-container">Note not found</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="note-view-container">
      <div className="note-view-page-header">
        <h3>CEO Note Details</h3>
        <div className="note-view-header-actions">
          <button onClick={() => navigate('/ceo-office/dashboard')} className="note-view-btn note-view-btn-secondary">
            Back
          </button>
          <button onClick={() => setIsEditing(!isEditing)} className="note-view-btn note-view-btn-primary">
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </div>

      <div className="note-view-details-container">
        {isEditing ? (
          <NoteEdit
            note={note}
            onSave={(updatedNote) => {
              setNote(updatedNote);
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <>
            <div className="note-view-meta-section">
              <div className="note-view-meta-item">
                <span className="note-view-meta-label">Date:</span>
                <span>{new Date(note.date).toLocaleDateString()}</span>
              </div>
              <div className="note-view-meta-item">
                <span className="note-view-meta-label">Category:</span>
                <span>{note.category?.replace('_', ' ')}</span>
              </div>
              <div className="note-view-meta-item">
                <span className="note-view-meta-label">Priority:</span>
                <span className={`note-view-priority-badge ${getPriorityBadgeClass(note.priority)}`}>
                  {note.priority}
                </span>
              </div>
              <div className="note-view-meta-item">
                <span className="note-view-meta-label">Status:</span>
                <span className={`note-view-status-badge ${getStatusBadgeClass(note.status)}`}>
                  {note.status?.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="note-view-content-section">
              <div className="note-view-form-group">
                <label>Title</label>
                <p className="note-view-content-text">{note.title}</p>
              </div>

              {hasValue(note.details) && (
                <div className="note-view-form-group">
                  <label>Details</label>
                  <p className="note-view-content-text">{note.details}</p>
                </div>
              )}

              <div className="note-view-two-column-grid">
                {hasValue(note.related_person) && (
                  <div className="note-view-form-group">
                    <label>Related Person</label>
                    <p className="note-view-content-text">{note.related_person}</p>
                  </div>
                )}

                {hasValue(note.department) && (
                  <div className="note-view-form-group">
                    <label>Department</label>
                    <p className="note-view-content-text">{note.department?.replace('_', ' ')}</p>
                  </div>
                )}

                {hasValue(note.due_date) && (
                  <div className="note-view-form-group">
                    <label>Due Date</label>
                    <p className="note-view-content-text">{new Date(note.due_date).toLocaleDateString()}</p>
                  </div>
                )}

                {hasValue(note.assigned_users) || hasValue(note.assigned_user_ids) ? (
                  <div className="note-view-form-group">
                    <label>Assigned Users</label>
                    <p className="note-view-content-text">
                      {note.assigned_users?.length > 0 
                        ? note.assigned_users.map(u => {
                            const firstName = u.first_name || '';
                            const lastName = u.last_name || '';
                            const email = u.email || '';
                            const fullName = `${firstName} ${lastName}`.trim();
                            return fullName || email || `User ${u.id}`;
                          }).join(', ')
                        : note.assigned_user_ids?.join(', ')
                      }
                    </p>
                  </div>
                ) : null}

                {/* {hasValue(note.related_task_id) && (
                  <div className="note-view-form-group">
                    <label>Related Task ID</label>
                    <p className="note-view-content-text">{note.related_task_id}</p>
                  </div>
                )} */}
              </div>

              {/* Follow-up Section */}
              {note.category === 'follow_up' && (
                hasValue(note.follow_up_requested_from) ||
                hasValue(note.follow_up_requested_date) ||
                hasValue(note.follow_up_last_date) ||
                hasValue(note.follow_up_next_date) ||
                hasValue(note.follow_up_current_response) ||
                hasValue(note.follow_up_remarks)
              ) && (
                <div className="note-view-section">
                  <h4 className="note-view-section-title">Follow-up Information</h4>
                  <div className="note-view-two-column-grid">
                    {hasValue(note.follow_up_requested_from) && (
                      <div className="note-view-form-group">
                        <label>Requested From</label>
                        <p className="note-view-content-text">{note.follow_up_requested_from}</p>
                      </div>
                    )}
                    {hasValue(note.follow_up_requested_date) && (
                      <div className="note-view-form-group">
                        <label>Requested Date</label>
                        <p className="note-view-content-text">{new Date(note.follow_up_requested_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    {hasValue(note.follow_up_last_date) && (
                      <div className="note-view-form-group">
                        <label>Last Follow-up Date</label>
                        <p className="note-view-content-text">{new Date(note.follow_up_last_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    {hasValue(note.follow_up_next_date) && (
                      <div className="note-view-form-group">
                        <label>Next Follow-up Date</label>
                        <p className="note-view-content-text">{new Date(note.follow_up_next_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    {hasValue(note.follow_up_current_response) && (
                      <div className="note-view-form-group full-width">
                        <label>Current Response</label>
                        <p className="note-view-content-text">{note.follow_up_current_response}</p>
                      </div>
                    )}
                    {hasValue(note.follow_up_remarks) && (
                      <div className="note-view-form-group full-width">
                        <label>Remarks</label>
                        <p className="note-view-content-text">{note.follow_up_remarks}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Meeting Section */}
              {note.category === 'meetings' && (
                hasValue(note.meeting_date) ||
                hasValue(note.meeting_with) ||
                hasValue(note.meeting_subject) ||
                hasValue(note.meeting_discussion_points) ||
                hasValue(note.meeting_decisions) ||
                hasValue(note.meeting_action_items)
              ) && (
                <div className="note-view-section">
                  <h4 className="note-view-section-title">Meeting Information</h4>
                  <div className="note-view-two-column-grid">
                    {hasValue(note.meeting_date) && (
                      <div className="note-view-form-group">
                        <label>Meeting Date & Time</label>
                        <p className="note-view-content-text">{new Date(note.meeting_date).toLocaleString()}</p>
                      </div>
                    )}
                    {hasValue(note.meeting_with) && (
                      <div className="note-view-form-group">
                        <label>Meeting With</label>
                        <p className="note-view-content-text">{note.meeting_with}</p>
                      </div>
                    )}
                  </div>
                  {hasValue(note.meeting_subject) && (
                    <div className="note-view-form-group full-width">
                      <label>Subject / Topic</label>
                      <p className="note-view-content-text">{note.meeting_subject}</p>
                    </div>
                  )}

                  {/* Discussion Points */}
                  {hasValue(note.meeting_discussion_points) && (
                    <div className="note-view-form-group full-width">
                      <label>Discussion Points</label>
                      <ul>
                        {note.meeting_discussion_points.map((point, index) => (
                          <li key={index} className="note-view-content-text">{point.content}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Decisions */}
                  {hasValue(note.meeting_decisions) && (
                    <div className="note-view-form-group full-width">
                      <label>Decisions</label>
                      <ul>
                        {note.meeting_decisions.map((decision, index) => (
                          <li key={index} className="note-view-content-text">{decision.content}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Items */}
                  {hasValue(note.meeting_action_items) && (
                    <div className="note-view-form-group full-width">
                      <label>Action Items</label>
                      {note.meeting_action_items.map((item, index) => (
                        <div key={index} className="note-view-action-item-display">
                          <strong>{item.content}</strong>
                          {hasValue(item.assigned_to) && <span> • {item.assigned_to}</span>}
                          {hasValue(item.due_date) && <span> • Due: {new Date(item.due_date).toLocaleDateString()}</span>}
                          {hasValue(item.status) && <span className={`note-view-status-small note-view-status-${item.status}`}> • {item.status}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Emails & Approvals Section */}
              {note.category === 'emails_and_approvals' && (
                hasValue(note.approval_type) ||
                hasValue(note.approval_requested_by) ||
                hasValue(note.approval_subject) ||
                hasValue(note.approval_reference_number) ||
                hasValue(note.approval_amount) ||
                hasValue(note.approval_decision) ||
                hasValue(note.approval_decision_remarks)
              ) && (
                <div className="note-view-section">
                  <h4 className="note-view-section-title">Approval Information</h4>
                  <div className="note-view-two-column-grid">
                    {hasValue(note.approval_type) && (
                      <div className="note-view-form-group">
                        <label>Approval Type</label>
                        <p className="note-view-content-text">{note.approval_type}</p>
                      </div>
                    )}
                    {hasValue(note.approval_requested_by) && (
                      <div className="note-view-form-group">
                        <label>Requested By</label>
                        <p className="note-view-content-text">{note.approval_requested_by}</p>
                      </div>
                    )}
                    {hasValue(note.approval_subject) && (
                      <div className="note-view-form-group">
                        <label>Subject</label>
                        <p className="note-view-content-text">{note.approval_subject}</p>
                      </div>
                    )}
                    {hasValue(note.approval_reference_number) && (
                      <div className="note-view-form-group">
                        <label>Reference Number</label>
                        <p className="note-view-content-text">{note.approval_reference_number}</p>
                      </div>
                    )}
                    {hasValue(note.approval_amount) && (
                      <div className="note-view-form-group">
                        <label>Approval Amount</label>
                        <p className="note-view-content-text">{note.approval_amount}</p>
                      </div>
                    )}
                    {hasValue(note.approval_decision) && (
                      <div className="note-view-form-group">
                        <label>Decision</label>
                        <p className={`note-view-content-text note-view-decision-${note.approval_decision}`}>{note.approval_decision}</p>
                      </div>
                    )}
                    {hasValue(note.approval_decision_remarks) && (
                      <div className="note-view-form-group full-width">
                        <label>Decision Remarks</label>
                        <p className="note-view-content-text">{note.approval_decision_remarks}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Waiting Response Section */}
              {note.category === 'waiting_response' && (
                hasValue(note.waiting_response_requested_from) ||
                hasValue(note.waiting_response_request_date) ||
                hasValue(note.waiting_response_expected_date) ||
                hasValue(note.waiting_response_last_reminder_date) ||
                hasValue(note.waiting_response_status) ||
                hasValue(note.waiting_response_remarks) ||
                hasValue(note.waiting_response_reminders)
              ) && (
                <div className="note-view-section">
                  <h4 className="note-view-section-title">Response Tracking</h4>
                  <div className="note-view-two-column-grid">
                    {hasValue(note.waiting_response_requested_from) && (
                      <div className="note-view-form-group">
                        <label>Requested From</label>
                        <p className="note-view-content-text">{note.waiting_response_requested_from}</p>
                      </div>
                    )}
                    {hasValue(note.waiting_response_request_date) && (
                      <div className="note-view-form-group">
                        <label>Request Date</label>
                        <p className="note-view-content-text">{new Date(note.waiting_response_request_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    {hasValue(note.waiting_response_expected_date) && (
                      <div className="note-view-form-group">
                        <label>Expected Response Date</label>
                        <p className="note-view-content-text">{new Date(note.waiting_response_expected_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    {hasValue(note.waiting_response_last_reminder_date) && (
                      <div className="note-view-form-group">
                        <label>Last Reminder Date</label>
                        <p className="note-view-content-text">{new Date(note.waiting_response_last_reminder_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    {hasValue(note.waiting_response_status) && (
                      <div className="note-view-form-group">
                        <label>Response Status</label>
                        <p className="note-view-content-text">{note.waiting_response_status}</p>
                      </div>
                    )}
                    {hasValue(note.waiting_response_remarks) && (
                      <div className="note-view-form-group full-width">
                        <label>Remarks</label>
                        <p className="note-view-content-text">{note.waiting_response_remarks}</p>
                      </div>
                    )}

                    {/* Waiting Response Reminders */}
                    {hasValue(note.waiting_response_reminders) && (
                      <div className="note-view-form-group full-width">
                        <label>Reminders</label>
                        {note.waiting_response_reminders.map((reminder, index) => (
                          <div key={index} className="note-view-action-item-display">
                            {hasValue(reminder.date) && (
                              <strong>{new Date(reminder.date).toLocaleDateString()}</strong>
                            )}
                            {hasValue(reminder.notes) && (
                              <span> • {reminder.notes}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Visitors/Calls/WhatsApp Section */}
              {(note.category === 'visitors' || note.category === 'calls' || note.category === 'whatsapp') && (
                (note.type === 'visitor' && (
                  hasValue(note.visit_datetime) ||
                  hasValue(note.visitor_name) ||
                  hasValue(note.organization) ||
                  hasValue(note.purpose) ||
                  hasValue(note.visitor_meeting_with) ||
                  hasValue(note.visitor_department) ||
                  hasValue(note.protocol_required) ||
                  hasValue(note.expected_duration) ||
                  hasValue(note.visitor_outcome)
                )) ||
                (note.type === 'call' && (
                  hasValue(note.visit_datetime) ||
                  hasValue(note.caller_name) ||
                  hasValue(note.organization) ||
                  hasValue(note.phone_number) ||
                  hasValue(note.call_purpose) ||
                  hasValue(note.call_summary) ||
                  hasValue(note.follow_up_required) ||
                  (note.follow_up_required === 'Yes' && (hasValue(note.follow_up_date) || hasValue(note.assigned_to)))
                )) ||
                (note.type === 'whatsapp' && (
                  hasValue(note.visit_datetime) ||
                  hasValue(note.contact_name) ||
                  hasValue(note.phone_number) ||
                  hasValue(note.message_summary) ||
                  hasValue(note.required_action) ||
                  hasValue(note.attachment_url) ||
                  hasValue(note.response_status) ||
                  hasValue(note.remarks)
                ))
              ) && (
                <div className="note-view-section">
                  <h4 className="note-view-section-title">
                    {note.category === 'visitors' ? 'Visitor Information' : 
                     note.category === 'calls' ? 'Call Information' : 'WhatsApp Information'}
                  </h4>
                  <div className="note-view-two-column-grid">
                    {hasValue(note.type) && (
                      <div className="note-view-form-group">
                        <label>Type</label>
                        <p className="note-view-content-text">{note.type}</p>
                      </div>
                    )}
                    {hasValue(note.visit_datetime) && (
                      <div className="note-view-form-group">
                        <label>Date & Time</label>
                        <p className="note-view-content-text">{new Date(note.visit_datetime).toLocaleString()}</p>
                      </div>
                    )}

                    {note.type === 'visitor' && (
                      <>
                        {hasValue(note.visitor_name) && (
                          <div className="note-view-form-group">
                            <label>Visitor Name</label>
                            <p className="note-view-content-text">{note.visitor_name}</p>
                          </div>
                        )}
                        {hasValue(note.organization) && (
                          <div className="note-view-form-group">
                            <label>Organization</label>
                            <p className="note-view-content-text">{note.organization}</p>
                          </div>
                        )}
                        {hasValue(note.purpose) && (
                          <div className="note-view-form-group full-width">
                            <label>Purpose</label>
                            <p className="note-view-content-text">{note.purpose}</p>
                          </div>
                        )}
                        {hasValue(note.visitor_meeting_with) && (
                          <div className="note-view-form-group">
                            <label>Meeting With</label>
                            <p className="note-view-content-text">{note.visitor_meeting_with}</p>
                          </div>
                        )}
                        {hasValue(note.visitor_department) && (
                          <div className="note-view-form-group">
                            <label>Department</label>
                            <p className="note-view-content-text">{note.visitor_department}</p>
                          </div>
                        )}
                        {hasValue(note.protocol_required) && (
                          <div className="note-view-form-group">
                            <label>Protocol Required</label>
                            <p className="note-view-content-text">{note.protocol_required}</p>
                          </div>
                        )}
                        {hasValue(note.expected_duration) && (
                          <div className="note-view-form-group">
                            <label>Expected Duration</label>
                            <p className="note-view-content-text">{note.expected_duration}</p>
                          </div>
                        )}
                        {hasValue(note.visitor_outcome) && (
                          <div className="note-view-form-group">
                            <label>Visitor Outcome</label>
                            <p className="note-view-content-text">{note.visitor_outcome}</p>
                          </div>
                        )}
                      </>
                    )}

                    {note.type === 'call' && (
                      <>
                        {hasValue(note.caller_name) && (
                          <div className="note-view-form-group">
                            <label>Caller Name</label>
                            <p className="note-view-content-text">{note.caller_name}</p>
                          </div>
                        )}
                        {hasValue(note.organization) && (
                          <div className="note-view-form-group">
                            <label>Organization</label>
                            <p className="note-view-content-text">{note.organization}</p>
                          </div>
                        )}
                        {hasValue(note.phone_number) && (
                          <div className="note-view-form-group">
                            <label>Phone Number</label>
                            <p className="note-view-content-text">{note.phone_number}</p>
                          </div>
                        )}
                        {hasValue(note.call_purpose) && (
                          <div className="note-view-form-group full-width">
                            <label>Call Purpose</label>
                            <p className="note-view-content-text">{note.call_purpose}</p>
                          </div>
                        )}
                        {hasValue(note.call_summary) && (
                          <div className="note-view-form-group full-width">
                            <label>Call Summary</label>
                            <p className="note-view-content-text">{note.call_summary}</p>
                          </div>
                        )}
                        {hasValue(note.follow_up_required) && (
                          <div className="note-view-form-group">
                            <label>Follow-up Required</label>
                            <p className="note-view-content-text">{note.follow_up_required}</p>
                          </div>
                        )}
                        {note.follow_up_required === 'Yes' && (
                          <>
                            {hasValue(note.follow_up_date) && (
                              <div className="note-view-form-group">
                                <label>Follow-up Date</label>
                                <p className="note-view-content-text">{new Date(note.follow_up_date).toLocaleString()}</p>
                              </div>
                            )}
                            {hasValue(note.assigned_to) && (
                              <div className="note-view-form-group">
                                <label>Assigned To</label>
                                <p className="note-view-content-text">{note.assigned_to}</p>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}

                    {note.type === 'whatsapp' && (
                      <>
                        {hasValue(note.contact_name) && (
                          <div className="note-view-form-group">
                            <label>Contact Name</label>
                            <p className="note-view-content-text">{note.contact_name}</p>
                          </div>
                        )}
                        {hasValue(note.phone_number) && (
                          <div className="note-view-form-group">
                            <label>Phone Number</label>
                            <p className="note-view-content-text">{note.phone_number}</p>
                          </div>
                        )}
                        {hasValue(note.message_summary) && (
                          <div className="note-view-form-group full-width">
                            <label>Message Summary</label>
                            <p className="note-view-content-text">{note.message_summary}</p>
                          </div>
                        )}
                        {hasValue(note.required_action) && (
                          <div className="note-view-form-group full-width">
                            <label>Required Action</label>
                            <p className="note-view-content-text">{note.required_action}</p>
                          </div>
                        )}
                        {hasValue(note.attachment_url) && (
                          <div className="note-view-form-group">
                            <label>Attachment URL</label>
                            <a href={note.attachment_url} target="_blank" rel="noopener noreferrer">
                              View Attachment
                            </a>
                          </div>
                        )}
                        {hasValue(note.response_status) && (
                          <div className="note-view-form-group">
                            <label>Response Status</label>
                            <p className="note-view-content-text">{note.response_status}</p>
                          </div>
                        )}
                        {hasValue(note.remarks) && (
                          <div className="note-view-form-group full-width">
                            <label>Remarks</label>
                            <p className="note-view-content-text">{note.remarks}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Project Notes Section */}
              {note.category === 'project_command_sheets' && (
                hasValue(note.project_name) ||
                hasValue(note.project_details) ||
                hasValue(note.discussions) ||
                hasValue(note.decisions) ||
                hasValue(note.meeting_notes) ||
                hasValue(note.start_date) ||
                hasValue(note.end_date) ||
                hasValue(note.pcs_status) ||
                hasValue(note.next_steps) ||
                hasValue(note.results)
              ) && (
                <div className="note-view-section">
                  <h4 className="note-view-section-title">Project Command Sheet</h4>
                  <div className="note-view-two-column-grid">
                    {hasValue(note.project_name) && (
                      <div className="note-view-form-group full-width">
                        <label>Project Name</label>
                        <p className="note-view-content-text">{note.project_name}</p>
                      </div>
                    )}
                    {hasValue(note.project_details) && (
                      <div className="note-view-form-group full-width">
                        <label>Project Details</label>
                        <p className="note-view-content-text">{note.project_details}</p>
                      </div>
                    )}
                    {hasValue(note.discussions) && (
                      <div className="note-view-form-group full-width">
                        <label>Discussions</label>
                        <p className="note-view-content-text">{note.discussions}</p>
                      </div>
                    )}
                    {hasValue(note.decisions) && (
                      <div className="note-view-form-group full-width">
                        <label>Decisions</label>
                        <p className="note-view-content-text">{note.decisions}</p>
                      </div>
                    )}
                    {hasValue(note.meeting_notes) && (
                      <div className="note-view-form-group full-width">
                        <label>Meeting Notes</label>
                        <p className="note-view-content-text">{note.meeting_notes}</p>
                      </div>
                    )}
                    {hasValue(note.start_date) && (
                      <div className="note-view-form-group">
                        <label>Start Date</label>
                        <p className="note-view-content-text">{new Date(note.start_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    {hasValue(note.end_date) && (
                      <div className="note-view-form-group">
                        <label>End Date</label>
                        <p className="note-view-content-text">{new Date(note.end_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    {hasValue(note.pcs_status) && (
                      <div className="note-view-form-group">
                        <label>Status</label>
                        <p className="note-view-content-text">{note.pcs_status}</p>
                      </div>
                    )}
                    {hasValue(note.next_steps) && (
                      <div className="note-view-form-group full-width">
                        <label>Next Steps</label>
                        <p className="note-view-content-text">{note.next_steps}</p>
                      </div>
                    )}
                    {hasValue(note.results) && (
                      <div className="note-view-form-group full-width">
                        <label>Results</label>
                        <p className="note-view-content-text">{note.results}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="note-view-two-column-grid">
                {hasValue(note.pa_remarks) && (
                  <div className="note-view-form-group">
                    <label>PA Remarks</label>
                    <p className="note-view-content-text">{note.pa_remarks}</p>
                  </div>
                )}

                {hasValue(note.ceo_remarks) && (
                  <div className="note-view-form-group">
                    <label>CEO Remarks</label>
                    <p className="note-view-content-text">{note.ceo_remarks}</p>
                  </div>
                )}
              </div>

              <div className="note-view-two-column-grid">
                {hasValue(note.attachment) && (
                  <div className="note-view-form-group">
                    <label>Attachment</label>
                    <a href={note.attachment} target="_blank" rel="noopener noreferrer">
                      View Attachment
                    </a>
                  </div>
                )}

                {hasValue(note.voice_note) && (
                  <div className="note-view-form-group">
                    <label>Voice Note</label>
                    <a href={note.voice_note} target="_blank" rel="noopener noreferrer">
                      Play Voice Note
                    </a>
                  </div>
                )}
              </div>

              {note.related_task && (
                <div className="note-view-related-task-section">
                  <h3>Related Task</h3>
                  <div className="note-view-task-info">
                    <a
                      href="#"
                      className="task-link"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/tasks/view/${note.related_task.id}`);
                      }}
                    >
                      Task ID: {note.related_task.id}
                    </a>
                    <a
                      href="#"
                      className="task-link"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/tasks/view/${note.related_task.id}`);
                      }}
                    >
                      Title: {note.related_task.title}
                    </a>
                    <span>Status: {note.related_task.status}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="note-view-action-buttons-container">
              {renderCategorySpecificButtons()}
            </div>

            {/* Audit History Section */}
            {showAuditHistory && (
              <div className="note-view-audit-history-section">
                <div className="note-view-section-header">
                  <h3>Audit History</h3>
                  <button onClick={() => setShowAuditHistory(false)} className="note-view-btn note-view-btn-sm note-view-btn-secondary">
                    Close
                  </button>
                </div>
                <div className="note-view-audit-list">
                  {auditHistory.length > 0 ? (
                    auditHistory.map((audit, index) => {
                      // Function to format field names nicely
                      const formatFieldName = (field) => {
                        return field
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (c) => c.toUpperCase());
                      };

                      // Function to format field values nicely - make it short!
                      const formatFieldValue = (value) => {
                        if (value === null) return 'None';
                        if (value === undefined) return 'None';
                        if (typeof value === 'string' && value.length === 0) return 'Empty';
                        if (Array.isArray(value)) return '[...]';
                        if (typeof value === 'object') return '{...}';
                        if (typeof value === 'string' && value.length > 50) {
                          return value.substring(0, 50) + '...';
                        }
                        return String(value);
                      };

                      // Get changed fields
                      const oldVal = audit.old_value || {};
                      const newVal = audit.new_value || {};
                      const allKeys = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);
                      const changedFields = [...allKeys].filter(
                        (key) => JSON.stringify(oldVal[key]) !== JSON.stringify(newVal[key])
                      );

                      return (
                        <div key={index} className="note-view-audit-item">
                          <div className="note-view-audit-header">
                            <div className="note-view-audit-header-left">
                              <span className="note-view-audit-action">{audit.action}</span>
                              {audit.user && (
                                <span className="note-view-audit-user">
                                  • By: {audit.user.name || audit.user.email}
                                </span>
                              )}
                            </div>
                            <span className="note-view-audit-date">
                              {new Date(audit.created_at).toLocaleString()}
                            </span>
                          </div>
                          {changedFields.length > 0 ? (
                            <div className="note-view-audit-changes">
                              <div className="note-view-audit-changes-list">
                                {changedFields.map((field) => (
                                  <div key={field} className="note-view-audit-change">
                                    <div className="note-view-audit-change-field">
                                      {formatFieldName(field)}
                                    </div>
                                    <div className="note-view-audit-change-values">
                                      <span className="note-view-audit-change-old-value">
                                        {formatFieldValue(oldVal[field])}
                                      </span>
                                      <span className="note-view-audit-change-arrow">→</span>
                                      <span className="note-view-audit-change-new-value">
                                        {formatFieldValue(newVal[field])}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="note-view-audit-no-changes">
                              No changes to display
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="note-view-empty-state">No audit history found</div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Approval Modal */}
      {approvalModalOpen && (
        <div className="note-view-modal-overlay">
          <div className="note-view-modal-content">
            <div className="note-view-modal-header">
              <h2>Approval</h2>
              <button onClick={() => setApprovalModalOpen(false)} className="note-view-close-btn">&times;</button>
            </div>
            <div className="note-view-modal-body">
              <div className="note-view-form-group">
                <label>Decision</label>
                <select
                  value={approvalData.decision}
                  onChange={(e) => setApprovalData({ ...approvalData, decision: e.target.value })}
                  className="note-view-form-control"
                >
                  <option value="approved">Approve</option>
                  <option value="rejected">Reject</option>
                  <option value="clarification_requested">Request Clarification</option>
                </select>
              </div>
              <div className="note-view-form-group">
                <label>Remarks</label>
                <textarea
                  value={approvalData.remarks}
                  onChange={(e) => setApprovalData({ ...approvalData, remarks: e.target.value })}
                  rows={4}
                  className="note-view-form-control"
                />
              </div>
            </div>
            <div className="note-view-modal-footer">
              <button onClick={() => setApprovalModalOpen(false)} className="note-view-btn note-view-btn-secondary">
                Cancel
              </button>
              <button onClick={handleApprove} className="note-view-btn note-view-btn-primary">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Task Modal */}
      <ConvertToTaskModal
        isOpen={convertModalOpen}
        onClose={() => setConvertModalOpen(false)}
        convertData={convertData}
        setConvertData={setConvertData}
        onConvert={handleConvertToTask}
      />
    </div>
    </>
  );
};

export default CeoNoteView;
