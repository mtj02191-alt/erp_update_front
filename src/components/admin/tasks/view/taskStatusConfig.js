export const STATUS_BUTTON_CONFIG = {
  ASSIGNED: [
    { label: 'Start Working', action: 'START', color: 'primary' },
  ],
  IN_PROGRESS: [],
  COMPLETED: [
    { label: 'Submit for Approval', action: 'SUBMIT_APPROVAL', color: 'primary' },
  ],
  PENDING_APPROVAL: [
    { label: 'Approve', action: 'APPROVE', color: 'success' },
    { label: 'Reject', action: 'REJECT', color: 'danger' },
  ],
};

export const STATUS_TRANSITION_MAP = {
  START: 'in_progress',
  PAUSE: 'in_progress',
  COMPLETE: 'completed',
  BLOCK: 'blocked',
  REOPEN_IN_PROGRESS: 'in_progress',
  CLOSE: 'closed',
  REOPEN: 'open',
  SUBMIT_APPROVAL: 'pending_approval',
  APPROVE: 'approved',
  REJECT: 'rejected',
};

export const QUICK_ACTIONS = [
  { key: 'REASSIGN', label: 'Reassign task' },
  { key: 'CHANGE_DUE_DATE', label: 'Change due date' },
  { key: 'CHANGE_PRIORITY', label: 'Change priority' },
  // { key: 'ESCALATE', label: 'Escalate to manager' },
  { key: 'MOVE_PROJECT', label: 'Move to another project' },
  // { key: 'ADD_TAGS', label: 'Add tags / labels' },
  { key: 'GENERATE_REPORT', label: 'Generate report' },
];

export const QUICK_ACTION_LABEL_MAP = QUICK_ACTIONS.reduce((acc, item) => {
  acc[item.key] = item.label;
  return acc;
}, {});

const isSameDeptOrOrg = (context) => {
  const userDept = context.userDepartment;
  const taskDept = context.taskDepartment;
  const scope = context.permissions?.reportScope;
  if (!taskDept || !userDept) return true;
  if (userDept === taskDept) return true;
  if (scope === 'org' || scope === 'department' || scope === 'team') return true;
  return false;
};

const DEPARTMENT_QUICK_ACTION_RULES = {
  program: {
    allowed: [
      'REASSIGN',
      'CHANGE_DUE_DATE',
      'CHANGE_PRIORITY',
      // 'ESCALATE',
      'MOVE_PROJECT',
      // 'ADD_TAGS',
      'GENERATE_REPORT',
    ],
  },
  accounts_and_finance: {
    allowed: ['CHANGE_DUE_DATE', 'CHANGE_PRIORITY', 'GENERATE_REPORT'],
  },
};

const applyDepartmentQuickRules = (key, context, baseAllowed) => {
  if (!baseAllowed) return false;
  const dept = context.taskDepartment || context.userDepartment;
  if (!dept) return baseAllowed;
  const rules = DEPARTMENT_QUICK_ACTION_RULES[dept];
  if (!rules) return baseAllowed;
  if (rules.allowed && !rules.allowed.includes(key)) {
    return false;
  }
  if (rules.blocked && rules.blocked.includes(key)) {
    return false;
  }
  return baseAllowed;
};

export const isStatusActionAvailable = (action, context) => {
  const perms = context.permissions || {};
  const role = String(context.userRole || '').toLowerCase();
  const isAdminRole = role === 'super_admin' || role === 'admin';
  const isAssignee = context.isAssignee === true;
  const sameDeptOrOrg = isSameDeptOrOrg(context);
  const workflowRaw = String(context.workflowType || '').toUpperCase();
  const currentStatusRaw = String(context.currentStatus || '').toLowerCase();
  const approverIdsRaw = context.approvalRequiredUserIds;
  const approverIds = Array.isArray(approverIdsRaw)
    ? approverIdsRaw
        .map((v) => Number(v))
        .filter((v) => Number.isFinite(v) && v > 0)
    : [];
  const currentUserIdNum =
    context.currentUserId != null ? Number(context.currentUserId) : null;
  const isConfiguredApprover =
    currentUserIdNum != null && approverIds.length > 0
      ? approverIds.includes(currentUserIdNum)
      : false;
  const hasActedOnApproval =
    context.currentUserHasActedOnApproval === true;
  const approvalsMetaRaw = context.approvalsMeta;
  const approvalsMeta = Array.isArray(approvalsMetaRaw)
    ? approvalsMetaRaw
    : [];
  const currentApprovalMeta =
    currentUserIdNum != null
      ? approvalsMeta.find(
          (m) => m && Number(m.user_id) === Number(currentUserIdNum),
        )
      : null;
  const currentDecision = currentApprovalMeta
    ? String(currentApprovalMeta.decision || 'pending').toLowerCase()
    : 'pending';
  const allApprovalsCompleted =
    approverIds.length > 0 &&
    approverIds.every((idVal) => {
      const meta = approvalsMeta.find(
        (m) => m && Number(m.user_id) === Number(idVal),
      );
      if (!meta) return false;
      const decision = String(meta.decision || 'pending').toLowerCase();
      return decision === 'approved' || decision === 'rejected';
    });
  switch (action) {
    case 'START':
    case 'PAUSE':
    case 'BLOCK':
    case 'REOPEN':
    case 'REOPEN_IN_PROGRESS':
      return perms.canUpdate && sameDeptOrOrg;
    case 'COMPLETE':
      return (
        isAssignee &&
        !isAdminRole &&
        (perms.canUpdate || perms.canView) &&
        sameDeptOrOrg
      );
    case 'CLOSE':
      const isCreator = context.currentUserId != null && context.createdByUserId != null && Number(context.currentUserId) === Number(context.createdByUserId);
      const isReporter = context.currentUserId != null && context.reportedById != null && Number(context.currentUserId) === Number(context.reportedById);
      const isCreatorOrReporter = isCreator || isReporter;

      // If task is already approved or completed (in standard workflow), only creator/reporter can close it
      if (currentStatusRaw === 'approved' || (currentStatusRaw === 'completed' && workflowRaw !== 'APPROVAL_REQUIRED')) {
        return isCreatorOrReporter && sameDeptOrOrg;
      }

      if (workflowRaw === 'APPROVAL_REQUIRED') {
        // While in approval flow, allow closing only if all approvals are done AND user is creator/reporter
        if (allApprovalsCompleted) {
          return isCreatorOrReporter && sameDeptOrOrg;
        }
        // If not all approvals done, still only creator/reporter can close (if they have approve perms)
        return perms.canApprove === true && isCreatorOrReporter && sameDeptOrOrg;
      }
      
      return perms.canUpdate && isCreatorOrReporter && sameDeptOrOrg;
    case 'SUBMIT_APPROVAL':
      return isAssignee && (perms.canUpdate || perms.canView) && !isAdminRole;
    case 'APPROVE':
    case 'REJECT':
      if (currentStatusRaw === 'approved' || currentStatusRaw === 'closed') {
        return false;
      }
      if (approverIds.length === 0) return false;
      if (!isConfiguredApprover) return false;
      if (hasActedOnApproval) return false;
      if (currentDecision === 'approved' || currentDecision === 'rejected') {
        return false;
      }
      return true;
    default:
      return true;
  }
};

export const isQuickActionAvailable = (key, context) => {
  const perms = context.permissions || {};
  const sameDeptOrOrg = isSameDeptOrOrg(context);
  const statusRaw = String(context.currentStatus || '').toLowerCase();
  const canReassignForStatus = (() => {
    if (!statusRaw) return false;
    if (
      [
        'draft',
        'open',
        'in_progress',
        'in progress',
        'rejected',
      ].includes(statusRaw)
    ) {
      return true;
    }
    return false;
  })();
  let baseAllowed = true;
  switch (key) {
    case 'REASSIGN':
      baseAllowed = perms.canAssign && sameDeptOrOrg && canReassignForStatus;
      break;
    case 'CHANGE_DUE_DATE':
    case 'CHANGE_PRIORITY':
    case 'MOVE_PROJECT':
      baseAllowed = perms.canUpdate && sameDeptOrOrg;
      break;
    case 'ESCALATE':
      baseAllowed = perms.canUpdate || perms.canComplete;
      break;
    case 'ADD_TAGS':
      baseAllowed = perms.canUpdate || perms.canCreate;
      break;
    case 'GENERATE_REPORT':
      baseAllowed = perms.canView;
      break;
    default:
      baseAllowed = true;
      break;
  }
  return applyDepartmentQuickRules(key, context, baseAllowed);
};

