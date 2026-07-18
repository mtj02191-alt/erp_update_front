import React from 'react';
import { FiX } from 'react-icons/fi';
import './styles.css';

/**
 * ClearButton Component
 * A reusable clear/reset button to clear all filters
 * 
 * @param {Function} onClick - Callback function when button is clicked
 * @param {String} text - Button text
 * @param {Boolean} disabled - Whether the button is disabled
 * @param {String} className - Additional CSS classes
 * @param {Boolean} showIcon - Whether to show clear icon
 */
const ClearButton = ({
  onClick,
  text = 'Clear Filters',
  disabled = false,
  className = '',
  showIcon = true
}) => {
  const handleClick = (e) => {
    e.preventDefault();
    if (onClick && !disabled) {
      onClick();
    }
  };

  return (
    <button
      type="button"
      className={`clear-button ${className}`}
      onClick={handleClick}
      disabled={disabled}
    >
      {showIcon && <FiX className="clear-button-icon" />}
      <span className="clear-button-text">{text}</span>
    </button>
  );
};

export default ClearButton;
