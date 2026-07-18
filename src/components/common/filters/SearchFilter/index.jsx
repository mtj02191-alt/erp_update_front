import React from 'react';
import { FiSearch } from 'react-icons/fi';
import './styles.css';

/**
 * SearchFilter Component
 * A reusable search input filter component that updates a parent filter object
 * 
 * @param {String} filterKey - The key in the filter object to update (e.g., 'search', 'query')
 * @param {String} label - Label to display above the search input
 * @param {Object} filters - The parent filter object containing all filters
 * @param {Function} onFilterChange - Callback function to update the parent filter object
 * @param {String} placeholder - Placeholder text for the search input
 * @param {String} className - Additional CSS classes
 * @param {Boolean} showIcon - Whether to show the search icon
 */
const SearchFilter = ({
  filterKey,
  label = '',
  filters = {},
  onFilterChange,
  placeholder = 'Search...',
  className = '',
  showIcon = true
}) => {
  const handleSearchChange = (e) => {
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
    <div className={`search-filter-container ${className}`}>
      {label && (
        <label className="search-filter-label" htmlFor={`search-filter-${filterKey}`}>
          {label}
        </label>
      )}
      <div className="search-filter-input-wrapper">
        {showIcon && (
          <FiSearch className="search-filter-icon" />
        )}
        <input
          id={`search-filter-${filterKey}`}
          type="text"
          className="search-filter-input"
          value={currentValue}
          onChange={handleSearchChange}
          placeholder={placeholder}
        />
        {currentValue && (
          <button
            type="button"
            className="search-filter-clear"
            onClick={handleClear}
            title="Clear search"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchFilter;
