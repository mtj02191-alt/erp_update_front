import React from 'react';
import './styles.css';

/**
 * DateRangeFilter Component
 * A reusable date range filter component that updates a parent filter object
 * 
 * @param {String} startKey - The key in the filter object for start date (e.g., 'startDate', 'fromDate')
 * @param {String} endKey - The key in the filter object for end date (e.g., 'endDate', 'toDate')
 * @param {String} label - Label to display above the date range
 * @param {Object} filters - The parent filter object containing all filters
 * @param {Function} onFilterChange - Callback function to update the parent filter object
 * @param {String} startPlaceholder - Placeholder for start date
 * @param {String} endPlaceholder - Placeholder for end date
 * @param {Boolean} required - Whether both fields are required
 * @param {String} className - Additional CSS classes
 */
const DateRangeFilter = ({
  startKey,
  endKey,
  label = '',
  filters = {},
  onFilterChange,
  startPlaceholder = 'From',
  endPlaceholder = 'To',
  required = false,
  className = ''
}) => {
  const handleStartDateChange = (e) => {
    const newValue = e.target.value;
    
    if (onFilterChange) {
      onFilterChange(startKey, newValue);
    }
  };

  const handleEndDateChange = (e) => {
    const newValue = e.target.value;
    
    if (onFilterChange) {
      onFilterChange(endKey, newValue);
    }
  };

  const handleClear = () => {
    if (onFilterChange) {
      onFilterChange(startKey, '');
      onFilterChange(endKey, '');
    }
  };

  // Get current values from the filters object
  const startValue = filters[startKey] || '';
  const endValue = filters[endKey] || '';

  return (
    <div className={`date-range-filter-container ${className}`}>
      {label && (
        <label className="date-range-filter-label">
          {label}
          {required && <span className="required-asterisk">*</span>}
        </label>
      )}
      <div className="date-range-filter-inputs">
        <input
          type="date"
          className="date-range-filter-input"
          value={startValue}
          onChange={handleStartDateChange}
          placeholder={startPlaceholder}
          required={required}
          max={endValue || undefined}
        />
        <span className="date-range-separator">to</span>
        <input
          type="date"
          className="date-range-filter-input"
          value={endValue}
          onChange={handleEndDateChange}
          placeholder={endPlaceholder}
          required={required}
          min={startValue || undefined}
        />
        {(startValue || endValue) && (
          <button
            type="button"
            className="date-range-filter-clear"
            onClick={handleClear}
            title="Clear date range"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default DateRangeFilter;
