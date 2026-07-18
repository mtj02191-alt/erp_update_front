import React, { useState } from 'react';
import SearchableMultiSelect from './index';

/**
 * Example usage of SearchableMultiSelect component
 * This file demonstrates various ways to use the component
 */

const SearchableMultiSelectExample = () => {
  // State for different examples
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  // Example 1: Basic usage with API endpoint
  const BasicExample = () => (
    <div style={{ marginBottom: '2rem' }}>
      <h3>Basic Usage - User Selection</h3>
      <SearchableMultiSelect
        label="Select Users"
        placeholder="Search users by name or email..."
        apiEndpoint="/users"
        onSelect={setSelectedUsers}
        value={selectedUsers}
        displayKey="first_name"
        valueKey="id"
        required
      />
      <div style={{ marginTop: '1rem', fontSize: '14px', color: '#666' }}>
        Selected: {selectedUsers.length} users
      </div>
    </div>
  );

  // Example 2: Custom rendering
  const CustomRenderExample = () => (
    <div style={{ marginBottom: '2rem' }}>
      <h3>Custom Rendering - User Details</h3>
      <SearchableMultiSelect
        label="Assign Team Members"
        placeholder="Search team members..."
        apiEndpoint="/users"
        onSelect={setSelectedUsers}
        value={selectedUsers}
        displayKey="first_name"
        valueKey="id"
        renderOption={(user, index) => (
          <div style={{ padding: '8px' }}>
            <div style={{ fontWeight: '500', marginBottom: '4px' }}>
              {user.first_name} {user.last_name}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {user.email}
            </div>
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

  // Example 3: With API parameters
  const ApiParamsExample = () => (
    <div style={{ marginBottom: '2rem' }}>
      <h3>With API Parameters - Department Users</h3>
      <SearchableMultiSelect
        label="IT Department Users"
        placeholder="Search IT department users..."
        apiEndpoint="/users"
        apiParams={{ department: 'IT', active: true }}
        onSelect={setSelectedUsers}
        value={selectedUsers}
        displayKey="first_name"
        valueKey="id"
      />
    </div>
  );

  // Example 4: Custom search function
  const CustomSearchExample = () => {
    const handleCustomSearch = async (searchTerm) => {
      // Simulate API call
      const response = await fetch(`/api/projects?search=${searchTerm}&status=active`);
      const data = await response.json();
      return data.projects || [];
    };

    return (
      <div style={{ marginBottom: '2rem' }}>
        <h3>Custom Search Function - Projects</h3>
        <SearchableMultiSelect
          label="Related Projects"
          placeholder="Search active projects..."
          onSearch={handleCustomSearch}
          onSelect={setSelectedProjects}
          value={selectedProjects}
          displayKey="name"
          valueKey="id"
          minSearchLength={3}
          debounceDelay={300}
        />
      </div>
    );
  };

  // Example 5: With error handling
  const ErrorHandlingExample = () => (
    <div style={{ marginBottom: '2rem' }}>
      <h3>With Error Handling</h3>
      <SearchableMultiSelect
        label="Select Items"
        placeholder="Search items..."
        apiEndpoint="/items"
        onSelect={setSelectedItems}
        value={selectedItems}
        displayKey="name"
        valueKey="id"
        error={selectedItems.length === 0 ? 'Please select at least one item' : ''}
        required
      />
    </div>
  );

  // Example 6: Disabled state
  const DisabledExample = () => (
    <div style={{ marginBottom: '2rem' }}>
      <h3>Disabled State</h3>
      <SearchableMultiSelect
        label="Disabled Selection"
        placeholder="This is disabled..."
        apiEndpoint="/users"
        onSelect={setSelectedUsers}
        value={selectedUsers}
        displayKey="first_name"
        valueKey="id"
        disabled={true}
      />
    </div>
  );

  // Example 7: With custom styling
  const CustomStylingExample = () => (
    <div style={{ marginBottom: '2rem' }}>
      <h3>Custom Styling</h3>
      <SearchableMultiSelect
        label="Styled Selection"
        placeholder="Search with custom styling..."
        apiEndpoint="/users"
        onSelect={setSelectedUsers}
        value={selectedUsers}
        displayKey="first_name"
        valueKey="id"
        className="custom-multi-select"
        style={{
          border: '2px solid #007bff',
          borderRadius: '8px'
        }}
      />
    </div>
  );

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>SearchableMultiSelect Examples</h1>
      
      <BasicExample />
      <CustomRenderExample />
      <ApiParamsExample />
      <CustomSearchExample />
      <ErrorHandlingExample />
      <DisabledExample />
      <CustomStylingExample />

      {/* Debug information */}
      <div style={{ marginTop: '3rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h4>Debug Information</h4>
        <div style={{ fontSize: '14px', fontFamily: 'monospace' }}>
          <div><strong>Selected Users:</strong> {JSON.stringify(selectedUsers, null, 2)}</div>
          <div><strong>Selected Projects:</strong> {JSON.stringify(selectedProjects, null, 2)}</div>
          <div><strong>Selected Items:</strong> {JSON.stringify(selectedItems, null, 2)}</div>
        </div>
      </div>
    </div>
  );
};

export default SearchableMultiSelectExample;
