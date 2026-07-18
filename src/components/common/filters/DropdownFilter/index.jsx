import React from 'react';
import './styles.css';

/**
 * DropdownFilter Component
 * A reusable dropdown filter component that updates a parent filter object
 * 
 * @param {String} filterKey - The key in the filter object to update (e.g., 'status', 'department')
 * @param {String} label - Label to display above the dropdown
 * @param {Array} data - Array of options for the dropdown
 *   Can be:
 *   - Array of strings: ['Option1', 'Option2']
 *   - Array of objects: [{value: 'opt1', label: 'Option 1'}, {value: 'opt2', label: 'Option 2'}]
 * @param {Object} filters - The parent filter object containing all filters
 * @param {Function} onFilterChange - Callback function to update the parent filter object
 * @param {String} placeholder - Placeholder text for the default option
 * @param {Boolean} required - Whether the field is required
 * @param {String} className - Additional CSS classes
 * @param {Boolean} showClearButton - Whether to show a clear button
 */
const DropdownFilter = ({
  filterKey,
  label = '',
  data = [],
  filters = {},
  onFilterChange,
  placeholder = 'Select an option',
  required = false,
  className = '',
  showClearButton = true
}) => {
  const handleDropdownChange = (e) => {
    const newValue = e.target.value;
    
    // Call the parent's filter change handler
    if (onFilterChange) {
      onFilterChange(filterKey, newValue);
    }
  };

  const handleClear = () => {
    if (onFilterChange) {
      onFilterChange(filterKey, '');
    }
  };

  // Get the current value from the filters object
  const rawValue = filters ? filters[filterKey] : undefined;
  // Important: allow boolean false / 0 to be represented instead of being treated as empty
  const currentValue =
    rawValue === undefined || rawValue === null ? '' : String(rawValue);

  // Normalize data to array of objects
  const normalizedData = data.map(item => {
    if (typeof item === 'string') {
      return { value: item, label: item };
    }
    return item;
  });

  return (
    <div className={`dropdown-filter-container ${className}`}>
      {label && (
        <label className="dropdown-filter-label" htmlFor={`dropdown-filter-${filterKey}`}>
          {label}
          {required && <span className="required-asterisk">*</span>}
        </label>
      )}
      <div className="dropdown-filter-input-wrapper">
        <select
          id={`dropdown-filter-${filterKey}`}
          className="dropdown-filter-select"
          value={currentValue}
          onChange={handleDropdownChange}
          required={required}
        >
          <option value="">{placeholder}</option>
          {normalizedData.map((option, index) => (
            <option key={`${String(option.value)}-${index}`} value={String(option.value)}>
              {option.label}
            </option>
          ))}
        </select>
        {showClearButton && currentValue && (
          <button
            type="button"
            className="dropdown-filter-clear"
            onClick={handleClear}
            title="Clear selection"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default DropdownFilter;
