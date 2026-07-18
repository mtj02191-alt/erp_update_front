# Permission-Based Sidebar System

## Overview
This implementation adds a comprehensive permission-based sidebar system that filters navigation items based on user permissions received from the backend.

## What Was Implemented

### 1. Enhanced AuthContext (`src/context/AuthContext.jsx`)
- **Added permissions state**: `const [permissions, setPermissions] = useState(null)`
- **Enhanced login function**: Now stores permissions from `response.data.permissions`
- **Enhanced checkAuth function**: Loads permissions from localStorage and backend
- **Enhanced logout function**: Clears permissions from state and localStorage
- **Updated context value**: Now provides `permissions` to consuming components

### 2. Permission Utilities (`src/utils/permissions.js`)
Created comprehensive utility functions:
- `hasPermission(permissions, department, module, action)` - Check specific permission
- `hasModuleAccess(permissions, department, module)` - Check if user has any access to module
- `hasDepartmentAccess(permissions, department)` - Check department access
- `canViewModule(permissions, department, module)` - Check if module should show in sidebar
- `isSuperAdmin(permissions)` - Check if user is super admin
- `getAccessibleModules(permissions, department)` - Get all accessible modules
- `getModulePermissions(permissions, department, module)` - Get all permissions for a module

### 3. Enhanced Sidebar Configuration (`src/components/common/Sidebar/sidebarConfig.js`)
- **Added module mapping**: Each navigation item now has a `module` property
- **Fixed syntax error**: Corrected `alse` to `false` in procurements config
- **Added permission filtering**: `filterItemsByPermissions()` function
- **Enhanced getSidebarConfig()**: Now accepts permissions parameter and filters items
- **Backward compatibility**: Items without module property still show (fallback)

### 4. Updated Sidebar Component (`src/components/common/Sidebar/Sidebar.jsx`)
- **Added permissions from context**: `const { user, permissions } = useAuth()`
- **Updated config call**: `getSidebarConfig(user, permissions)`
- **Added debug logging**: Console logs for debugging (remove in production)

### 5. Permission Test Component (`src/components/common/Sidebar/PermissionTest.jsx`)
- **Debug component**: Shows current user permissions and sidebar visibility
- **Visual indicators**: Green for accessible, red for restricted
- **Module testing**: Tests all fund_raising modules

## Permission Structure

The system expects permissions in this format:
```javascript
{
  "department": {
    "module": {
      "action": boolean
    }
  },
  "super_admin": boolean
}
```

Example:
```javascript
{
  "fund_raising": {
    "donations": {
      "view": true,
      "create": false,
      "delete": false,
      "update": false,
      "list_view": true
    },
    "donation_box": {
      "view": true,
      "list_view": true
    },
    "donation_box_donations": {
      "view": true,
      "create": true,
      "delete": true,
      "update": true,
      "list_view": true
    },
    "donors": {
      "view": true,
      "list_view": true
    }
  }
}
```

## How It Works

### 1. Login Flow
1. User logs in with credentials
2. Backend returns user data + permissions
3. AuthContext stores both user and permissions
4. Permissions are saved to localStorage for persistence

### 2. Sidebar Rendering
1. Sidebar component gets user and permissions from context
2. `getSidebarConfig(user, permissions)` is called
3. Function filters items based on `canViewModule()` check
4. Only modules with `view: true` or `list_view: true` are shown

### 3. Permission Checking
- **Module visibility**: User needs `view` OR `list_view` permission
- **Super admin**: Sees all departments regardless of permissions
- **Fallback**: If no permissions, shows all items (backward compatibility)

## Module Mapping

### Fund Raising Department
- `donations` → Donations
- `donation_box` → Donation Box  
- `donation_box_donations` → Donation Box Donations
- `donors` → Donors
- `dashboard` → Dashboard

### Other Departments
- All report modules mapped to their respective names
- Admin modules mapped appropriately

## Testing

### 1. Add PermissionTest Component
To test the system, temporarily add the PermissionTest component to your main layout:

```jsx
import PermissionTest from './components/common/Sidebar/PermissionTest';

// In your main component
<PermissionTest />
```

### 2. Test Scenarios
1. **User with full permissions**: Should see all modules
2. **User with limited permissions**: Should see only permitted modules
3. **User with no permissions**: Should see no modules (or fallback to all)
4. **Super admin**: Should see all departments

### 3. Console Debugging
Check browser console for debug logs:
- User data
- Permissions object
- Filtered sidebar config

## Security Benefits

1. **True permission-based access**: Only shows what user can actually use
2. **Reduced attack surface**: Hidden modules can't be discovered
3. **Better UX**: No broken navigation links
4. **Audit compliance**: Clear permission mapping
5. **Scalable**: Easy to add new modules and permissions

## Backward Compatibility

- **Existing functionality preserved**: All existing features work as before
- **Graceful fallback**: If permissions fail to load, shows all items
- **No breaking changes**: Existing components continue to work
- **Progressive enhancement**: Permission system is additive

## Next Steps

1. **Test with real permissions**: Use actual backend permission data
2. **Remove debug logging**: Clean up console.log statements
3. **Add error handling**: Handle permission loading failures gracefully
4. **Performance optimization**: Consider memoizing permission checks
5. **Add more modules**: Map additional modules as needed

## Files Modified

1. `src/context/AuthContext.jsx` - Enhanced with permissions
2. `src/utils/permissions.js` - New permission utilities
3. `src/components/common/Sidebar/sidebarConfig.js` - Added permission filtering
4. `src/components/common/Sidebar/Sidebar.jsx` - Updated to use permissions
5. `src/components/common/Sidebar/PermissionTest.jsx` - New debug component

## Files Created

1. `src/utils/permissions.js` - Permission utility functions
2. `src/components/common/Sidebar/PermissionTest.jsx` - Debug component
3. `PERMISSION_SYSTEM_README.md` - This documentation

The system is now ready for testing with real permission data from your backend!
