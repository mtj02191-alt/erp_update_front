import React from 'react';
import './styles.css';

/**
 * DateFilter Component
 * A reusable date filter component that updates a parent filter object
 * 
 * @param {String} filterKey - The key in the filter object to update (e.g., 'startDate', 'endDate')
 * @param {String} label - Label to display above the date input
 * @param {Object} filters - The parent filter object containing all filters
 * @param {Function} onFilterChange - Callback function to update the parent filter object
 * @param {String} placeholder - Optional placeholder text
 * @param {Boolean} required - Whether the field is required
 * @param {String} className - Additional CSS classes
 * @param {String} min - Minimum date (YYYY-MM-DD format)
 * @param {String} max - Maximum date (YYYY-MM-DD format)
 */
const DateFilter = ({
  filterKey,
  label = '',
  filters = {},
  onFilterChange,
  placeholder = '',
  required = false,
  className = '',
  min = '',
  max = ''
}) => {
  const handleDateChange = (e) => {
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
  const currentValue = filters[filterKey] || '';

  return (
    <div className={`date-filter-container ${className}`}>
      {label && (
        <label className="date-filter-label" htmlFor={`date-filter-${filterKey}`}>
          {label}
          {required && <span className="required-asterisk">*</span>}
        </label>
      )}
      <div className="date-filter-input-wrapper">
        <input
          id={`date-filter-${filterKey}`}
          type="date"
          className="date-filter-input"
          value={currentValue}
          onChange={handleDateChange}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
        />
        {currentValue && (
          <button
            type="button"
            className="date-filter-clear"
            onClick={handleClear}
            title="Clear date"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default DateFilter;
