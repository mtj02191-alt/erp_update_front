import React from 'react';
import './styles.css';

const FormTextarea = ({
  name,
  label,
  value,
  onChange,
  error,
  required = false,
  placeholder,
  disabled = false,
  isEdit = false,
  className = '',
  rows = 4,
}) => {
  return (
    <div className={`form-group ${className}`}>
      <label className="form-label">
        {label}
        {required && <span className="required-mark">*</span>}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        className={`form-input ${error ? 'form-input--error' : ''}`}
        placeholder={placeholder}
        disabled={disabled || isEdit}
        required={required}
        rows={rows}
      />
      {error && <span className="form-error">{error}</span>}
    </div>
  );
};

export default FormTextarea; 