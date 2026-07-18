// components/AdminFilteration.jsx
import React, { useState, useEffect } from 'react';
import { departments } from '../../../utils/admin';
import MultiSelect from '../../common/MultiSelect';
import '../../../styles/components.css';
import './AdminFilteration.css';

const durationOptions = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'custom', label: 'Custom' },
];

const customDateTypes = [
  { value: 'single_day', label: 'Single Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

const AdminFilteration = ({ filters, onFilterChange }) => {
  // Local UI state for custom date popup
  const [showCustomDatePopup, setShowCustomDatePopup] = useState(false);

  // Helper function to format date as YYYY-MM-DD (matches backend entity format)
  const formatDateToYYYYMMDD = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Helper function to get date range based on duration
  const getDateRangeForDuration = (durationValue) => {
    const today = new Date();
    let from, to;
    switch (durationValue) {
      case 'today':
        from = to = formatDateToYYYYMMDD(today);
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        from = to = formatDateToYYYYMMDD(yesterday);
        break;
      case 'this_week':
        const startOfWeek = new Date(today);
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        from = formatDateToYYYYMMDD(startOfWeek);
        to = formatDateToYYYYMMDD(endOfWeek);
        break;
      case 'last_week':
        const lastWeekStart = new Date(today);
        const lastDayOfWeek = today.getDay();
        const lastDiff = today.getDate() - lastDayOfWeek + (lastDayOfWeek === 0 ? -6 : 1) - 7;
        lastWeekStart.setDate(lastDiff);
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
        from = formatDateToYYYYMMDD(lastWeekStart);
        to = formatDateToYYYYMMDD(lastWeekEnd);
        break;
      case 'this_month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        from = formatDateToYYYYMMDD(startOfMonth);
        to = formatDateToYYYYMMDD(endOfMonth);
        break;
      case 'last_month':
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        from = formatDateToYYYYMMDD(startOfLastMonth);
        to = formatDateToYYYYMMDD(endOfLastMonth);
        break;
      case 'this_year':
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const endOfYear = new Date(today.getFullYear(), 11, 31);
        from = formatDateToYYYYMMDD(startOfYear);
        to = formatDateToYYYYMMDD(endOfYear);
        break;
      case 'last_year':
        const startOfLastYear = new Date(today.getFullYear() - 1, 0, 1);
        const endOfLastYear = new Date(today.getFullYear() - 1, 11, 31);
        from = formatDateToYYYYMMDD(startOfLastYear);
        to = formatDateToYYYYMMDD(endOfLastYear);
        break;
      default:
        from = to = formatDateToYYYYMMDD(today);
    }
    return { from, to };
  };

  // Handlers
  const handleDurationChange = (e) => {
    const newDuration = e.target.value;
    let newFilters = { ...filters, duration: newDuration };
    if (newDuration === 'custom') {
      setShowCustomDatePopup(true);
    } else {
      setShowCustomDatePopup(false);
      newFilters = {
        ...newFilters,
        customRange: { from: '', to: '' },
        customDateType: 'single_day',
        customDateValue: '',
      };
    }
    onFilterChange(newFilters);
  };

  const handleDepartmentsChange = (selected) => {
    onFilterChange({ ...filters, departments: selected });
  };

  const handleCustomDateTypeChange = (e) => {
    onFilterChange({ ...filters, customDateType: e.target.value, customDateValue: '', customRange: { from: '', to: '' } });
  };

  const handleCustomDateValueChange = (e) => {
    const value = e.target.value;
    let fromDate, toDate;
    switch (filters.customDateType) {
      case 'single_day':
        fromDate = toDate = value;
        break;
      case 'week':
        const date = new Date(value);
        const dayOfWeek = date.getDay();
        const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const weekStart = new Date(date);
        weekStart.setDate(diff);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        fromDate = formatDateToYYYYMMDD(weekStart);
        toDate = formatDateToYYYYMMDD(weekEnd);
        break;
      case 'month':
        const monthDate = new Date(value + '-01');
        fromDate = formatDateToYYYYMMDD(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1));
        toDate = formatDateToYYYYMMDD(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0));
        break;
      case 'year':
        const year = parseInt(value);
        fromDate = `${year}-01-01`;
        toDate = `${year}-12-31`;
        break;
      default:
        fromDate = toDate = value;
    }
    onFilterChange({
      ...filters,
      customDateValue: value,
      customRange: { from: fromDate, to: toDate },
    });
  };

  const closeCustomDatePopup = () => {
    setShowCustomDatePopup(false);
    if (!filters.customRange?.from || !filters.customRange?.to) {
      onFilterChange({
        ...filters,
        duration: 'today',
        customRange: { from: '', to: '' },
        customDateValue: '',
        customDateType: 'single_day',
      });
    }
  };

  const applyCustomDate = () => {
    if (filters.customRange?.from && filters.customRange?.to) {
      setShowCustomDatePopup(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Just emit the current filters up
    onFilterChange(filters);
  };

  const getDateInputType = () => {
    switch (filters.customDateType) {
      case 'single_day':
        return 'date';
      case 'week':
        return 'date';
      case 'month':
        return 'month';
      case 'year':
        return 'number';
      default:
        return 'date';
    }
  };

  const getDateInputPlaceholder = () => {
    switch (filters.customDateType) {
      case 'single_day':
        return 'Select a day';
      case 'week':
        return 'Select any day in the week';
      case 'month':
        return 'Select month and year';
      case 'year':
        return 'Enter year (e.g., 2024)';
      default:
        return 'Select date';
    }
  };

  const getDateInputMin = () => {
    switch (filters.customDateType) {
      case 'year':
        return '1900';
      default:
        return undefined;
    }
  };

  const getDateInputMax = () => {
    switch (filters.customDateType) {
      case 'year':
        return '2100';
      default:
        return undefined;
    }
  };

  return (
    <>
      <form className="admin-filteration-controls" style={{marginBottom: '1.5rem'}} onSubmit={handleSubmit}>
        {/* Duration Selector */}
        <div className="page-size-selector">
          <label htmlFor="duration">Duration:</label>
          <select
            id="duration"
            value={filters.duration}
            onChange={handleDurationChange}
            className="page-size-select"
          >
            {durationOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {/* Departments MultiSelect (custom) */}
        <div className="page-size-selector">
          <label htmlFor="departments">Departments:</label>
          <MultiSelect
            name="departments"
            label={null}
            options={departments}
            value={filters.departments}
            onChange={handleDepartmentsChange}
            placeholder="Select..."
          />
        </div>
        {/* Search Button */}
        <button className="sort-order-btn" type="submit" style={{height: '38px', alignSelf: 'center'}}>Search</button>
      </form>

      {/* Custom Date Selection Popup */}
      {showCustomDatePopup && (
        <div className="custom-date-popup-overlay" onClick={closeCustomDatePopup}>
          <div className="custom-date-popup" onClick={(e) => e.stopPropagation()}>
            <div className="custom-date-header">
              <h3>Custom Date Selection</h3>
              <button className="close-btn" onClick={closeCustomDatePopup}>×</button>
            </div>
            <div className="custom-date-content">
              <div className="date-type-selector">
                <label>Select Type:</label>
                <select
                  value={filters.customDateType}
                  onChange={handleCustomDateTypeChange}
                  className="page-size-select"
                >
                  {customDateTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className="date-value-selector">
                <label>Select {filters.customDateType.replace('_', ' ')}:</label>
                <input
                  type={getDateInputType()}
                  value={filters.customDateValue}
                  onChange={handleCustomDateValueChange}
                  placeholder={getDateInputPlaceholder()}
                  className="page-size-select"
                  min={getDateInputMin()}
                  max={getDateInputMax()}
                />
              </div>
              {filters.customRange?.from && filters.customRange?.to && (
                <div className="date-range-display">
                  <p>Selected Range: {filters.customRange.from} to {filters.customRange.to}</p>
                </div>
              )}
              <div className="custom-date-actions">
                <button 
                  type="button" 
                  className="sort-order-btn" 
                  onClick={applyCustomDate}
                  disabled={!filters.customRange?.from || !filters.customRange?.to}
                >
                  Apply
                </button>
                <button type="button" className="sort-order-btn" onClick={closeCustomDatePopup} style={{marginLeft: '0.5rem'}}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminFilteration;
