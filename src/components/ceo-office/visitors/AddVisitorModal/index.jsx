import React from 'react';
import './index.css';

const AddVisitorModal = ({ 
  isOpen, 
  onClose, 
  formData, 
  setFormData, 
  onSubmit 
}) => {
  if (!isOpen) return null;

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

  const getStatusOptions = () => {
    switch (formData.type) {
      case 'visitor':
        return ['Pending', 'Waiting', 'Completed', 'Cancelled'];
      case 'call':
        return ['Pending', 'Follow-up Required', 'Completed', 'Cancelled'];
      case 'whatsapp':
        return ['Pending Reply', 'Replied', 'Waiting Response', 'Closed'];
      default:
        return ['Pending'];
    }
  };

  return (
    <div className="visitors-modal-overlay">
      <div className="visitors-modal-content">
        <div className="visitors-modal-header">
          <h2>Log Visitor / Call / WhatsApp</h2>
          <button onClick={onClose} className="visitors-close-btn">
            ×
          </button>
        </div>
        <div className="visitors-modal-body">
          <form onSubmit={onSubmit}>
            {/* Common Fields */}
            <div className="visitors-form-group">
              <label>Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="visitors-form-control"
              >
                <option value="visitor">Visitor</option>
                <option value="call">Call</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>

            <div className="visitors-form-group">
              <label>Date & Time *</label>
              <input
                type="datetime-local"
                value={formData.visitDatetime}
                onChange={(e) => setFormData(prev => ({ ...prev, visitDatetime: e.target.value }))}
                required
                className="visitors-form-control"
              />
            </div>

            {/* Type-Specific Fields */}
            {formData.type === 'visitor' && (
              <>
                <div className="visitors-form-group">
                  <label>Visitor Name *</label>
                  <input
                    type="text"
                    value={formData.visitorName}
                    onChange={(e) => setFormData(prev => ({ ...prev, visitorName: e.target.value }))}
                    required
                    className="visitors-form-control"
                  />
                </div>
                <div className="visitors-form-group">
                  <label>Organization</label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                    className="visitors-form-control"
                  />
                </div>
                <div className="visitors-form-group">
                  <label>Purpose *</label>
                  <textarea
                    value={formData.purpose}
                    onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                    rows={2}
                    required
                    className="visitors-form-control"
                  />
                </div>
                <div className="visitors-form-group">
                  <label>Meeting With</label>
                  <input
                    type="text"
                    value={formData.meetingWith}
                    onChange={(e) => setFormData(prev => ({ ...prev, meetingWith: e.target.value }))}
                    className="visitors-form-control"
                  />
                </div>
                <div className="visitors-form-group">
                  <label>Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    className="visitors-form-control"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="visitors-form-group">
                  <label>Protocol Required</label>
                  <select
                    value={formData.protocolRequired}
                    onChange={(e) => setFormData(prev => ({ ...prev, protocolRequired: e.target.value }))}
                    className="visitors-form-control"
                  >
                    <option value="">Select</option>
                    <option value="Normal">Normal</option>
                    <option value="VIP">VIP</option>
                    <option value="CEO Meeting">CEO Meeting</option>
                    <option value="Confidential">Confidential</option>
                  </select>
                </div>
                <div className="visitors-form-group">
                  <label>Expected Duration</label>
                  <input
                    type="text"
                    value={formData.expectedDuration}
                    onChange={(e) => setFormData(prev => ({ ...prev, expectedDuration: e.target.value }))}
                    placeholder="e.g. 30 mins"
                    className="visitors-form-control"
                  />
                </div>
                <div className="visitors-form-group">
                  <label>Visitor Outcome</label>
                  <select
                    value={formData.visitorOutcome}
                    onChange={(e) => setFormData(prev => ({ ...prev, visitorOutcome: e.target.value }))}
                    className="visitors-form-control"
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
                <div className="visitors-form-group">
                  <label>Caller Name *</label>
                  <input
                    type="text"
                    value={formData.callerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, callerName: e.target.value }))}
                    required
                    className="visitors-form-control"
                  />
                </div>
                <div className="visitors-form-group">
                  <label>Organization</label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                    className="visitors-form-control"
                  />
                </div>
                <div className="visitors-form-group">
                  <label>Phone Number *</label>
                  <input
                    type="text"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    required
                    className="visitors-form-control"
                  />
                </div>
                <div className="visitors-form-group">
                  <label>Call Purpose</label>
                  <textarea
                    value={formData.callPurpose}
                    onChange={(e) => setFormData(prev => ({ ...prev, callPurpose: e.target.value }))}
                    rows={2}
                    className="visitors-form-control"
                  />
                </div>
                <div className="visitors-form-group">
                  <label>Call Summary</label>
                  <textarea
                    value={formData.callSummary}
                    onChange={(e) => setFormData(prev => ({ ...prev, callSummary: e.target.value }))}
                    rows={2}
                    className="visitors-form-control"
                  />
                </div>
                <div className="visitors-form-group">
                  <label>Follow-up Required</label>
                  <select
                    value={formData.followUpRequired}
                    onChange={(e) => setFormData(prev => ({ ...prev, followUpRequired: e.target.value }))}
                    className="visitors-form-control"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                {formData.followUpRequired === 'Yes' && (
                  <>
                    <div className="visitors-form-group">
                      <label>Follow-up Date</label>
                      <input
                        type="datetime-local"
                        value={formData.followUpDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, followUpDate: e.target.value }))}
                        className="visitors-form-control"
                      />
                    </div>
                    <div className="visitors-form-group">
                      <label>Assigned To</label>
                      <input
                        type="text"
                        value={formData.assignedTo}
                        onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                        className="visitors-form-control"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {formData.type === 'whatsapp' && (
              <>
                <div className="visitors-form-group">
                  <label>Contact Name *</label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                    required
                    className="visitors-form-control"
                  />
                </div>
                <div className="visitors-form-group">
                  <label>Phone Number *</label>
                  <input
                    type="text"
                    value={formData.whatsappPhoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, whatsappPhoneNumber: e.target.value }))}
                    required
                    className="visitors-form-control"
                  />
                </div>
                <div className="visitors-form-group">
                  <label>Message Summary</label>
                  <textarea
                    value={formData.messageSummary}
                    onChange={(e) => setFormData(prev => ({ ...prev, messageSummary: e.target.value }))}
                    rows={2}
                    className="visitors-form-control"
                  />
                </div>
                <div className="visitors-form-group">
                  <label>Required Action</label>
                  <textarea
                    value={formData.requiredAction}
                    onChange={(e) => setFormData(prev => ({ ...prev, requiredAction: e.target.value }))}
                    rows={2}
                    className="visitors-form-control"
                  />
                </div>
                <div className="visitors-form-group">
                  <label>Attachment URL</label>
                  <input
                    type="text"
                    value={formData.attachmentUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, attachmentUrl: e.target.value }))}
                    className="visitors-form-control"
                  />
                </div>
                <div className="visitors-form-group">
                  <label>Response Status</label>
                  <select
                    value={formData.responseStatus}
                    onChange={(e) => setFormData(prev => ({ ...prev, responseStatus: e.target.value }))}
                    className="visitors-form-control"
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

            {/* Common Fields (continued) */}
            {/* <div className="visitors-form-group">
              <label>Related Note ID</label>
              <input
                type="number"
                value={formData.relatedNoteId}
                onChange={(e) => setFormData(prev => ({ ...prev, relatedNoteId: e.target.value }))}
                className="visitors-form-control"
              />
            </div> */}

            <div className="visitors-form-group">
              <label>Remarks</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                rows={2}
                className="visitors-form-control"
              />
            </div>

            <div className="visitors-form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="visitors-form-control"
              >
                {getStatusOptions().map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="visitors-modal-footer">
              <button type="button" onClick={onClose} className="visitors-btn-secondary">
                Cancel
              </button>
              <button type="submit" className="visitors-btn-primary">
                Log
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddVisitorModal;
