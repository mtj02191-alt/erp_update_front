import React from 'react';
import './DataFilters.css';

const DataFilters = ({
  filters = [],
  onFilterChange,
  className = ''
}) => {
  const handleFilterChange = (filterKey, value) => {
    onFilterChange(filterKey, value);
  };

  const renderFilter = (filter) => {
    const { key, type, placeholder, options, value, label, width = '200px' } = filter;

    switch (type) {
      case 'text':
        return (
          <div key={key} className="filter-item">
            <input
              type="text"
              placeholder={placeholder}
              value={value || ''}
              onChange={(e) => handleFilterChange(key, e.target.value)}
              className="form-input"
              style={{ width }}
            />
          </div>
        );

      case 'select':
        return (
          <div key={key} className="filter-item">
            <select
              value={value || ''}
              onChange={(e) => handleFilterChange(key, e.target.value)}
              className="form-input"
              style={{ width }}
            >
              <option value="">{placeholder || `All ${label}s`}</option>
              {options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'date':
        return (
          <div key={key} className="filter-item">
            <input
              type="date"
              value={value || ''}
              onChange={(e) => handleFilterChange(key, e.target.value)}
              className="form-input"
              style={{ width }}
            />
          </div>
        );

      case 'dateRange':
        return (
          <div key={key} className="filter-item date-range">
            <input
              type="date"
              placeholder="From Date"
              value={value?.from || ''}
              onChange={(e) => handleFilterChange(key, { ...value, from: e.target.value })}
              className="form-input"
              style={{ width: '150px' }}
            />
            <span className="date-separator">to</span>
            <input
              type="date"
              placeholder="To Date"
              value={value?.to || ''}
              onChange={(e) => handleFilterChange(key, { ...value, to: e.target.value })}
              className="form-input"
              style={{ width: '150px' }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`data-filters ${className}`}>
      {filters.map(renderFilter)}
    </div>
  );
};

export default DataFilters; 