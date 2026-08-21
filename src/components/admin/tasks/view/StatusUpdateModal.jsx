import React, { useState } from 'react';
import PrimaryButton from '../../../common/buttons/primary';
import axiosInstance from '../../../../utils/axios';
import { toast } from 'react-toastify';
import { STATUS_TRANSITION_MAP } from './taskStatusConfig';

const StatusUpdateModal = ({
  isOpen,
  taskId,
  action,
  onClose,
  onUpdated,
}) => {
  console.log('StatusUpdateModal props:', { isOpen, taskId, action });
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !action) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taskId) return;
    const requiresNote =
      action === 'APPROVE' || action === 'REJECT' || action === 'SUBMIT_APPROVAL';
    if (requiresNote && !notes.trim()) {
      toast.error('Please enter a note for this action.');
      return;
    }
    setLoading(true);
    try {
      if (action === 'APPROVE' || action === 'REJECT') {
        const approve = action === 'APPROVE';
        const res = await axiosInstance.post(
          `/tasks/${taskId}/approve`,
          {
            approve,
            note: notes,
          },
        );
        if (onUpdated) {
          onUpdated(res.data?.data || null);
        }
        toast.success(approve ? 'Task approved' : 'Task rejected');
      } else {
        const status = STATUS_TRANSITION_MAP[action];
        if (!status) {
          toast.error('Unsupported status action.');
          return;
        }
        const res = await axiosInstance.post(`/tasks/${taskId}/status-transition`, {
          status,
          notes,
        });
        if (onUpdated) {
          onUpdated(res.data?.data || null);
        }
        toast.success('Task status updated');
      }
      setNotes('');
      onClose();
    } catch (e2) {
      const responseData = e2.response?.data;
      const responseMessage = responseData?.message;
      const incompleteCount = responseData?.incomplete_assignee_count
        || responseMessage?.incomplete_assignee_count;
      const confirmationCode = responseData?.code || responseMessage?.code;
      if (
        action === 'COMPLETE' &&
        confirmationCode === 'INCOMPLETE_MOV_CONFIRMATION_REQUIRED'
      ) {
        const count = Number(incompleteCount) || 0;
        const confirmed = window.confirm(
          `${count} assignees still have incomplete MOVs. Do you want to mark this task as Completed anyway?`,
        );
        if (confirmed) {
          try {
            const res = await axiosInstance.post(`/tasks/${taskId}/status-transition`, {
              status: 'completed',
              notes,
              force_complete: true,
            });
            onUpdated?.(res.data?.data || null);
            toast.success('Task marked as completed');
            setNotes('');
            onClose();
          } catch (forceError) {
            toast.error(forceError.response?.data?.message || 'Failed to complete task.');
          }
        }
        return;
      }
      const msg =
        responseMessage ||
        'Failed to update status.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const labelMap = {
    START: 'Start Working',
    PAUSE: 'Pause Task',
    COMPLETE: 'Complete Task',
    BLOCK: 'Mark as Blocked',
    REOPEN: 'Reopen Task',
    REOPEN_IN_PROGRESS: 'Reopen Task',
    CLOSE: 'Close Task',
    SUBMIT_APPROVAL: 'Submit for Approval',
    APPROVE: 'Approve Task',
    REJECT: 'Reject Task',
  };

  const title = labelMap[action] || 'Update Status';
  const showNoteField =
    action === 'APPROVE' || action === 'REJECT' || action === 'SUBMIT_APPROVAL';

  return (
    <div className="status-modal-backdrop" role="dialog" aria-modal="true">
      <div className="status-modal">
        <div className="status-modal-header">
          <h3 className="status-modal-title">
            {title}
          </h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="status-modal-body">
            <p className="status-modal-text">
              This will update the task status. Do you want to continue?
            </p>
            {showNoteField && (
              <div className="form-group">
                {/* <label className="form-label">
                  Note
                </label> */}
                <textarea
                  className="form-input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add a note for this action"
                  rows={3}
                  disabled={loading}
                />
              </div>
            )}
          </div>
          <div className="status-modal-footer">
            <button
              type="button"
              className="task-status-modal-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <PrimaryButton
              style={{ color: '#ffffff' }}
              type="submit"
              disabled={loading}
              loading={loading}
              loadingText="Saving..."
            >
              Confirm
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StatusUpdateModal;
