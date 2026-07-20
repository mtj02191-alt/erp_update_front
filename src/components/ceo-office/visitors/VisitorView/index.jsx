import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaUserCheck, FaPhone, FaWhatsapp, FaArrowLeft, FaEdit, FaTrash } from 'react-icons/fa';
import axios from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import './index.css';

const getDefaultFormData = () => ({
  type: 'visitor',
  visitorName: '',
  organization: '',
  purpose: '',
  meetingWith: '',
  department: '',
  protocolRequired: '',
  expectedDuration: '',
  visitorOutcome: '',
  callerName: '',
  phoneNumber: '',
  callPurpose: '',
  callSummary: '',
  followUpRequired: 'No',
  followUpDate: '',
  assignedTo: '',
  contactName: '',
  whatsappPhoneNumber: '',
  messageSummary: '',
  requiredAction: '',
  attachmentUrl: '',
  responseStatus: '',
  visitDatetime: new Date().toISOString().slice(0, 16),
  relatedNoteId: '',
  remarks: '',
  status: 'Pending'
});

const VisitorView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [visitor, setVisitor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(getDefaultFormData());

  useEffect(() => {
    if (id) {
      fetchVisitor();
    }
  }, [id]);

  const fetchVisitor = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/visitors/${id}`);
      console.log('Fetched visitor data:', response.data);
      setVisitor(response.data);
      setFormData({
        type: (response.data.type || 'visitor').toLowerCase(),
        status: response.data.status || 'Pending',
        visitDatetime: response.data.visit_datetime ? response.data.visit_datetime.slice(0, 16) : new Date().toISOString().slice(0, 16),
        relatedNoteId: response.data.related_note_id ? response.data.related_note_id.toString() : '',
        remarks: response.data.remarks,
        
        visitorName: response.data.visitor_name,
        organization: response.data.organization,
        purpose: response.data.purpose,
        meetingWith: response.data.meeting_with,
        department: response.data.department,
        protocolRequired: response.data.protocol_required,
        expectedDuration: response.data.expected_duration,
        visitorOutcome: response.data.visitor_outcome,
        
        callerName: response.data.caller_name,
        phoneNumber: response.data.phone_number,
        callPurpose: response.data.call_purpose,
        callSummary: response.data.call_summary,
        followUpRequired: response.data.follow_up_required,
        followUpDate: response.data.follow_up_date ? response.data.follow_up_date.slice(0, 16) : '',
        assignedTo: response.data.assigned_to,
        
        contactName: response.data.contact_name,
        whatsappPhoneNumber: response.data.phone_number, // For WhatsApp, use the same phone_number field
        messageSummary: response.data.message_summary,
        requiredAction: response.data.required_action,
        attachmentUrl: response.data.attachment_url,
        responseStatus: response.data.response_status
      });
    } catch (error) {
      console.error('Error fetching visitor:', error);
      toast.error('Failed to load visitor log');
    } finally {
      setLoading(false);
    }
  };

  const buildPayload = (data) => {
    const type = data.type;
    // Parse related note ID
    let relatedNoteId = null;
    const trimmedId = data.relatedNoteId.trim();
    const parsedId = parseInt(trimmedId);
    if (trimmedId && !isNaN(parsedId) && parsedId > 0) {
      relatedNoteId = parsedId;
    }

    // Common fields
    const payload = {
      type,
      status: data.status,
      visit_datetime: data.visitDatetime,
      remarks: data.remarks,
    };
    if (relatedNoteId !== null) {
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
        department: data.department,
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

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = buildPayload(formData);
      console.log('Updating visitor with payload:', payload);
      await axios.patch(`/visitors/${id}`, payload);
      toast.success('Visitor log updated successfully');
      setIsEditing(false);
      fetchVisitor();
    } catch (error) {
      console.error('Error updating visitor log:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.detail || '';
      if (errorMsg.includes('foreign key constraint') || errorMsg.includes('not present in table') || errorMsg.includes('Related note')) {
        toast.error('Error: Related note ID does not exist. Please enter a valid note ID.');
      } else {
        toast.error('Failed to update visitor log');
      }
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this visitor log?')) return;
    try {
      await axios.delete(`/visitors/${id}`);
      toast.success('Visitor log deleted successfully');
      navigate('/ceo-office/visitors');
    } catch (error) {
      console.error('Error deleting visitor log:', error);
      toast.error('Failed to delete visitor log');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="visitor-view-loading-container">Loading...</div>
      </>
    );
  }

  if (!visitor) {
    return (
      <>
        <Navbar />
        <div className="visitor-view-loading-container">Visitor log not found</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="visitor-view-container">
      <div className="visitor-view-page-header">
        <h3>
          {visitor.type?.toLowerCase() === 'call' 
            ? `Call: ${visitor.caller_name || 'Unknown'}` 
            : visitor.type?.toLowerCase() === 'whatsapp' 
              ? `WhatsApp: ${visitor.contact_name || 'Unknown'}`
              : `Visitor: ${visitor.visitor_name || 'Unknown'}`}
        </h3>
        <div className="visitor-view-header-actions">
          <button onClick={() => navigate('/ceo-office/visitors')} className="visitor-view-btn-secondary">
            {/* <FaArrowLeft /> */}
            &nbsp;Back
          </button>
          <button onClick={() => setIsEditing(true)} className="visitor-view-btn-primary">
            <FaEdit />
            &nbsp;Edit
          </button>
          <button onClick={handleDelete} className="visitor-view-btn-secondary" style={{backgroundColor: '#dc3545'}}>
            <FaTrash />
            &nbsp;Delete
          </button>
        </div>
      </div>

      <div className="visitor-view-table-wrapper">
        <div className="visitor-view-table-container">
          <div className="visitor-view-note-details-container">
            <>
              <div className="visitor-view-note-meta-section">
                <div className="visitor-view-meta-item">
                  <span className="visitor-view-meta-label">Type</span>
                  <span>
                    <div className={`visitor-view-type-badge visitor-view-type-${(visitor.type || 'visitor').toLowerCase()}`} style={{display: 'inline-flex', alignItems: 'center', gap: '6px'}}>
                      {visitor.type?.toLowerCase() === 'call' && <FaPhone />}
                      {visitor.type?.toLowerCase() === 'whatsapp' && <FaWhatsapp />}
                      {visitor.type?.toLowerCase() !== 'call' && visitor.type?.toLowerCase() !== 'whatsapp' && <FaUserCheck />}
                      &nbsp;
                      {visitor.type?.toLowerCase() === 'visitor' ? 'Visitor' : visitor.type?.toLowerCase() === 'call' ? 'Call' : 'WhatsApp'}
                    </div>
                  </span>
                </div>

                <div className="visitor-view-meta-item">
                  <span className="visitor-view-meta-label">Date & Time</span>
                  <span>{new Date(visitor.visit_datetime).toLocaleString()}</span>
                </div>

                <div className="visitor-view-meta-item">
                  <span className="visitor-view-meta-label">Status</span>
                  <span className={`visitor-view-status-badge visitor-view-status-${(visitor.status || 'Pending').toLowerCase().replace(' ', '-')}`}>
                    {visitor.status || 'Pending'}
                  </span>
                </div>

                {visitor.related_note_id && (
                <div className="visitor-view-meta-item">
                  <span className="visitor-view-meta-label">Related Note</span>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/ceo-office/notes/${visitor.related_note_id}`);
                    }}
                  >
                    Note #{visitor.related_note_id}
                  </a>
                </div>
              )}
              {visitor.related_task && (
                <div className="note-view-related-task-section">
                  <h3>Related Task</h3>
                  <div className="note-view-task-info">
                    <a
                      href="#"
                      className="task-link"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/tasks/view/${visitor.related_task.id}`);
                      }}
                    >
                      Task ID: {visitor.related_task.id}
                    </a>
                    <a
                      href="#"
                      className="task-link"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/tasks/view/${visitor.related_task.id}`);
                      }}
                    >
                      Title: {visitor.related_task.title}
                    </a>
                    <span>Status: {visitor.related_task.status}</span>
                  </div>
                </div>
              )}
            </div>

              {/* Visitor specific fields */}
              {visitor.type?.toLowerCase() === 'visitor' && (
                <div>
                  {visitor.visitor_name && (
                    <div className="visitor-view-form-group">
                      <label>Visitor Name</label>
                      <p className="visitor-view-content-text">{visitor.visitor_name}</p>
                    </div>
                  )}
                  {visitor.organization && (
                    <div className="visitor-view-form-group">
                      <label>Organization</label>
                      <p className="visitor-view-content-text">{visitor.organization}</p>
                    </div>
                  )}
                  {visitor.purpose && (
                    <div className="visitor-view-form-group">
                      <label>Purpose</label>
                      <p className="visitor-view-content-text">{visitor.purpose}</p>
                    </div>
                  )}
                  {visitor.meeting_with && (
                    <div className="visitor-view-form-group">
                      <label>Meeting With</label>
                      <p className="visitor-view-content-text">{visitor.meeting_with}</p>
                    </div>
                  )}
                  {visitor.department && (
                    <div className="visitor-view-form-group">
                      <label>Department</label>
                      <p className="visitor-view-content-text">{visitor.department.replace('_', ' ')}</p>
                    </div>
                  )}
                  {visitor.protocol_required && (
                    <div className="visitor-view-form-group">
                      <label>Protocol Required</label>
                      <p className="visitor-view-content-text">{visitor.protocol_required}</p>
                    </div>
                  )}
                  {visitor.expected_duration && (
                    <div className="visitor-view-form-group">
                      <label>Expected Duration</label>
                      <p className="visitor-view-content-text">{visitor.expected_duration}</p>
                    </div>
                  )}
                  {visitor.visitor_outcome && (
                    <div className="visitor-view-form-group">
                      <label>Visitor Outcome</label>
                      <p className="visitor-view-content-text">{visitor.visitor_outcome}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Call specific fields */}
              {visitor.type?.toLowerCase() === 'call' && (
                <div>
                  {visitor.caller_name && (
                    <div className="visitor-view-form-group">
                      <label>Caller Name</label>
                      <p className="visitor-view-content-text">{visitor.caller_name}</p>
                    </div>
                  )}
                  {visitor.organization && (
                    <div className="visitor-view-form-group">
                      <label>Organization</label>
                      <p className="visitor-view-content-text">{visitor.organization}</p>
                    </div>
                  )}
                  {visitor.phone_number && (
                    <div className="visitor-view-form-group">
                      <label>Phone Number</label>
                      <p className="visitor-view-content-text">{visitor.phone_number}</p>
                    </div>
                  )}
                  {visitor.call_purpose && (
                    <div className="visitor-view-form-group">
                      <label>Call Purpose</label>
                      <p className="visitor-view-content-text">{visitor.call_purpose}</p>
                    </div>
                  )}
                  {visitor.call_summary && (
                    <div className="visitor-view-form-group">
                      <label>Call Summary</label>
                      <p className="visitor-view-content-text">{visitor.call_summary}</p>
                    </div>
                  )}
                  {visitor.follow_up_required && (
                    <div className="visitor-view-form-group">
                      <label>Follow-up Required</label>
                      <p className="visitor-view-content-text">{visitor.follow_up_required}</p>
                    </div>
                  )}
                  {visitor.follow_up_date && (
                    <div className="visitor-view-form-group">
                      <label>Follow-up Date</label>
                      <p className="visitor-view-content-text">{new Date(visitor.follow_up_date).toLocaleString()}</p>
                    </div>
                  )}
                  {visitor.assigned_to && (
                    <div className="visitor-view-form-group">
                      <label>Assigned To</label>
                      <p className="visitor-view-content-text">{visitor.assigned_to}</p>
                    </div>
                  )}
                </div>
              )}

              {/* WhatsApp specific fields */}
              {visitor.type?.toLowerCase() === 'whatsapp' && (
                <div>
                  {visitor.contact_name && (
                    <div className="visitor-view-form-group">
                      <label>Contact Name</label>
                      <p className="visitor-view-content-text">{visitor.contact_name}</p>
                    </div>
                  )}
                  {visitor.phone_number && (
                    <div className="visitor-view-form-group">
                      <label>Phone Number</label>
                      <p className="visitor-view-content-text">{visitor.phone_number}</p>
                    </div>
                  )}
                  {visitor.message_summary && (
                    <div className="visitor-view-form-group">
                      <label>Message Summary</label>
                      <p className="visitor-view-content-text">{visitor.message_summary}</p>
                    </div>
                  )}
                  {visitor.required_action && (
                    <div className="visitor-view-form-group">
                      <label>Required Action</label>
                      <p className="visitor-view-content-text">{visitor.required_action}</p>
                    </div>
                  )}
                  {visitor.attachment_url && (
                    <div className="visitor-view-form-group">
                      <label>Attachment</label>
                      <a href={visitor.attachment_url} target="_blank" rel="noreferrer">{visitor.attachment_url}</a>
                    </div>
                  )}
                  {visitor.response_status && (
                    <div className="visitor-view-form-group">
                      <label>Response Status</label>
                      <p className="visitor-view-content-text">{visitor.response_status}</p>
                    </div>
                  )}
                </div>
              )}

              {visitor.remarks && (
                <div className="visitor-view-form-group">
                  <label>Remarks</label>
                  <p className="visitor-view-content-text">{visitor.remarks}</p>
                </div>
              )}

              <div className="visitor-view-note-meta-section">
                <div className="visitor-view-meta-item">
                  <span className="visitor-view-meta-label">Created On</span>
                  <span>{new Date(visitor.created_at).toLocaleString()}</span>
                </div>
                <div className="visitor-view-meta-item">
                  <span className="visitor-view-meta-label">Updated On</span>
                  <span>{new Date(visitor.updated_at).toLocaleString()}</span>
                </div>
              </div>
            </>
          </div>
        </div>
      </div>

    </div>
    </>
  );
};

export default VisitorView;
