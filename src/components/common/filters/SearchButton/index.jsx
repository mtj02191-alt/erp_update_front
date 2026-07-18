import React from 'react';
import { FiSearch } from 'react-icons/fi';
import './styles.css';

/**
 * SearchButton Component
 * A reusable search/filter button to trigger API calls
 * 
 * @param {Function} onClick - Callback function when button is clicked
 * @param {String} text - Button text
 * @param {Boolean} disabled - Whether the button is disabled
 * @param {Boolean} loading - Whether to show loading state
 * @param {String} className - Additional CSS classes
 * @param {Boolean} showIcon - Whether to show search icon
 */
const SearchButton = ({
  onClick,
  text = 'Search',
  disabled = false,
  loading = false,
  className = '',
  showIcon = true
}) => {
  const handleClick = (e) => {
    e.preventDefault();
    if (onClick && !disabled && !loading) {
      onClick();
    }
  };

  return (
    <button
      type="button"
      className={`search-button ${className} ${loading ? 'search-button--loading' : ''}`}
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <>
          <span className="search-button-spinner"></span>
          <span className="search-button-text">Searching...</span>
        </>
      ) : (
        <>
          {showIcon && <FiSearch className="search-button-icon" />}
          <span className="search-button-text">{text}</span>
        </>
      )}
    </button>
  );
};

export default SearchButton;
