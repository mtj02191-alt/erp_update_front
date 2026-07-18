import React from 'react';
import './Card.css';

const Card = ({ title, data }) => {
  if (!data) return null;

  const renderValue = (value) => {
    if (value === null || value === undefined) return '';
    // Allow callers to pass React nodes (badges, links, etc.)
    if (React.isValidElement(value)) return value;
    if (typeof value === 'number') {
      // If it's a monetary value (check for specific fields)
      if (title.toLowerCase().includes('amount') || 
          title.toLowerCase().includes('funds') || 
          title.toLowerCase().includes('cash') || 
          title.toLowerCase().includes('inflow') || 
          title.toLowerCase().includes('outflow')) {
        return `$${value.toFixed(2)}`;
      }
      return value;
    }
    // If backend sends nested objects (e.g. `program`), avoid rendering raw objects.
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return '[object]';
      }
    }
    return value;
  };

  return (
    <div className="department-card">
      <h3 className="card-title">
        {title.replace(/_/g, ' ')}
      </h3>
      <div className="card-content">
        {Object.entries(data).map(([key, value]) => {
          // Skip metadata fields
          if (['id', 'created_at', 'date'].includes(key)) return null;
          
          return (
            <div key={key} className="data-row">
              <span className="data-label">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}</span>
              <span className="data-value">{renderValue(value)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Card; 