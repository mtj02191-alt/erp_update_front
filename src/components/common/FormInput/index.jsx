import React from 'react';
import './styles.css';

const FormInput = ({ 
  name, 
  label, 
  value, 
  onChange, 
  type = 'text', 
  required = false, 
  placeholder,
  ...rest 
}) => {
  return (
    <div className="form-group">
      {label && <label htmlFor={name} className="form-label">{label}</label>}
      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          className="form-input"
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          {...rest}
        />
      ) : (
        <input
          type={type}
          id={name}
          name={name}
          className="form-input"
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          {...rest}
        />
      )}
    </div>
  );
};

export default FormInput; 