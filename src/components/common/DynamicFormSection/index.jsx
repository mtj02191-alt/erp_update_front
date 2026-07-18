import React from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import './styles.css';

const DynamicFormSection = ({
  items,
  onAdd,
  onRemove,
  renderItem,
  titlePrefix,
  canRemove,
}) => {
  return (
    <div className="dynamic-sections-container">
      {items.map((item, index) => (
        <div key={item.id || index} className="dynamic-section-item">
          <div className="dynamic-section-header">
            <h4 className="dynamic-section-title">{`${titlePrefix} ${index + 1}`}</h4>
            <div className="dynamic-section-actions">
              {canRemove && (
                <button
                  type="button"
                  className="dynamic-action-btn remove-btn"
                  onClick={() => onRemove(item.id !== undefined ? item.id : index)}
                  title={`Remove ${titlePrefix}`}
                >
                  <FiTrash2 />
                </button>
              )}
              {index === items.length - 1 && (
                 <button
                    type="button"
                    className="dynamic-action-btn add-btn"
                    onClick={onAdd}
                    title={`Add new ${titlePrefix}`}
                >
                    <FiPlus />
                </button>
              )}
            </div>
          </div>
          <div className="dynamic-section-content">
            {renderItem(item, index)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DynamicFormSection; 