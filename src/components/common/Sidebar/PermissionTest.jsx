import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { canViewModule, hasPermission, getModulePermissions } from '../../../utils/permissions';

/**
 * Permission Test Component - For debugging and testing permissions
 * This component shows the current user's permissions and what modules they can access
 * Remove this component in production
 */
const PermissionTest = () => {
  const { user, permissions } = useAuth();

  if (!user || !permissions) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#f0f0f0', margin: '10px', borderRadius: '8px' }}>
        <h3>Permission Test</h3>
        <p>No user or permissions data available</p>
      </div>
    );
  }

  const userDepartment = user.department;
  const departmentPermissions = permissions[userDepartment] || {};

  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', margin: '10px', borderRadius: '8px' }}>
      <h3>Permission Test - {user.first_name} ({user.department})</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <h4>User Info:</h4>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>Department:</strong> {user.department}</p>
        <p><strong>Super Admin:</strong> {permissions.super_admin ? 'Yes' : 'No'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>Department Permissions ({userDepartment}):</h4>
        {Object.keys(departmentPermissions).length > 0 ? (
          <div>
            {Object.entries(departmentPermissions).map(([module, modulePerms]) => (
              <div key={module} style={{ marginBottom: '10px', padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
                <h5>{module}</h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '5px' }}>
                  {Object.entries(modulePerms).map(([action, hasAccess]) => (
                    <div key={action} style={{ 
                      padding: '5px', 
                      backgroundColor: hasAccess ? '#d4edda' : '#f8d7da',
                      borderRadius: '3px',
                      textAlign: 'center'
                    }}>
                      <strong>{action}:</strong> {hasAccess ? '✓' : '✗'}
                    </div>
                  ))}
                </div>
                <p style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
                  Can view in sidebar: {canViewModule(permissions, userDepartment, module) ? 'Yes' : 'No'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p>No permissions found for this department</p>
        )}
      </div>

      <div>
        <h4>Sidebar Visibility Test:</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          {['donations', 'donation_box', 'donation_box_donations', 'donors', 'dashboard'].map(module => (
            <div key={module} style={{ 
              padding: '10px', 
              backgroundColor: canViewModule(permissions, userDepartment, module) ? '#d4edda' : '#f8d7da',
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              <strong>{module}</strong><br/>
              {canViewModule(permissions, userDepartment, module) ? 'Visible' : 'Hidden'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PermissionTest;
