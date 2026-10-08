/**
 * Permission utility functions for checking user permissions
 * Based on the permission structure: department.module.action
 */

/**
 * Check if user has a specific permission
 * @param {Object} permissions - User permissions object
 * @param {string} department - Department name
 * @param {string} module - Module name
 * @param {string} action - Action name (view, create, update, delete, list_view)
 * @returns {boolean} - Whether user has the permission
 */
export const hasPermission = (permissions, department, module, action) => {
  if (!permissions || !department || !module || !action) {
    return false;
  }
  
  return permissions[department]?.[module]?.[action] === true;
};

/**
 * Check if user has any permission for a specific module
 * @param {Object} permissions - User permissions object
 * @param {string} department - Department name
 * @param {string} module - Module name
 * @returns {boolean} - Whether user has any permission for the module
 */
export const hasModuleAccess = (permissions, department, module) => {
  if (!permissions || !department || !module) {
    return false;
  }
  
  const modulePermissions = permissions[department]?.[module];
  if (!modulePermissions) {
    return false;
  }
  
  // Check if user has any permission (view, create, update, delete, list_view)
  return Object.values(modulePermissions).some(permission => permission === true);
};

/**
 * Check if user has access to a department
 * @param {Object} permissions - User permissions object
 * @param {string} department - Department name
 * @returns {boolean} - Whether user has access to the department
 */
export const hasDepartmentAccess = (permissions, department) => {
  if (!permissions || !department) {
    return false;
  }
  
  const departmentPermissions = permissions[department];
  if (!departmentPermissions) {
    return false;
  }
  
  // Check if department has any modules with permissions
  return Object.keys(departmentPermissions).length > 0;
};

/**
 * Check if user has list_view permission for a module (for sidebar display)
 * @param {Object} permissions - User permissions object
 * @param {string} department - Department name
 * @param {string} module - Module name
 * @returns {boolean} - Whether user can see the module in sidebar
 */
export const canViewModule = (permissions, department, module) => {
  if (!permissions || !department || !module) {
    return false;
  }

  // Super admin / FR manager: all fund_raising modules visible in sidebar
  if (permissions.super_admin === true) {
    return true;
  }
  if (
    department === 'fund_raising' &&
    (permissions.fund_raising_manager === true ||
      permissions.fund_raising?.manager === true)
  ) {
    return true;
  }

  // Recurring reminder logs: own flags, or recurring donations list/view
  if (department === 'fund_raising' && module === 'recurring_reminder_logs') {
    const fr = permissions[department];
    if (!fr) return false;
    const specific = fr.recurring_reminder_logs;
    if (specific?.view === true || specific?.list_view === true) return true;
    const recurring = fr.recurring_donations;
    return recurring?.view === true || recurring?.list_view === true;
  }

  // CSR donors / CSR POCs share access in sidebar when either submodule is granted
  if (
    department === 'fund_raising' &&
    (module === 'organizations' || module === 'csr_pocs')
  ) {
    const fr = permissions[department];
    if (!fr) return false;
    const specific = fr[module];
    if (specific?.view === true || specific?.list_view === true) return true;
    const siblingKey = module === 'organizations' ? 'csr_pocs' : 'organizations';
    const sibling = fr[siblingKey];
    return sibling?.view === true || sibling?.list_view === true;
  }

  // Unified donors (fund_raising): allow sidebar if new or legacy donor module flags exist
  if (department === 'fund_raising' && (module === 'donors' || module === 'online_donors' || module === 'offline_donors')) {
    const fr = permissions[department];
    if (!fr) return false;
    const specific = fr[module];
    if (specific?.view === true || specific?.list_view === true) return true;
    // Legacy unified `donors` grants both online and offline sidebar items
    if (module !== 'donors') {
      const donors = fr.donors;
      if (donors?.view === true || donors?.list_view === true) return true;
    }
    if (module === 'donors') {
      const online = fr.online_donors;
      const offline = fr.offline_donors;
      return (
        online?.view === true ||
        online?.list_view === true ||
        offline?.view === true ||
        offline?.list_view === true
      );
    }
    return false;
  }

  // Communication sidebar section uses id `email_templates` but permissions live under `communication`
  if (department === 'email_templates') {
    const comm = permissions.communication;
    if (!comm) return false;
    const modulePermissions = comm[module];
    if (!modulePermissions) return false;
    return modulePermissions.view === true || modulePermissions.list_view === true;
  }

  const modulePermissions = permissions[department]?.[module];
  if (!modulePermissions) {
    return false;
  }

  // User can view module if they have view or list_view permission
  return modulePermissions.view === true || modulePermissions.list_view === true;
};

/**
 * True if fund_raising donor permissions grant `action` (unified `donors` or legacy online/offline donor keys).
 */
export const fundRaisingDonorsHas = (permissions, action) => {
  if (!permissions?.fund_raising || !action) {
    return false;
  }
  const fr = permissions.fund_raising;
  return (
    fr.donors?.[action] === true ||
    fr.online_donors?.[action] === true ||
    fr.offline_donors?.[action] === true
  );
};

/**
 * True if CSR Donor (organizations) or CSR POC permissions grant `action`.
 */
export const fundRaisingOrganizationsOrPocsHas = (permissions, action) => {
  if (!permissions?.fund_raising || !action) {
    return false;
  }
  const fr = permissions.fund_raising;
  return (
    fr.organizations?.[action] === true || fr.csr_pocs?.[action] === true
  );
};

/**
 * Check if user is super admin
 * @param {Object} permissions - User permissions object
 * @returns {boolean} - Whether user is super admin
 */
export const isSuperAdmin = (permissions) => {
  if (!permissions) return false;
  return permissions.super_admin === true || (permissions.super_admin && typeof permissions.super_admin === 'object' && permissions.super_admin.super_admin === true);
};

/**
 * Get all modules user has access to in a department
 * @param {Object} permissions - User permissions object
 * @param {string} department - Department name
 * @returns {Array} - Array of module names user can access
 */
export const getAccessibleModules = (permissions, department) => {
  if (!permissions || !department) {
    return [];
  }
  
  const departmentPermissions = permissions[department];
  if (!departmentPermissions) {
    return [];
  }
  
  return Object.keys(departmentPermissions).filter(module => 
    hasModuleAccess(permissions, department, module)
  );
};

/**
 * Get user's permissions for a specific module
 * @param {Object} permissions - User permissions object
 * @param {string} department - Department name
 * @param {string} module - Module name
 */
export const getModulePermissions = (permissions, department, module) => {
  if (!permissions || !department || !module) {
    return {
      view: false,
      create: false,
      update: false,
      delete: false,
      list_view: false
    };
  }

 const modulePermissions = permissions[department]?.[module] || {};
  
  return {
    view: modulePermissions.view === true,
    create: modulePermissions.create === true,
    update: modulePermissions.update === true,
    delete: modulePermissions.delete === true,
    list_view: modulePermissions.list_view === true
  };
};

/**
 * Check if a user has a specific permission using dot-notation path
 * Supports both nested paths (e.g., 'fund_raising.donations.create') and top-level permissions (e.g., 'super_admin')
 * @param {Object} permissions - User permissions object
 * @param {string} permissionPath - Permission path in dot-notation format (e.g., 'fund_raising.donations.create' or 'super_admin')
 * @returns {boolean} - Whether user has the permission
 */
export const hasPermissionByPath = (permissions, permissionPath) => {
  if (!permissions || !permissionPath) {
    return false;
  }

  // Handle top-level boolean permissions (e.g., 'super_admin')
  if (permissionPath in permissions && typeof permissions[permissionPath] === 'boolean') {
    return permissions[permissionPath] === true;
  }

  // Handle dot-notation paths (e.g., 'fund_raising.donations.create')
  const pathParts = permissionPath.split('.');
  let current = permissions;

  for (const part of pathParts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return false;
    }
    current = current[part];
  }

  // Check if the final value is true
  return current === true;
};

/**
 * Check if user has ANY of the required permissions (OR logic)
 * Matches the backend PermissionsGuard behavior
 * @param {Object} permissions - User permissions object from AuthContext
 * @param {string|string[]} requiredPermissions - Single permission string or array of permission strings
 * @returns {boolean} - Whether user has at least one of the required permissions
 * 
 * @example
 * // Single permission
 * hasAnyPermission(permissions, 'fund_raising.donations.create')
 * 
 * @example
 * // Multiple permissions (OR logic - returns true if user has ANY)
 * hasAnyPermission(permissions, ['fund_raising.donations.create', 'super_admin', 'fund_raising_manager'])
 */
export const DATA_SCOPE_TYPES = ['self', 'team', 'department', 'org'];

/**
 * Per-module data scope from permissions JSON (defaults to self).
 */
export const getModuleDataScope = (permissions, department, module) => {
  if (!permissions || !department || !module) {
    return 'self';
  }
  const modulePerms = permissions[department]?.[module];
  if (!modulePerms || typeof modulePerms !== 'object') {
    return 'self';
  }
  if (modulePerms.view_all === true) {
    return 'org';
  }
  const scope = modulePerms.scope;
  return DATA_SCOPE_TYPES.includes(scope) ? scope : 'self';
};

/**
 * Whether the user can see all records in a module (auditor / org scope).
 */
export const hasModuleViewAll = (permissions, department, module) => {
  return getModuleDataScope(permissions, department, module) === 'org';
};

export const hasAnyPermission = (permissions, requiredPermissions) => {
  if (!permissions || !requiredPermissions) {
    return false;
  }

  // Normalize to array
  const permissionsArray = Array.isArray(requiredPermissions) 
    ? requiredPermissions 
    : [requiredPermissions];

  // Check if user has ANY of the required permissions
  for (const permission of permissionsArray) {
    if (hasPermissionByPath(permissions, permission)) {
      return true;
    }
  }

  return false;
};

export default {
  hasPermission,
  hasModuleAccess,
  hasDepartmentAccess,
  canViewModule,
  fundRaisingDonorsHas,
  fundRaisingOrganizationsOrPocsHas,
  isSuperAdmin,
  getAccessibleModules,
  getModulePermissions,
  hasPermissionByPath,
  hasAnyPermission,
  getModuleDataScope,
  hasModuleViewAll,
  DATA_SCOPE_TYPES,
};

  // // Single permission
  // const canCreate = hasAnyPermission('fund_raising.donations.create');

  // // Multiple permissions (OR logic - returns true if user has ANY)
  // const canAccess = hasAnyPermission([
  //   'fund_raising.donations.create',
  //   'super_admin',
  //   'fund_raising_manager'
  // ]);

  
export const getTaskPermissions = (permissions, department, userRole) => {
  const role = String(userRole || '').toLowerCase();
  const isAdmin = isSuperAdmin(permissions) || role === 'super_admin' || role === 'admin';
  const isDeptHeadRole = role === 'dept_head';
  const isManagerRole = role === 'manager' || role === 'assistant_manager';
  const isTeamLeadRole = role === 'team_lead' || role === 'coordinator';
  const isStaffRole = role === 'staff' || role === 'officer' || role === 'support' || role === 'analyst' || role === 'developer' || role === 'it_support' || role === 'user';
  const isFieldOfficerRole = role === 'field_officer';
  const isVolunteerRole = role === 'volunteer';

  const deptKey = department && permissions?.[department]?.tasks ? department : null;
  const modulePermissions = (deptKey ? permissions?.[deptKey]?.tasks : null) 
    || permissions?.tasking?.tasks 
    || permissions?.admin?.tasks 
    || permissions?.tasks 
    || {};
  const reports = modulePermissions?.reports || {};
  // actions should combine base module permissions and report permissions
  const actions = {
    ...modulePermissions,
    ...reports
  };
  
  let scope = 'self';
  if (reports.view_all === true) {
    scope = 'org';
  } else if (reports.view_dept === true) {
    scope = 'department';
  } else if (reports.view_team === true) {
    scope = 'team';
  } else if (reports.view_own === true) {
    scope = 'self';
  } else {
    // Fallback based on role if no explicit scope is defined in reports
    if (isAdmin) {
      scope = 'org';
    } else if (isDeptHeadRole) {
      scope = 'department';
    } else if (isManagerRole || isTeamLeadRole) {
      scope = 'team';
    } else if (isStaffRole || isFieldOfficerRole || isVolunteerRole) {
      scope = 'self';
    }
  }

  const canViewDetail = actions.view === true || isAdmin;
  const canViewBase = canViewDetail || actions.list_view === true;
  const canViewReports =
    reports.view_all === true ||
    reports.view_dept === true ||
    reports.view_team === true ||
    reports.view_own === true;
  const canUpdate =
    actions.update === true || isAdmin;
  const canEditCompleted =
    actions.edit_completed === true ||
    actions.update === true ||
    isAdmin;
  const canApproveBase =
    actions.approve === true || isAdmin;
  const canApproveByRole = isAdmin || isDeptHeadRole || isManagerRole || isTeamLeadRole;
  
  const result = {
    canView: canViewBase || canViewReports,
    canViewDetail: canViewDetail,
    canCreate: actions.create === true || isAdmin,
    canUpdate,
    canDelete: actions.delete === true || isAdmin,
    canAssign:
      actions.assign === true ||
      isAdmin ||
      isManagerRole ||
      isDeptHeadRole ||
      isTeamLeadRole,
    canApprove: canApproveBase || canApproveByRole,
    canComplete: actions.complete === true || isAdmin,
    canEditCompleted,
    reportScope: scope
  };

  console.log('getTaskPermissions result:', {
    result,
    permissions,
    department,
    userRole,
    modulePermissions,
    actions,
    isAdmin,
    isDeptHeadRole,
    isManagerRole,
    isTeamLeadRole
  });
  
  return result;
};

export const getComplaintPermissions = (permissions, department, userRole) => {
  const role = String(userRole || '').toLowerCase();
  const isAdmin = isSuperAdmin(permissions) || role === 'super_admin' || role === 'admin';
  const isDeptHeadRole = role === 'dept_head';
  const isManagerRole = role === 'manager' || role === 'assistant_manager';
  const isTeamLeadRole = role === 'team_lead' || role === 'coordinator';
  const isStaffRole = role === 'staff' || role === 'officer' || role === 'support' || role === 'analyst' || role === 'developer' || role === 'it_support' || role === 'user';
  const isFieldOfficerRole = role === 'field_officer';
  const isVolunteerRole = role === 'volunteer';

  const deptKey =
    department &&
    (permissions?.[department]?.tickets || permissions?.[department]?.complaints)
      ? department
      : null;
  const modulePermissions =
    (deptKey
      ? permissions?.[deptKey]?.tickets || permissions?.[deptKey]?.complaints
      : null) ||
    permissions?.tickets?.tickets ||
    permissions?.complaints?.complaints ||
    permissions?.admin?.tickets ||
    permissions?.admin?.complaints ||
    permissions?.tickets ||
    permissions?.complaints ||
    {};
  const reports = modulePermissions?.reports || {};
  const actions = {
    ...modulePermissions,
    ...reports,
  };

  let scope = 'self';
  if (reports.view_all === true) {
    scope = 'org';
  } else if (reports.view_dept === true) {
    scope = 'department';
  } else if (reports.view_team === true) {
    scope = 'team';
  } else if (reports.view_own === true) {
    scope = 'self';
  } else if (modulePermissions.view_all === true || modulePermissions.scope === 'org') {
    scope = 'org';
  } else if (modulePermissions.scope === 'department') {
    scope = 'department';
  } else if (modulePermissions.scope === 'team') {
    scope = 'team';
  } else if (isAdmin) {
    scope = 'org';
  } else if (isDeptHeadRole) {
    scope = 'department';
  } else if (isManagerRole || isTeamLeadRole) {
    scope = 'team';
  } else if (isStaffRole || isFieldOfficerRole || isVolunteerRole) {
    scope = 'self';
  }

  const canViewDetail = actions.view === true || isAdmin;
  const canViewBase = canViewDetail || actions.list_view === true;
  const canViewReports =
    reports.view_all === true ||
    reports.view_dept === true ||
    reports.view_team === true ||
    reports.view_own === true;
  const canUpdate = actions.update === true || isAdmin;
  const canEditCompleted =
    actions.edit_completed === true || actions.update === true || isAdmin;
  const canApproveBase = actions.approve === true || isAdmin;
  const canApproveByRole =
    isAdmin || isDeptHeadRole || isManagerRole || isTeamLeadRole;

  return {
    canView: canViewBase || canViewReports,
    canViewDetail,
    canCreate: actions.create === true || isAdmin,
    canUpdate,
    canDelete: actions.delete === true || isAdmin,
    canAssign:
      actions.assign === true ||
      isAdmin ||
      isManagerRole ||
      isDeptHeadRole ||
      isTeamLeadRole,
    canApprove: canApproveBase || canApproveByRole,
    canComplete: actions.complete === true || isAdmin,
    canEditCompleted,
    reportScope: scope,
  };
};

export const getTicketPermissions = getComplaintPermissions;

export const getComplaintCasePermissions = (permissions, department, userRole) => {
  const role = String(userRole || '').toLowerCase();
  const isAdmin = isSuperAdmin(permissions) || role === 'super_admin' || role === 'admin';

  const deptKey =
    department &&
    (permissions?.[department]?.tickets || permissions?.[department]?.complaints)
      ? department
      : null;
  const ticketsRoot =
    (deptKey ? permissions?.[deptKey]?.tickets : null) ||
    permissions?.tickets ||
    {};
  const casePerms =
    ticketsRoot?.complaints_case ||
    permissions?.tickets?.complaints_case ||
    permissions?.complaints_case ||
    {};

  const has = (key) => casePerms[key] === true || isAdmin;

  return {
    canView: has('view') || has('list_view'),
    canList: has('list_view') || has('view'),
    canCreate: has('create'),
    canInvestigate: has('investigate'),
    canUpdateStatus: has('update_status') || has('investigate'),
    canManageNominees: has('manage_nominees') || has('investigate'),
    canViewNominees: has('view_nominees') || has('view') || has('list_view'),
    canScheduleMeetings: has('schedule_meetings') || has('investigate'),
    canAddNarrative: has('add_narrative') || has('investigate'),
  };
};

/**
 * Map UI channel / donation fields → reconciler module.
 * online ← website source; in_kind ← method; else offline (incl. CSR / fund_raising).
 */
export const resolveDonationReconcileChannel = ({
  channel,
  donation_method,
  donation_source,
} = {}) => {
  const method = String(donation_method || '').toLowerCase();
  if (method === 'in_kind' || channel === 'in_kind') return 'in_kind';
  if (channel === 'online') return 'online';
  if (channel === 'offline' || channel === 'csr') return 'offline';
  const source = String(donation_source || '').toLowerCase();
  if (source === 'website') return 'online';
  return 'offline';
};

const DONATION_RECONCILE_MODULE = {
  online: 'online_donations',
  offline: 'offline_donations',
  in_kind: 'in_kind_donations',
};

/**
 * Reconciler: may set donation status beyond pending for a specific channel.
 * Pass channel ('online'|'offline'|'in_kind'|csr) or method/source via options.
 * Super admin and fund_raising_manager always pass.
 */
export const canReconcileDonations = (permissions, channelOrOptions) => {
  if (!permissions) return false;
  if (permissions.super_admin === true) return true;
  if (permissions.fund_raising_manager === true) return true;

  let channel = null;
  if (typeof channelOrOptions === 'string') {
    channel = resolveDonationReconcileChannel({ channel: channelOrOptions });
  } else if (channelOrOptions && typeof channelOrOptions === 'object') {
    channel = resolveDonationReconcileChannel(channelOrOptions);
  }

  if (channel && DONATION_RECONCILE_MODULE[channel]) {
    return hasPermission(
      permissions,
      'fund_raising',
      DONATION_RECONCILE_MODULE[channel],
      'reconciler',
    );
  }

  // No channel: any donation reconciler (legacy / generic gates)
  return (
    hasPermission(permissions, 'fund_raising', 'online_donations', 'reconciler') ||
    hasPermission(permissions, 'fund_raising', 'offline_donations', 'reconciler') ||
    hasPermission(permissions, 'fund_raising', 'in_kind_donations', 'reconciler')
  );
};

export const canReconcileBoxCollections = (permissions) => {
  if (!permissions) return false;
  if (permissions.super_admin === true) return true;
  if (permissions.fund_raising_manager === true) return true;
  return hasPermission(
    permissions,
    'fund_raising',
    'donation_box_donations',
    'reconciler',
  );
};

export const canReconcileRecurring = (permissions) => {
  if (!permissions) return false;
  if (permissions.super_admin === true) return true;
  if (permissions.fund_raising_manager === true) return true;
  return hasPermission(
    permissions,
    'fund_raising',
    'recurring_donations',
    'reconciler',
  );
};

/** Status options: pending-only unless reconciler for that channel. */
export const donationStatusOptionsForUser = (
  permissions,
  allOptions,
  currentStatus = 'pending',
  channelOrOptions = null,
) => {
  const pendingOnly = [{ value: 'pending', label: 'Pending' }];
  if (canReconcileDonations(permissions, channelOrOptions)) {
    return allOptions;
  }
  const current = String(currentStatus || 'pending').toLowerCase();
  if (current && current !== 'pending') {
    return [
      ...pendingOnly,
      { value: current, label: current },
    ];
  }
  return pendingOnly;
};

