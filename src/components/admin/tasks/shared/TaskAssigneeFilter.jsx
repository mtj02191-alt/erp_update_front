import React from 'react';
import SearchableDropdown from '../../../common/SearchableDropdown';
import './TaskAssigneeFilter.css';

export function formatAssigneeLabel(user) {
  if (!user) return '';
  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return name || user.email || '';
}

export default function TaskAssigneeFilter({
  value,
  onSelect,
  onClear,
  placeholder = 'Search users by name or email...',
}) {
  return (
    <div className="task-assignee-filter">
      <SearchableDropdown
        label=""
        placeholder={placeholder}
        apiEndpoint="/users/options"
        apiParams={{ active: true }}
        onSelect={onSelect}
        onClear={onClear}
        value={value}
        displayKey="first_name"
        debounceDelay={500}
        minSearchLength={2}
        allowResearch={true}
        renderOption={(user) => (
          <div>
            <div style={{ fontWeight: '500', marginBottom: '4px' }}>
              {formatAssigneeLabel(user)}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>{user.email}</div>
            {user.department && (
              <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                {user.department} • {user.role || 'User'}
              </div>
            )}
          </div>
        )}
      />
    </div>
  );
}
