import React, { useMemo, useState } from 'react';
import {
  STATUS_BUTTON_CONFIG,
  QUICK_ACTIONS,
  isStatusActionAvailable,
  isQuickActionAvailable,
} from './taskStatusConfig';

const TaskActionBar = ({
  taskId,
  currentStatus,
  permissions,
  userDepartment,
  taskDepartment,
  workflowType,
  onStatusAction,
  onQuickAction,
  disabled,
  align = 'top',
  userRole,
  isAssignee,
  currentUserId,
  createdByUserId,
  reportedById,
  approvalRequiredUserIds,
  approvalsMeta,
  currentUserHasActedOnApproval,
  approvalLoading = false,
}) => {
  const [isQuickOpen, setIsQuickOpen] = useState(false);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

  const canApprove = permissions?.canApprove;
  const normalizedStatus = useMemo(
    () => String(currentStatus || '').toUpperCase(),
    [currentStatus],
  );

  const normalizedWorkflow = useMemo(
    () => String(workflowType || '').toUpperCase(),
    [workflowType],
  );

  const availabilityContext = useMemo(
    () => ({
      permissions,
      userDepartment,
      taskDepartment,
      userRole,
      isAssignee,
      workflowType: normalizedWorkflow,
      currentStatus: normalizedStatus,
      currentUserId,
      createdByUserId,
      reportedById,
      approvalRequiredUserIds,
      approvalsMeta,
      currentUserHasActedOnApproval,
    }),
    [
      permissions,
      userDepartment,
      taskDepartment,
      userRole,
      isAssignee,
      normalizedWorkflow,
      normalizedStatus,
      currentUserId,
      createdByUserId,
      reportedById,
      approvalRequiredUserIds,
      approvalsMeta,
      currentUserHasActedOnApproval,
    ],
  );

  const availableButtons = useMemo(() => {
    // Don't show any buttons while approval data is loading (prevents blinking)
    if (approvalLoading) {
      return [];
    }
    const rawRole = String(userRole || '').toLowerCase();
    const isAdminRole = rawRole === 'super_admin' || rawRole === 'admin';
    const isAssigneeUser = isAssignee === true;
    const approverIds = Array.isArray(approvalRequiredUserIds)
      ? approvalRequiredUserIds.map((v) => Number(v)).filter((v) => Number.isFinite(v) && v > 0)
      : [];
    const isConfiguredApprover = currentUserId != null && approverIds.includes(Number(currentUserId));

    let baseButtons = STATUS_BUTTON_CONFIG[normalizedStatus] || [];

    if (normalizedStatus === 'COMPLETED') {
      if (normalizedWorkflow === 'APPROVAL_REQUIRED') {
        if (isAssigneeUser && !isAdminRole) {
          baseButtons = [
            {
              label: 'Submit for Approval',
              action: 'SUBMIT_APPROVAL',
              color: 'primary',
            },
          ];
        } else {
          baseButtons = [];
        }
      } else {
        // For standard workflow, creator/reporter can close a completed task
        const isCreator = Number(currentUserId) === Number(createdByUserId);
        const isReporter = Number(currentUserId) === Number(reportedById);
        if (isCreator || isReporter) {
          baseButtons = [{ label: 'Close Task', action: 'CLOSE', color: 'danger' }];
        } else {
          baseButtons = [];
        }
      }
    } else if (normalizedStatus === 'APPROVED') {
      const isCreator = Number(currentUserId) === Number(createdByUserId);
      const isReporter = Number(currentUserId) === Number(reportedById);
      if (isCreator || isReporter) {
        baseButtons = [{ label: 'Close Task', action: 'CLOSE', color: 'danger' }];
      } else {
        baseButtons = [];
      }
    } else if (
      normalizedStatus === 'REJECTED' &&
      normalizedWorkflow === 'APPROVAL_REQUIRED'
    ) {
      baseButtons = STATUS_BUTTON_CONFIG.PENDING_APPROVAL || [];
    }

    if (normalizedStatus === 'PENDING_APPROVAL' && !canApprove && !isConfiguredApprover) {
      return [];
    }

    return baseButtons.filter((btn) =>
      isStatusActionAvailable(btn.action, availabilityContext),
    );
  }, [normalizedStatus, normalizedWorkflow, canApprove, availabilityContext, approvalLoading]);

  const visibleQuickActions = useMemo(
    () =>
      QUICK_ACTIONS.filter((item) =>
        isQuickActionAvailable(item.key, availabilityContext),
      ),
    [availabilityContext],
  );

  const reassignLabel = useMemo(() => {
    const cfg = QUICK_ACTIONS.find((q) => q.key === 'REASSIGN');
    return cfg ? cfg.label : 'Reassign task';
  }, []);

  const disabledReassignTooltip = useMemo(() => {
    const perms = availabilityContext.permissions || {};
    const sameDept =
      availabilityContext.userDepartment &&
      availabilityContext.taskDepartment &&
      String(availabilityContext.userDepartment) ===
        String(availabilityContext.taskDepartment);
    const statusLower = String(currentStatus || '').toLowerCase();
    const allowedStatuses = [
      'draft',
      'open',
      'in_progress',
      'in progress',
      'rejected',
    ];
    const isStatusAllowed = allowedStatuses.includes(statusLower);
    const hasReassignAction = QUICK_ACTIONS.some(
      (q) => q.key === 'REASSIGN',
    );
    const reassignVisible = visibleQuickActions.some(
      (q) => q.key === 'REASSIGN',
    );
    if (
      hasReassignAction &&
      !reassignVisible &&
      perms.canAssign &&
      sameDept &&
      !isStatusAllowed
    ) {
      return 'Reassign is only available when status is Draft, Open, In Progress, or Rejected.';
    }
    return '';
  }, [availabilityContext, currentStatus, visibleQuickActions]);

  const handleStatusClick = (action) => {
    if (disabled || !onStatusAction) return;
    onStatusAction(action);
    setIsQuickOpen(false);
    setIsFabMenuOpen(false);
  };

  const handleQuickClick = (key) => {
    if (disabled) return;
    if (onQuickAction) {
      onQuickAction(key);
    }
    setIsQuickOpen(false);
    setIsFabMenuOpen(false);
  };

  const hasAnyActions =
    availableButtons.length > 0 || visibleQuickActions.length > 0;
  if (!hasAnyActions) {
    return null;
  }

  const containerClass =
    align === 'bottom'
      ? 'task-action-bar-container task-action-bar-container--bottom'
      : 'task-action-bar-container';

  return (
    <div className={containerClass}>
      <div className="task-action-bar">
        <div className="task-action-bar-primary">
          {availableButtons.map((btn) => (
            <button
              key={btn.action}
              type="button"
              className={`task-action-button task-action-button--${btn.color}`}
              onClick={() => handleStatusClick(btn.action)}
              disabled={disabled}
            >
              {btn.label}
            </button>
          ))}
        </div>
        <div className="task-action-bar-secondary">
          <button
            type="button"
            className="task-action-quick-toggle"
            onClick={() => setIsQuickOpen((prev) => !prev)}
            disabled={disabled}
            aria-haspopup="true"
            aria-expanded={isQuickOpen}
          >
            Quick Actions
          </button>
          {isQuickOpen && (
            <div className="task-action-quick-menu">
              {visibleQuickActions.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className="task-action-quick-item"
                  onClick={() => handleQuickClick(item.key)}
                  disabled={disabled}
                >
                  {item.label}
                </button>
              ))}
              {disabledReassignTooltip && (
                <button
                  type="button"
                  className="task-action-quick-item"
                  disabled
                  title={disabledReassignTooltip}
                >
                  {reassignLabel}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        className="task-action-fab"
        aria-label="Task actions"
        onClick={() => setIsFabMenuOpen((prev) => !prev)}
        disabled={disabled}
      >
        ⋮
      </button>

      {isFabMenuOpen && (
        <div className="task-action-fab-menu">
          <div className="task-action-fab-section">
            {availableButtons.map((btn) => (
              <button
                key={btn.action}
                type="button"
                className={`task-action-button task-action-button--${btn.color}`}
                onClick={() => handleStatusClick(btn.action)}
                disabled={disabled}
              >
                {btn.label}
              </button>
            ))}
          </div>
          <div className="task-action-fab-section">
            {visibleQuickActions.map((item) => (
              <button
                key={item.key}
                type="button"
                className="task-action-quick-item"
                onClick={() => handleQuickClick(item.key)}
                disabled={disabled}
              >
                {item.label}
              </button>
            ))}
            {disabledReassignTooltip && (
              <button
                type="button"
                className="task-action-quick-item"
                disabled
                title={disabledReassignTooltip}
              >
                {reassignLabel}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskActionBar;
