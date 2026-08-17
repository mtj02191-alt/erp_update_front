import React from 'react';
import { MdOutlineRefresh } from 'react-icons/md';
import './styles.css';

const RefreshButton = ({
  onClick,
  loading = false,
  disabled = false,
  title = 'Refresh',
  variant = 'inline',
  className = '',
  showLabel = false,
}) => {
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick && !disabled) {
      onClick();
    }
  };

  const isHeader = variant === 'header';

  return (
    <button
      type="button"
      className={`refresh-button refresh-button--${variant} ${loading ? 'refresh-button--loading' : ''} ${className}`.trim()}
      onClick={handleClick}
      disabled={disabled}
      title={title}
      aria-label={title}
    >
      <MdOutlineRefresh className={`refresh-button__icon${loading ? ' refresh-button__icon--spin' : ''}`} />
      {showLabel && !isHeader && <span className="refresh-button__label">Refresh</span>}
    </button>
  );
};

export default RefreshButton;
