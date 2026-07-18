import React from 'react';

/**
 * PrimaryButton Component
 * A reusable primary button component that follows the application's design system
 * 
 * @param {string} type - Button type (submit, button, reset) - default: 'button'
 * @param {Function} onClick - Click handler function
 * @param {boolean} disabled - Whether the button is disabled
 * @param {boolean} loading - Whether the button is in loading state
 * @param {string} loadingText - Text to display when loading
 * @param {React.ReactNode} children - Button content
 * @param {string} className - Additional CSS classes
 * @param {object} style - Inline styles
 * @param {string} id - Button ID
 * @param {string} name - Button name
 * @param {React.ReactNode} icon - Optional icon element
 * @param {string} iconPosition - Icon position ('left' or 'right') - default: 'left'
 */
const PrimaryButton = ({
  type = 'button',
  onClick,
  disabled = false,
  loading = false,
  loadingText = 'Loading...',
  children,
  className = '',
  style = {},
  id,
  name,
  icon,
  iconPosition = 'left',
  ...rest
}) => {
  const isDisabled = disabled || loading;
  const buttonText = loading ? loadingText : children;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`primary_btn ${className}`}
      style={style}
      id={id}
      name={name}
      {...rest}
    >
      {icon && iconPosition === 'left' && (
        <span style={{ marginRight: '8px', display: 'inline-flex', alignItems: 'center' }}>
          {icon}
        </span>
      )}
      {buttonText}
      {icon && iconPosition === 'right' && (
        <span style={{ marginLeft: '8px', display: 'inline-flex', alignItems: 'center' }}>
          {icon}
        </span>
      )}
    </button>
  );
};

export default PrimaryButton;

