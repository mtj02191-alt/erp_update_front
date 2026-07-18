import React, { useState, useEffect } from 'react';
import { DateFilter, DropdownFilter, SearchFilter, DateRangeFilter } from './index';

/**
 * Example Usage Component
 * Demonstrates how to use the filter components with a shared filter state
 */
const FilterExampleUsage = () => {
  // Single filter object to manage all filter states
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    department: '',
    startDate: '',
    endDate: '',
    createdDate: '',
    donationType: ''
  });

  // Example data for dropdowns
  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const departmentOptions = [
    'IT',
    'Finance',
    'HR',
    'Marketing',
    'Sales'
  ];

  const donationTypeOptions = [
    { value: 'zakat', label: 'Zakat' },
    { value: 'sadqa', label: 'Sadqa' },
    { value: 'general', label: 'General' }
  ];

  // Universal filter change handler
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Clear all filters
  const handleClearAll = () => {
    setFilters({
      search: '',
      status: '',
      department: '',
      startDate: '',
      endDate: '',
      createdDate: '',
      donationType: ''
    });
  };

  // Log filter changes (for demonstration)
  useEffect(() => {
    console.log('Current Filters:', filters);
  }, [filters]);

  // Example: Filter data based on current filters
  const getFilteredData = () => {
    // This would be your API call or data filtering logic
    console.log('Fetching data with filters:', filters);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>Filter Components Example</h2>
      
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p>All filters share a common state object and update handler</p>
        <button 
          onClick={handleClearAll}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Clear All Filters
        </button>
      </div>

      {/* Example 1: Search Filter */}
      <div style={{ marginBottom: '30px' }}>
        <h3>1. Search Filter</h3>
        <SearchFilter
          filterKey="search"
          label="Search"
          filters={filters}
          onFilterChange={handleFilterChange}
          placeholder="Search by name, email, or ID..."
        />
      </div>

      {/* Example 2: Single Date Filter */}
      <div style={{ marginBottom: '30px' }}>
        <h3>2. Single Date Filter</h3>
        <DateFilter
          filterKey="createdDate"
          label="Created Date"
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* Example 3: Date Range Filter */}
      <div style={{ marginBottom: '30px' }}>
        <h3>3. Date Range Filter</h3>
        <DateRangeFilter
          startKey="startDate"
          endKey="endDate"
          label="Date Range"
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* Example 4: Dropdown with Object Data */}
      <div style={{ marginBottom: '30px' }}>
        <h3>4. Dropdown Filter (Object Data)</h3>
        <DropdownFilter
          filterKey="status"
          label="Status"
          data={statusOptions}
          filters={filters}
          onFilterChange={handleFilterChange}
          placeholder="Select status"
        />
      </div>

      {/* Example 5: Dropdown with String Array */}
      <div style={{ marginBottom: '30px' }}>
        <h3>5. Dropdown Filter (String Array)</h3>
        <DropdownFilter
          filterKey="department"
          label="Department"
          data={departmentOptions}
          filters={filters}
          onFilterChange={handleFilterChange}
          placeholder="Select department"
        />
      </div>

      {/* Example 6: Multiple Filters in a Row */}
      <div style={{ marginBottom: '30px' }}>
        <h3>6. Multiple Filters in a Row</h3>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <SearchFilter
            filterKey="search"
            label="Search"
            filters={filters}
            onFilterChange={handleFilterChange}
            placeholder="Search..."
          />
          <DropdownFilter
            filterKey="donationType"
            label="Donation Type"
            data={donationTypeOptions}
            filters={filters}
            onFilterChange={handleFilterChange}
            placeholder="All Types"
          />
          <DateFilter
            filterKey="createdDate"
            label="Date"
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>
      </div>

      {/* Current Filter State Display */}
      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        backgroundColor: '#f3f4f6', 
        borderRadius: '8px' 
      }}>
        <h3>Current Filter State:</h3>
        <pre style={{ 
          backgroundColor: 'white', 
          padding: '15px', 
          borderRadius: '6px',
          overflow: 'auto'
        }}>
          {JSON.stringify(filters, null, 2)}
        </pre>
      </div>

      {/* Example API Call Button */}
      <div style={{ marginTop: '20px' }}>
        <button
          onClick={getFilteredData}
          style={{
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          Apply Filters (Check Console)
        </button>
      </div>
    </div>
  );
};

export default FilterExampleUsage;
