import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMoreVertical } from 'react-icons/fi';
import './ActionMenu.css';

const ActionMenu = ({ actions, trigger }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleActionClick = (action) => {
    if (action.onClick) {
      action.onClick();
    }
    setIsModalOpen(false);
  };

  const renderDesktopAction = (action, index) => {
    if (!action.visible) return null;

    const className = `action-button ${action.disabled ? 'action-disabled' : ''}`;
    const style = { color: action.color };

    if (action.to && !action.disabled) {
      return (
        <Link
          key={index}
          to={action.to}
          state={action.state}
          className={className}
          style={{ ...style, textDecoration: 'inherit' }}
          title={action.label}
          onClick={() => setIsModalOpen(false)}
        >
          {action.icon}
        </Link>
      );
    }

    return (
      <button
        key={index}
        type="button"
        className={className}
        style={style}
        onClick={() => !action.disabled && handleActionClick(action)}
        title={action.label}
        disabled={action.disabled}
      >
        {action.icon}
      </button>
    );
  };

  const renderMobileAction = (action, index) => {
    if (!action.visible) return null;

    const className = `action-menu-item ${action.disabled ? 'action-disabled' : ''}`;

    if (action.to && !action.disabled) {
      return (
        <Link
          key={index}
          to={action.to}
          state={action.state}
          className={className}
          style={{ textDecoration: 'inherit', color: 'inherit' }}
          onClick={() => setIsModalOpen(false)}
        >
          <span className="action-icon" style={{ color: action.color }}>
            {action.icon}
          </span>
          <span className="action-label">{action.label}</span>
        </Link>
      );
    }

    return (
      <button
        key={index}
        type="button"
        className={className}
        onClick={() => !action.disabled && handleActionClick(action)}
        disabled={action.disabled}
      >
        <span className="action-icon" style={{ color: action.color }}>
          {action.icon}
        </span>
        <span className="action-label">{action.label}</span>
      </button>
    );
  };

  return (
    <div className="action-menu">
      <div className="action-buttons desktop-view">
        {Array.isArray(actions) && actions.map(renderDesktopAction)}
      </div>

      <div className="mobile-view">
        <button
          type="button"
          className="action-menu-trigger"
          onClick={() => setIsModalOpen(true)}
        >
          {trigger || <FiMoreVertical />}
        </button>

        {isModalOpen && (
          <>
            <div
              className="action-menu-backdrop"
              onClick={() => setIsModalOpen(false)}
            />
            <div className="action-menu-modal">
              {Array.isArray(actions) && actions.map(renderMobileAction)}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ActionMenu;
