import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import { toast } from 'react-toastify';
import PrimaryButton from '../../../common/buttons/primary';
import FormInput from '../../../common/FormInput';
import FormTextarea from '../../../common/FormTextarea';
import {
  QUICK_ACTION_LABEL_MAP,
} from './taskStatusConfig';
import SearchableMultiSelect from '../../../common/SearchableMultiSelect';

const QuickActionModal = ({
  isOpen,
  taskId,
  actionKey,
  onClose,
  onCompleted,
  userDepartment,
  taskRouteBase = '/tasks',
}) => {
  const [formState, setFormState] = useState({
    assignee: '',
    dueDate: '',
    priority: '',
    // escalationNotes: '',
    project: '',
    // tags: '',
  });
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const navigate = useNavigate();

  if (!isOpen || !actionKey) {
    return null;
  }

  const handleChange = (name, value) => {
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taskId) return;
    setLoading(true);
    try {
      let updated = null;
      if (actionKey === 'REASSIGN') {
        if (!Array.isArray(selectedUsers) || selectedUsers.length === 0) {
          toast.error('Please select at least one user');
          setLoading(false);
          return;
        }
        const ids = selectedUsers
          .map((u) => Number(u.id))
          .filter((n) => Number.isInteger(n) && n > 0);
        if (ids.length === 0) {
          toast.error('Please select at least one valid user');
          setLoading(false);
          return;
        }
        const meta = selectedUsers.map((u) => ({
          user_id: Number(u.id),
          department: u.department || userDepartment || '',
        }));
        const primary = selectedUsers[0];
        const name =
          (`${primary.first_name || ''} ${primary.last_name || ''}`).trim() ||
          primary.email ||
          `User #${primary.id}`;
        const res = await axiosInstance.post(`/tasks/${taskId}/reassign`, {
          assignee_name: name,
          assigned_users: ids,
          assigned_users_meta: meta,
        });
        updated = res.data?.data || null;
      } else if (
        actionKey === 'CHANGE_DUE_DATE' ||
        actionKey === 'CHANGE_PRIORITY' ||
        actionKey === 'MOVE_PROJECT'
      ) {
        const payload = {};
        if (actionKey === 'CHANGE_DUE_DATE') {
          payload.due_date = formState.dueDate || null;
        }
        if (actionKey === 'CHANGE_PRIORITY') {
          payload.priority = formState.priority || null;
        }
        if (actionKey === 'MOVE_PROJECT') {
          payload.project_name = formState.project || null;
        }
        await axiosInstance.patch(`/tasks/${taskId}`, payload);
      } else if (actionKey === 'ESCALATE') {
        const content =
          formState.escalationNotes && formState.escalationNotes.trim().length > 0
            ? `Escalation: ${formState.escalationNotes.trim()}`
            : 'Escalation requested.';
        await axiosInstance.post(`/tasks/${taskId}/comments`, {
          content,
        });
      } else if (actionKey === 'ADD_TAGS') {
        const content =
          formState.tags && formState.tags.trim().length > 0
            ? `Tags updated: ${formState.tags.trim()}`
            : 'Tags updated.';
        await axiosInstance.post(`/tasks/${taskId}/comments`, {
          content,
        });
      }
      if (!updated) {
        try {
          const refreshed = await axiosInstance.get(`/tasks/${taskId}`);
          updated = refreshed.data?.data || null;
        } catch (refreshError) {
        }
      }
      if (onCompleted) {
        onCompleted(actionKey, updated);
      }
      const label = QUICK_ACTION_LABEL_MAP[actionKey] || 'Action';
      toast.success(`${label} submitted`);
      if (actionKey === 'GENERATE_REPORT' && taskId) {
        navigate(`${taskRouteBase}/receipt/${taskId}`);
      }
      onClose();
    } catch (e2) {
      const msg =
        e2.response?.data?.message || 'Failed to submit action.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const title = QUICK_ACTION_LABEL_MAP[actionKey] || 'Task action';
  const submitLabel = QUICK_ACTION_LABEL_MAP[actionKey] || 'Submit';
  const submitLoadingText =
    actionKey === 'GENERATE_REPORT' ? 'Generating...' : 'Submitting...';

  const showAssignee = actionKey === 'REASSIGN';
  const showDueDate = actionKey === 'CHANGE_DUE_DATE';
  const showPriority = actionKey === 'CHANGE_PRIORITY';
  const showEscalate = actionKey === 'ESCALATE';
  const showProject = actionKey === 'MOVE_PROJECT';
  const showTags = actionKey === 'ADD_TAGS';
  const showReport = actionKey === 'GENERATE_REPORT';

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
            {showAssignee && (
              <SearchableMultiSelect
                label="Assign users"
                apiEndpoint="/users/options"
                apiParams={{ active: true }}
                onSelect={(users) => setSelectedUsers(users)}
                onClear={() => setSelectedUsers([])}
                value={selectedUsers}
                displayKey="first_name"
                valueKey="id"
                allowResearch={true}
                debounceDelay={500}
                minSearchLength={2}
                disabled={loading}
                renderOption={(user) => (
                    <div className="assign-user-option">
                      <div className="assign-user-name">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="assign-user-email">
                        {user.email}
                      </div>
                      {user.department && (
                        <div className="assign-user-meta">
                          {user.department} • {user.role || 'User'}
                        </div>
                      )}
                    </div>
                  )}
                  placeholder="Select users to assign"
              />
            )}
            {showDueDate && (
              <FormInput
                name="dueDate"
                label="New due date"
                type="date"
                value={formState.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
              />
            )}
            {showPriority && (
              <div className="form-group">
                <label className="form-label">
                  Priority
                </label>
                <select
                  className="form-input"
                  value={formState.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                >
                  <option value="">
                    Select priority
                  </option>
                  <option value="low">
                    Low
                  </option>
                  <option value="medium">
                    Medium
                  </option>
                  <option value="high">
                    High
                  </option>
                  <option value="urgent">
                    Urgent
                  </option>
                </select>
              </div>
            )}
            {/* {showEscalate && (
              <FormTextarea
                name="escalationNotes"
                label="Escalation notes"
                value={formState.escalationNotes}
                onChange={(e) => handleChange('escalationNotes', e.target.value)}
                rows={3}
                placeholder="Describe why this task needs escalation"
              />
            )} */}
            {showProject && (
              <FormInput
                name="project"
                label="New project"
                value={formState.project}
                onChange={(e) => handleChange('project', e.target.value)}
                placeholder="Enter project name"
              />
            )}
            {/* {showTags && (
              <FormInput
                name="tags"
                label="Tags"
                value={formState.tags}
                onChange={(e) => handleChange('tags', e.target.value)}
                placeholder="Comma-separated tags"
              />
            )} */}
            {showReport && (
              <div className="form-group">
                <p className="form-label">
                  This will generate a printable task report.
                </p>
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
              type="submit"
              disabled={loading}
              loading={loading}
              loadingText={submitLoadingText}
            >
              {submitLabel}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickActionModal;
