import React, { useState, useRef, useEffect } from 'react';
import './MultiSelect.css';

const MultiSelect = ({
  name,
  label,
  options = [],
  value = [],
  onChange,
  required = false,
  disabled = false,
  error = '',
  className = '',
  placeholder = 'Select...',
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (optionValue) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const renderSelected = () => {
    if (!value.length) return <span className="multi-select-placeholder">{placeholder}</span>;
    return value.map((val) => {
      const opt = options.find((o) => (typeof o === 'string' ? o === val : o.value === val));
      const label = typeof opt === 'string' ? opt : opt?.label;
      return (
        <span className="multi-select-tag" key={val}>
          {label}
          <button
            type="button"
            className="multi-select-tag-remove"
            onClick={(e) => {
              e.stopPropagation();
              handleToggle(val);
            }}
            title="Remove"
          >
            ×
          </button>
        </span>
      );
    });
  };

  return (
    <div className={`form-group multi-select-group ${className}`} ref={ref}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="required-mark">*</span>}
        </label>
      )}
      <div
        className={`multi-select-control${disabled ? ' disabled' : ''}${open ? ' open' : ''}`}
        tabIndex={0}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') setOpen((o) => !o);
        }}
      >
        <div className="multi-select-value">
          {renderSelected()}
        </div>
        <span className="multi-select-arrow">▼</span>
      </div>
      {open && (
        <div className="multi-select-dropdown">
          {options.map((option) => {
            const optValue = typeof option === 'string' ? option : option.value;
            const optLabel = typeof option === 'string' ? option : option.label;
            return (
              <label key={optValue} className="multi-select-option">
                <input
                  type="checkbox"
                  name={name}
                  value={optValue}
                  checked={value.includes(optValue)}
                  onChange={() => handleToggle(optValue)}
                  disabled={disabled}
                />
                {optLabel}
              </label>
            );
          })}
        </div>
      )}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
};

export default MultiSelect;
