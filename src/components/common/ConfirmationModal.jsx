import React from 'react';
import './ConfirmationModal.css';

const ConfirmationModal = ({
  isOpen,
  text,
  delete: isDelete = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirmation-modal-overlay" onClick={onCancel}>
      <div className="confirmation-modal" onClick={e => e.stopPropagation()}>
        <div className="confirmation-modal-content">
          <p className="confirmation-modal-text">{text}</p>
          <div className="confirmation-modal-buttons">
            <button
              className={`confirmation-modal-button confirm-button ${isDelete ? 'delete' : ''}`}
              onClick={onConfirm}
            >
              Confirm
            </button>
            <button
              className="confirmation-modal-button cancel-button"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal; 