import React from 'react';
import './styles.css';

const FormSelect = ({
  name,
  label,
  value,
  options,
  onChange,
  error,
  required = false,
  disabled = false,
  isEdit = false,
  className = '',
  showDefaultOption = false,
  defaultOptionText = null,
}) => {
  let defaultValue = '';
  // Don't override value when options are empty
  return (
    <div className={`form-group ${className}`}>
      <label className="form-label">
        {label}
        {required && <span className="required-mark">*</span>}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`form-input ${error ? 'form-input--error' : ''}`}
        disabled={disabled || isEdit}
        required={required}
      >
        {showDefaultOption && (
          <option value={defaultValue}>
            {defaultOptionText || `Select ${label}`}
          </option>
        )}
        {options.map((option) => {
          if (typeof option === 'string') {
            return (
              <option key={option} value={option}>
                {option}
              </option>
            );
          }
          return (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          );
        })}
      </select>
      {error && <span className="form-error">{error}</span>}
    </div>
  );
};

export default FormSelect;
