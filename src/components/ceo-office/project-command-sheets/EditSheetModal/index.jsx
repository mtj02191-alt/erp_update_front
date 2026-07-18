import React from 'react';
import '../ModalStyles/index.css';

const EditSheetModal = ({ 
  isOpen, 
  onClose, 
  formData, 
  setFormData, 
  onSubmit 
}) => {
  if (!isOpen) return null;

  return (
    <div className="pcs-modal-overlay">
      <div className="pcs-modal-content">
        <div className="pcs-modal-header">
          <h2>Edit Project Command Sheet</h2>
          <button onClick={onClose} className="pcs-close-btn">
            ×
          </button>
        </div>
        <div className="pcs-modal-body">
          <form onSubmit={onSubmit}>
            <div className="pcs-form-group">
              <label className="pcs-form-label">Project Name *</label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                required
                className="pcs-form-control"
              />
            </div>
            <div className="pcs-form-group">
              <label className="pcs-form-label">Project Details</label>
              <textarea
                value={formData.projectDetails}
                onChange={(e) => setFormData({ ...formData, projectDetails: e.target.value })}
                rows={3}
                className="pcs-form-control"
              />
            </div>
            <div className="pcs-form-group">
              <label className="pcs-form-label">Discussions</label>
              <textarea
                value={formData.discussions}
                onChange={(e) => setFormData({ ...formData, discussions: e.target.value })}
                rows={3}
                className="pcs-form-control"
              />
            </div>
            <div className="pcs-form-group">
              <label className="pcs-form-label">Decisions</label>
              <textarea
                value={formData.decisions}
                onChange={(e) => setFormData({ ...formData, decisions: e.target.value })}
                rows={3}
                className="pcs-form-control"
              />
            </div>
            <div className="pcs-form-group">
              <label className="pcs-form-label">Meeting Notes</label>
              <textarea
                value={formData.meetingNotes}
                onChange={(e) => setFormData({ ...formData, meetingNotes: e.target.value })}
                rows={3}
                className="pcs-form-control"
              />
            </div>
            <div className="pcs-form-row">
              <div className="pcs-form-group">
                <label className="pcs-form-label">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="pcs-form-control"
                />
              </div>
              <div className="pcs-form-group">
                <label className="pcs-form-label">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="pcs-form-control"
                />
              </div>
            </div>
            <div className="pcs-form-group">
              <label className="pcs-form-label">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="pcs-form-control"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div className="pcs-form-group">
              <label className="pcs-form-label">Next Steps</label>
              <textarea
                value={formData.nextSteps}
                onChange={(e) => setFormData({ ...formData, nextSteps: e.target.value })}
                rows={3}
                className="pcs-form-control"
              />
            </div>
            <div className="pcs-form-group">
              <label className="pcs-form-label">Results</label>
              <textarea
                value={formData.results}
                onChange={(e) => setFormData({ ...formData, results: e.target.value })}
                rows={3}
                className="pcs-form-control"
              />
            </div>
            <div className="pcs-modal-footer">
              <button type="button" onClick={onClose} className="pcs-btn-secondary">
                Cancel
              </button>
              <button type="submit" className="pcs-btn-primary">
                Update
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditSheetModal;
