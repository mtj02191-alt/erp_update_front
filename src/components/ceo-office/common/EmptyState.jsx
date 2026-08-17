import React from 'react';
import { Link } from 'react-router-dom';
import { FaInbox } from 'react-icons/fa';
import './EmptyState.css';

const EmptyState = ({
  title = 'No items yet',
  // message = 'There is nothing to show here right now.',
  actionLabel,
  actionHref,
  onAction,
  icon: Icon = FaInbox,
  compact = false,
}) => {
  return (
    <div className={`ceo-empty-state ${compact ? 'ceo-empty-state-compact' : ''}`}>
      <div className="ceo-empty-state-icon">
        <Icon />
      </div>
      <h4>{title}</h4>
      {/* <p>{message}</p> */}
      {(actionLabel && (actionHref || onAction)) && (
        <div className="ceo-empty-state-actions">
          {actionHref ? (
            <Link to={actionHref} className="ceo-empty-state-link">
              {actionLabel}
            </Link>
          ) : (
            <button type="button" className="ceo-empty-state-link" onClick={onAction}>
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
