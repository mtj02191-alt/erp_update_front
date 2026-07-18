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

  // Unified donors (fund_raising): allow sidebar if new `donors` or legacy online/offline donor flags exist
  if (department === 'fund_raising' && module === 'donors') {
    const fr = permissions[department];
    if (!fr) return false;
    const donors = fr.donors;
    if (donors?.view === true || donors?.list_view === true) return true;
    const online = fr.online_donors;
    const offline = fr.offline_donors;
    return (
      online?.view === true ||
      online?.list_view === true ||
      offline?.view === true ||
      offline?.list_view === true
    );
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
 * @returns {Object} - Object with permission flags
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
  isSuperAdmin,
  getAccessibleModules,
  getModulePermissions,
  hasPermissionByPath,
  hasAnyPermission
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
  return {
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
};
